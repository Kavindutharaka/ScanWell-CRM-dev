using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly string _dbConnectionString;

        public DashboardController(IConfiguration configuration)
        {
            _dbConnectionString = configuration.GetSection("DBCon").Value;
        }

        // ====================================================================
        // MAIN DASHBOARD ENDPOINT
        // GET /api/dashboard?dateFrom=&dateTo=&userRoleId=&isAdmin=
        // Returns all dashboard data in a single call
        // Each section is wrapped in try/catch so one failure doesn't block all
        // ====================================================================
        [HttpGet]
        public ActionResult GetDashboardData(
            [FromQuery] string? dateFrom,
            [FromQuery] string? dateTo,
            [FromQuery] int? userRoleId,
            [FromQuery] bool isAdmin = false)
        {
            try
            {
                // Resolve EmployeeId (emp_reg.SysID) from user_roles.Id
                long? employeeId = null;
                if (!isAdmin && userRoleId.HasValue)
                {
                    employeeId = GetEmployeeIdFromRoleId(userRoleId.Value);
                }

                // Default date range: current month
                DateTime dtFrom, dtTo;
                if (!string.IsNullOrEmpty(dateFrom))
                    dtFrom = DateTime.Parse(dateFrom);
                else
                    dtFrom = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);

                if (!string.IsNullOrEmpty(dateTo))
                    dtTo = DateTime.Parse(dateTo);
                else
                    dtTo = DateTime.Now.Date;

                var result = new Dictionary<string, object>();
                var errors = new List<string>();

                // Each section uses its own connection + try/catch for isolation
                // 1. QUOTATION STATS
                try { result["quotationStats"] = GetQuotationStats(dtFrom, dtTo, employeeId, isAdmin); }
                catch (Exception ex) { errors.Add("quotationStats: " + ex.Message); result["quotationStats"] = new { totalQuotes = 0, approvedCount = 0, draftCount = 0, sentCount = 0, otherCount = 0 }; }

                // 2. PIPELINE CONVERSION
                try { result["pipelineConversion"] = GetPipelineConversion(dtFrom, dtTo, employeeId, isAdmin); }
                catch (Exception ex) { errors.Add("pipelineConversion: " + ex.Message); result["pipelineConversion"] = new List<object>(); }

                // 3. MONTHLY REVENUE
                try { result["monthlyRevenue"] = GetMonthlyRevenue(dtFrom, dtTo, employeeId, isAdmin); }
                catch (Exception ex) { errors.Add("monthlyRevenue: " + ex.Message); result["monthlyRevenue"] = new { rfqRevenue = new List<object>(), quoteVolume = new List<object>() }; }

                // 4. ACTIVITY STATS
                try { result["activityStats"] = GetActivityStats(dtFrom, dtTo, employeeId, isAdmin); }
                catch (Exception ex) { errors.Add("activityStats: " + ex.Message); result["activityStats"] = new { totalActivities = 0, completedActivities = 0, declinedActivities = 0, cancelledActivities = 0, pendingActivities = 0, typeBreakdown = new List<object>() }; }

                // 5. RFQ REVENUE TOTALS
                try { result["rfqRevenue"] = GetRfqRevenue(dtFrom, dtTo, employeeId, isAdmin); }
                catch (Exception ex) { errors.Add("rfqRevenue: " + ex.Message); result["rfqRevenue"] = new { totalRfqs = 0, totalEntries = 0, totalRevenue = 0m }; }

                // 6. DEAL STATS
                try { result["dealStats"] = GetDealStats(employeeId, isAdmin); }
                catch (Exception ex) { errors.Add("dealStats: " + ex.Message); result["dealStats"] = new { totalDeals = 0, wonDeals = 0, lostDeals = 0, activeDeals = 0, totalDealValue = 0m, wonDealValue = 0m }; }

                // 7. CUSTOMER STATS
                try { result["customerStats"] = GetCustomerStats(employeeId, isAdmin); }
                catch (Exception ex) { errors.Add("customerStats: " + ex.Message); result["customerStats"] = new { totalAccounts = 0 }; }

                // 8. RECENT ACTIVITIES
                try { result["recentActivities"] = GetRecentActivities(dtFrom, dtTo, employeeId, isAdmin); }
                catch (Exception ex) { errors.Add("recentActivities: " + ex.Message); result["recentActivities"] = new List<object>(); }

                // 9. TOP CUSTOMERS
                try { result["topCustomers"] = GetTopCustomers(dtFrom, dtTo, employeeId, isAdmin); }
                catch (Exception ex) { errors.Add("topCustomers: " + ex.Message); result["topCustomers"] = new List<object>(); }

                // 10. QUOTE OUTCOMES (won/lost from quote_outcomes table)
                try { result["quoteOutcomes"] = GetQuoteOutcomes(dtFrom, dtTo, employeeId, isAdmin); }
                catch (Exception ex) { errors.Add("quoteOutcomes: " + ex.Message); result["quoteOutcomes"] = new { wonQuotes = 0, lostQuotes = 0, totalWonAmount = 0m }; }

                result["dateFrom"] = dtFrom.ToString("yyyy-MM-dd");
                result["dateTo"] = dtTo.ToString("yyyy-MM-dd");

                if (errors.Count > 0)
                    result["_errors"] = errors;

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Dashboard error: " + ex.Message,
                    inner = ex.InnerException?.Message,
                    stack = ex.StackTrace
                });
            }
        }

        // ====================================================================
        // HELPER: Get EmployeeId from user_roles.Id
        // ====================================================================
        private long? GetEmployeeIdFromRoleId(int roleId)
        {
            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                string query = "SELECT EmployeeId FROM [dbo].[user_roles] WHERE Id = @Id AND IsActive = 1";
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@Id", roleId);
                    var result = cmd.ExecuteScalar();
                    if (result != null && result != DBNull.Value)
                    {
                        if (long.TryParse(result.ToString(), out long empId))
                            return empId;
                    }
                }
            }
            return null;
        }

        // ====================================================================
        // 1. QUOTATION STATS
        // ====================================================================
        private object GetQuotationStats(DateTime dtFrom, DateTime dtTo, long? empId, bool isAdmin)
        {
            string ownerFilter = (!isAdmin && empId.HasValue) ? " AND q.CreatedBy = @EmpId" : "";

            string query = $@"
                SELECT
                    COUNT(*) AS totalQuotes,
                    COUNT(CASE WHEN q.Status = 'approved' THEN 1 END) AS approvedCount,
                    COUNT(CASE WHEN q.Status = 'draft' THEN 1 END) AS draftCount,
                    COUNT(CASE WHEN q.Status = 'sent' THEN 1 END) AS sentCount
                FROM [dbo].[Quotes] q
                WHERE CAST(q.CreatedDate AS DATE) >= @DateFrom
                  AND CAST(q.CreatedDate AS DATE) <= @DateTo
                  {ownerFilter};";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.Add(new SqlParameter("@DateFrom", SqlDbType.Date) { Value = dtFrom });
                    cmd.Parameters.Add(new SqlParameter("@DateTo", SqlDbType.Date) { Value = dtTo });
                    if (!isAdmin && empId.HasValue)
                        cmd.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            int total = Convert.ToInt32(reader["totalQuotes"]);
                            int approved = Convert.ToInt32(reader["approvedCount"]);
                            int draft = Convert.ToInt32(reader["draftCount"]);
                            int sent = Convert.ToInt32(reader["sentCount"]);
                            return new
                            {
                                totalQuotes = total,
                                approvedCount = approved,
                                draftCount = draft,
                                sentCount = sent,
                                otherCount = total - approved - draft - sent
                            };
                        }
                    }
                }
            }
            return new { totalQuotes = 0, approvedCount = 0, draftCount = 0, sentCount = 0, otherCount = 0 };
        }

        // ====================================================================
        // 2. PIPELINE CONVERSION
        // ====================================================================
        private object GetPipelineConversion(DateTime dtFrom, DateTime dtTo, long? empId, bool isAdmin)
        {
            string ownerFilter = (!isAdmin && empId.HasValue) ? " AND q.CreatedBy = @EmpId" : "";

            string query = $@"
                SELECT
                    q.Status,
                    COUNT(*) AS cnt
                FROM [dbo].[Quotes] q
                WHERE CAST(q.CreatedDate AS DATE) >= @DateFrom
                  AND CAST(q.CreatedDate AS DATE) <= @DateTo
                  {ownerFilter}
                GROUP BY q.Status;";

            var items = new List<object>();
            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.Add(new SqlParameter("@DateFrom", SqlDbType.Date) { Value = dtFrom });
                    cmd.Parameters.Add(new SqlParameter("@DateTo", SqlDbType.Date) { Value = dtTo });
                    if (!isAdmin && empId.HasValue)
                        cmd.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                status = reader["Status"]?.ToString() ?? "unknown",
                                count = Convert.ToInt32(reader["cnt"])
                            });
                        }
                    }
                }
            }
            return items;
        }

        // ====================================================================
        // 3. MONTHLY REVENUE
        // ====================================================================
        private object GetMonthlyRevenue(DateTime dtFrom, DateTime dtTo, long? empId, bool isAdmin)
        {
            // RFQ revenue by month
            string rfqOwnerFilter = (!isAdmin && empId.HasValue) ? " AND r.added_by = CAST(@EmpId AS NVARCHAR(50))" : "";
            string rfqQuery = $@"
                SELECT
                    YEAR(se.created_at) AS yr,
                    MONTH(se.created_at) AS mn,
                    ISNULL(SUM(se.amount), 0) AS rfqRevenue,
                    COUNT(*) AS entryCount
                FROM [rfq_sales_entries] se
                INNER JOIN [dbo].[rfq] r ON se.rfq_id = r.sysID
                WHERE CAST(se.created_at AS DATE) >= @DateFrom
                  AND CAST(se.created_at AS DATE) <= @DateTo
                  {rfqOwnerFilter}
                GROUP BY YEAR(se.created_at), MONTH(se.created_at)
                ORDER BY yr, mn;";

            var rfqItems = new List<object>();
            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(rfqQuery, con))
                {
                    cmd.Parameters.Add(new SqlParameter("@DateFrom", SqlDbType.Date) { Value = dtFrom });
                    cmd.Parameters.Add(new SqlParameter("@DateTo", SqlDbType.Date) { Value = dtTo });
                    if (!isAdmin && empId.HasValue)
                        cmd.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            int yr = Convert.ToInt32(reader["yr"]);
                            int mn = Convert.ToInt32(reader["mn"]);
                            rfqItems.Add(new
                            {
                                year = yr,
                                month = mn,
                                monthName = new DateTime(yr, mn, 1).ToString("MMM"),
                                rfqRevenue = Convert.ToDecimal(reader["rfqRevenue"]),
                                entryCount = Convert.ToInt32(reader["entryCount"])
                            });
                        }
                    }
                }
            }

            // Quotes by month (count only, no amounts)
            string quoteOwnerFilter = (!isAdmin && empId.HasValue) ? " AND q.CreatedBy = @EmpId" : "";
            string quoteQuery = $@"
                SELECT
                    YEAR(q.CreatedDate) AS yr,
                    MONTH(q.CreatedDate) AS mn,
                    COUNT(*) AS quoteCount
                FROM [dbo].[Quotes] q
                WHERE CAST(q.CreatedDate AS DATE) >= @DateFrom
                  AND CAST(q.CreatedDate AS DATE) <= @DateTo
                  {quoteOwnerFilter}
                GROUP BY YEAR(q.CreatedDate), MONTH(q.CreatedDate)
                ORDER BY yr, mn;";

            var quoteItems = new List<object>();
            using (var con2 = new SqlConnection(_dbConnectionString))
            {
                con2.Open();
                using (var cmd2 = new SqlCommand(quoteQuery, con2))
                {
                    cmd2.Parameters.Add(new SqlParameter("@DateFrom", SqlDbType.Date) { Value = dtFrom });
                    cmd2.Parameters.Add(new SqlParameter("@DateTo", SqlDbType.Date) { Value = dtTo });
                    if (!isAdmin && empId.HasValue)
                        cmd2.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader2 = cmd2.ExecuteReader())
                    {
                        while (reader2.Read())
                        {
                            int yr = Convert.ToInt32(reader2["yr"]);
                            int mn = Convert.ToInt32(reader2["mn"]);
                            quoteItems.Add(new
                            {
                                year = yr,
                                month = mn,
                                monthName = new DateTime(yr, mn, 1).ToString("MMM"),
                                quoteCount = Convert.ToInt32(reader2["quoteCount"])
                            });
                        }
                    }
                }
            }

            return new { rfqRevenue = rfqItems, quoteVolume = quoteItems };
        }

        // ====================================================================
        // 4. ACTIVITY STATS
        // ====================================================================
        private object GetActivityStats(DateTime dtFrom, DateTime dtTo, long? empId, bool isAdmin)
        {
            // activity.owner stores SysID as string
            string ownerFilter = (!isAdmin && empId.HasValue)
                ? " AND a.owner = CAST(@EmpId AS NVARCHAR(50))"
                : "";

            string query = $@"
                SELECT
                    COUNT(*) AS totalActivities,
                    COUNT(CASE WHEN LOWER(a.status) = 'done' THEN 1 END) AS completedActivities,
                    COUNT(CASE WHEN LOWER(a.status) = 'declined' THEN 1 END) AS declinedActivities,
                    COUNT(CASE WHEN LOWER(a.status) = 'cancelled' THEN 1 END) AS cancelledActivities
                FROM [dbo].[activity] a
                WHERE CAST(a.start_time AS DATE) >= @DateFrom
                  AND CAST(a.start_time AS DATE) <= @DateTo
                  {ownerFilter};";

            int total = 0, completed = 0, declined = 0, cancelled = 0;
            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.Add(new SqlParameter("@DateFrom", SqlDbType.Date) { Value = dtFrom });
                    cmd.Parameters.Add(new SqlParameter("@DateTo", SqlDbType.Date) { Value = dtTo });
                    if (!isAdmin && empId.HasValue)
                        cmd.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            total = Convert.ToInt32(reader["totalActivities"]);
                            completed = Convert.ToInt32(reader["completedActivities"]);
                            declined = Convert.ToInt32(reader["declinedActivities"]);
                            cancelled = Convert.ToInt32(reader["cancelledActivities"]);
                        }
                    }
                }
            }

            // Activity type breakdown
            string typeQuery = $@"
                SELECT
                    ISNULL(a.activity_type, 'Other') AS activityType,
                    COUNT(*) AS cnt
                FROM [dbo].[activity] a
                WHERE CAST(a.start_time AS DATE) >= @DateFrom
                  AND CAST(a.start_time AS DATE) <= @DateTo
                  {ownerFilter}
                GROUP BY a.activity_type
                ORDER BY cnt DESC;";

            var typeBreakdown = new List<object>();
            using (var con2 = new SqlConnection(_dbConnectionString))
            {
                con2.Open();
                using (var cmd2 = new SqlCommand(typeQuery, con2))
                {
                    cmd2.Parameters.Add(new SqlParameter("@DateFrom", SqlDbType.Date) { Value = dtFrom });
                    cmd2.Parameters.Add(new SqlParameter("@DateTo", SqlDbType.Date) { Value = dtTo });
                    if (!isAdmin && empId.HasValue)
                        cmd2.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader2 = cmd2.ExecuteReader())
                    {
                        while (reader2.Read())
                        {
                            typeBreakdown.Add(new
                            {
                                type = reader2["activityType"].ToString(),
                                count = Convert.ToInt32(reader2["cnt"])
                            });
                        }
                    }
                }
            }

            return new
            {
                totalActivities = total,
                completedActivities = completed,
                declinedActivities = declined,
                cancelledActivities = cancelled,
                pendingActivities = total - completed - declined - cancelled,
                typeBreakdown = typeBreakdown
            };
        }

        // ====================================================================
        // 5. RFQ REVENUE
        // ====================================================================
        private object GetRfqRevenue(DateTime dtFrom, DateTime dtTo, long? empId, bool isAdmin)
        {
            string ownerFilter = (!isAdmin && empId.HasValue)
                ? " AND r.added_by = CAST(@EmpId AS NVARCHAR(50))"
                : "";

            // Filter by sales entry created_at date (not rfq valid_date)
            // so we capture revenue from entries created in the selected period
            string query = $@"
                SELECT
                    COUNT(DISTINCT se.rfq_id) AS totalRfqs,
                    COUNT(se.id) AS totalEntries,
                    ISNULL(SUM(se.amount), 0) AS totalRevenue
                FROM [rfq_sales_entries] se
                INNER JOIN [dbo].[rfq] r ON se.rfq_id = r.sysID
                WHERE CAST(se.created_at AS DATE) >= @DateFrom
                  AND CAST(se.created_at AS DATE) <= @DateTo
                  {ownerFilter};";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.Add(new SqlParameter("@DateFrom", SqlDbType.Date) { Value = dtFrom });
                    cmd.Parameters.Add(new SqlParameter("@DateTo", SqlDbType.Date) { Value = dtTo });
                    if (!isAdmin && empId.HasValue)
                        cmd.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new
                            {
                                totalRfqs = Convert.ToInt32(reader["totalRfqs"]),
                                totalEntries = Convert.ToInt32(reader["totalEntries"]),
                                totalRevenue = Convert.ToDecimal(reader["totalRevenue"])
                            };
                        }
                    }
                }
            }
            return new { totalRfqs = 0, totalEntries = 0, totalRevenue = 0m };
        }

        // ====================================================================
        // 6. DEAL STATS
        // ====================================================================
        private object GetDealStats(long? empId, bool isAdmin)
        {
            // deal_reg.owner stores either SysID or employee name, so check both
            string ownerFilter = (!isAdmin && empId.HasValue)
                ? @" WHERE (d.owner = CAST(@EmpId AS NVARCHAR(50))
                     OR d.owner = (SELECT ISNULL(fname,'') + ' ' + ISNULL(lname,'') FROM [dbo].[emp_reg] WHERE SysID = @EmpId))"
                : "";

            string query = $@"
                SELECT
                    COUNT(*) AS totalDeals,
                    COUNT(CASE WHEN d.stage = 'Won' THEN 1 END) AS wonDeals,
                    COUNT(CASE WHEN d.stage = 'Lost' THEN 1 END) AS lostDeals,
                    COUNT(CASE WHEN d.stage NOT IN ('Won','Lost') THEN 1 END) AS activeDeals,
                    ISNULL(SUM(TRY_CAST(REPLACE(d.dealsValue, ',', '') AS DECIMAL(18,2))), 0) AS totalDealValue,
                    ISNULL(SUM(CASE WHEN d.stage = 'Won' THEN TRY_CAST(REPLACE(d.dealsValue, ',', '') AS DECIMAL(18,2)) ELSE 0 END), 0) AS wonDealValue
                FROM [dbo].[deal_reg] d
                {ownerFilter};";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    if (!isAdmin && empId.HasValue)
                        cmd.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new
                            {
                                totalDeals = Convert.ToInt32(reader["totalDeals"]),
                                wonDeals = Convert.ToInt32(reader["wonDeals"]),
                                lostDeals = Convert.ToInt32(reader["lostDeals"]),
                                activeDeals = Convert.ToInt32(reader["activeDeals"]),
                                totalDealValue = Convert.ToDecimal(reader["totalDealValue"]),
                                wonDealValue = Convert.ToDecimal(reader["wonDealValue"])
                            };
                        }
                    }
                }
            }
            return new { totalDeals = 0, wonDeals = 0, lostDeals = 0, activeDeals = 0, totalDealValue = 0m, wonDealValue = 0m };
        }

        // ====================================================================
        // 7. CUSTOMER STATS
        // ====================================================================
        private object GetCustomerStats(long? empId, bool isAdmin)
        {
            string ownerFilter = (!isAdmin && empId.HasValue)
                ? " WHERE a.salesPerson = (SELECT ISNULL(fname,'') + ' ' + ISNULL(lname,'') FROM [dbo].[emp_reg] WHERE SysID = @EmpId)"
                : "";

            string query = $@"
                SELECT
                    COUNT(*) AS totalAccounts
                FROM [dbo].[account_reg] a
                {ownerFilter};";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    if (!isAdmin && empId.HasValue)
                        cmd.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new
                            {
                                totalAccounts = Convert.ToInt32(reader["totalAccounts"])
                            };
                        }
                    }
                }
            }
            return new { totalAccounts = 0 };
        }

        // ====================================================================
        // 8. RECENT ACTIVITIES
        // ====================================================================
        private object GetRecentActivities(DateTime dtFrom, DateTime dtTo, long? empId, bool isAdmin)
        {
            // activity.owner stores SysID as string
            string ownerFilter = (!isAdmin && empId.HasValue)
                ? " AND a.owner = CAST(@EmpId AS NVARCHAR(50))"
                : "";

            // Use TRY_CAST for the JOIN so it doesn't fail on non-numeric owner values
            string query = $@"
                SELECT TOP 10
                    a.id,
                    a.activity_name,
                    a.activity_type,
                    ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, '') AS owner_name,
                    a.start_time,
                    a.status,
                    a.related_account
                FROM [dbo].[activity] a
                LEFT JOIN [dbo].[emp_reg] e ON TRY_CAST(a.owner AS BIGINT) = e.SysID
                WHERE CAST(a.start_time AS DATE) >= @DateFrom
                  AND CAST(a.start_time AS DATE) <= @DateTo
                  {ownerFilter}
                ORDER BY a.start_time DESC;";

            var items = new List<object>();
            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.Add(new SqlParameter("@DateFrom", SqlDbType.Date) { Value = dtFrom });
                    cmd.Parameters.Add(new SqlParameter("@DateTo", SqlDbType.Date) { Value = dtTo });
                    if (!isAdmin && empId.HasValue)
                        cmd.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                id = reader["id"],
                                activityName = reader["activity_name"]?.ToString(),
                                activityType = reader["activity_type"]?.ToString(),
                                ownerName = reader["owner_name"]?.ToString()?.Trim(),
                                startTime = reader["start_time"] != DBNull.Value
                                    ? Convert.ToDateTime(reader["start_time"]).ToString("yyyy-MM-ddTHH:mm:ss")
                                    : null,
                                status = reader["status"]?.ToString(),
                                relatedAccount = reader["related_account"]?.ToString()
                            });
                        }
                    }
                }
            }
            return items;
        }

        // ====================================================================
        // 9. TOP CUSTOMERS BY QUOTES
        // ====================================================================
        private object GetTopCustomers(DateTime dtFrom, DateTime dtTo, long? empId, bool isAdmin)
        {
            string ownerFilter = (!isAdmin && empId.HasValue) ? " AND q.CreatedBy = @EmpId" : "";

            string query = $@"
                SELECT TOP 5
                    q.Customer,
                    COUNT(*) AS quoteCount
                FROM [dbo].[Quotes] q
                WHERE q.Customer IS NOT NULL AND q.Customer <> ''
                  AND CAST(q.CreatedDate AS DATE) >= @DateFrom
                  AND CAST(q.CreatedDate AS DATE) <= @DateTo
                  {ownerFilter}
                GROUP BY q.Customer
                ORDER BY quoteCount DESC;";

            var items = new List<object>();
            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.Add(new SqlParameter("@DateFrom", SqlDbType.Date) { Value = dtFrom });
                    cmd.Parameters.Add(new SqlParameter("@DateTo", SqlDbType.Date) { Value = dtTo });
                    if (!isAdmin && empId.HasValue)
                        cmd.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                customer = reader["Customer"]?.ToString(),
                                quoteCount = Convert.ToInt32(reader["quoteCount"])
                            });
                        }
                    }
                }
            }
            return items;
        }

        // ====================================================================
        // 10. QUOTE OUTCOMES (won/lost from quote_outcomes table)
        // ====================================================================
        private object GetQuoteOutcomes(DateTime dtFrom, DateTime dtTo, long? empId, bool isAdmin)
        {
            // quote_outcomes links to Quotes via quote_id
            // Filter by quote's CreatedDate within date range
            string ownerFilter = (!isAdmin && empId.HasValue) ? " AND q.CreatedBy = @EmpId" : "";

            string query = $@"
                SELECT
                    COUNT(CASE WHEN qo.outcome_status = 'won' THEN 1 END) AS wonQuotes,
                    COUNT(CASE WHEN qo.outcome_status = 'lost' THEN 1 END) AS lostQuotes,
                    ISNULL(SUM(CASE WHEN qo.outcome_status = 'won' THEN qo.won_amount ELSE 0 END), 0) AS totalWonAmount
                FROM quote_outcomes qo
                INNER JOIN [dbo].[Quotes] q ON qo.quote_id = q.QuoteId
                WHERE CAST(qo.created_date AS DATE) >= @DateFrom
                  AND CAST(qo.created_date AS DATE) <= @DateTo
                  {ownerFilter};";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.Add(new SqlParameter("@DateFrom", SqlDbType.Date) { Value = dtFrom });
                    cmd.Parameters.Add(new SqlParameter("@DateTo", SqlDbType.Date) { Value = dtTo });
                    if (!isAdmin && empId.HasValue)
                        cmd.Parameters.AddWithValue("@EmpId", empId.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new
                            {
                                wonQuotes = Convert.ToInt32(reader["wonQuotes"]),
                                lostQuotes = Convert.ToInt32(reader["lostQuotes"]),
                                totalWonAmount = Convert.ToDecimal(reader["totalWonAmount"])
                            };
                        }
                    }
                }
            }
            return new { wonQuotes = 0, lostQuotes = 0, totalWonAmount = 0m };
        }
    }
}
