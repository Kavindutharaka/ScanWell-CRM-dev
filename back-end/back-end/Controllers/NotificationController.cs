using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly string _dbConnectionString;

        public NotificationController(IConfiguration configuration)
        {
            _dbConnectionString = configuration.GetSection("DBCon").Value;
        }

        // ====================================================================
        // GET /api/Notification?userRoleId=
        // Returns computed notifications + unseen count from notification_seen table
        // Each section is wrapped in try/catch so one failure doesn't block all
        // ====================================================================
        [HttpGet]
        public ActionResult GetNotifications([FromQuery] int? userRoleId)
        {
            try
            {
                // Resolve EmployeeId (emp_reg.SysID) from user_roles.Id
                long? employeeId = null;
                if (userRoleId.HasValue)
                {
                    employeeId = GetEmployeeIdFromRoleId(userRoleId.Value);
                }

                var result = new Dictionary<string, object>();
                var errors = new List<string>();

                // 1. ACTIVITY REMINDERS — activities ending within 2 hours (user-specific)
                try { result["activityReminders"] = GetActivityReminders(employeeId); }
                catch (Exception ex) { errors.Add("activityReminders: " + ex.Message); result["activityReminders"] = new List<object>(); }

                // 2. QUOTE EXPIRATIONS — rate validity expiring within 3 days (user-specific)
                try { result["quoteExpirations"] = GetQuoteExpirations(employeeId); }
                catch (Exception ex) { errors.Add("quoteExpirations: " + ex.Message); result["quoteExpirations"] = new List<object>(); }

                // 3. RFQ EXPIRATIONS — RFQs expiring within 24 hours (all users)
                try { result["rfqExpirations"] = GetRfqExpirations(); }
                catch (Exception ex) { errors.Add("rfqExpirations: " + ex.Message); result["rfqExpirations"] = new List<object>(); }

                // 4. RATE EXPIRATIONS — rates expiring within 7 days (all users)
                try { result["rateExpirations"] = GetRateExpirations(); }
                catch (Exception ex) { errors.Add("rateExpirations: " + ex.Message); result["rateExpirations"] = new List<object>(); }

                // 5. NEW QUOTES — quotes created in last 24 hours (all users)
                try { result["newQuotes"] = GetNewQuotes(); }
                catch (Exception ex) { errors.Add("newQuotes: " + ex.Message); result["newQuotes"] = new List<object>(); }

                // 6. NEW RFQs — recently added RFQs in last 24 hours (all users)
                try { result["newRfqs"] = GetNewRfqs(); }
                catch (Exception ex) { errors.Add("newRfqs: " + ex.Message); result["newRfqs"] = new List<object>(); }

                // 7. NEWS FEED UPDATES — new uploads in last 24 hours (all users)
                try { result["newsFeedUpdates"] = GetNewsFeedUpdates(); }
                catch (Exception ex) { errors.Add("newsFeedUpdates: " + ex.Message); result["newsFeedUpdates"] = new List<object>(); }

                // 8. QUOTE OUTCOMES — won/lost in last 7 days (user-specific)
                try { result["quoteOutcomes"] = GetQuoteOutcomes(employeeId); }
                catch (Exception ex) { errors.Add("quoteOutcomes: " + ex.Message); result["quoteOutcomes"] = new List<object>(); }

                // Calculate total count
                int totalCount = 0;
                foreach (var kvp in result)
                {
                    if (kvp.Value is List<object> list)
                        totalCount += list.Count;
                    else if (kvp.Value is IList<object> ilist)
                        totalCount += ilist.Count;
                }
                result["totalCount"] = totalCount;

                // Get unseen count from notification_seen table
                int unseenCount = totalCount;
                if (userRoleId.HasValue)
                {
                    try { unseenCount = GetUnseenCount(userRoleId.Value, totalCount); }
                    catch { /* fallback to totalCount */ }
                }
                result["unseenCount"] = unseenCount;

                if (errors.Count > 0)
                    result["_errors"] = errors;

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Notification error: " + ex.Message,
                    inner = ex.InnerException?.Message
                });
            }
        }

        // ====================================================================
        // POST /api/Notification/mark-seen?userRoleId=&totalCount=
        // Upserts notification_seen table to mark notifications as read
        // totalCount = the current notification count the user has seen
        // ====================================================================
        [HttpPost("mark-seen")]
        public ActionResult MarkAsSeen([FromQuery] int? userRoleId, [FromQuery] int totalCount = 0)
        {
            if (!userRoleId.HasValue)
                return BadRequest("userRoleId is required");

            try
            {
                using (var con = new SqlConnection(_dbConnectionString))
                {
                    con.Open();
                    string query = @"
                        IF EXISTS (SELECT 1 FROM [dbo].[notification_seen] WHERE user_role_id = @UserRoleId)
                            UPDATE [dbo].[notification_seen] SET last_seen_at = GETDATE(), last_seen_count = @Count WHERE user_role_id = @UserRoleId
                        ELSE
                            INSERT INTO [dbo].[notification_seen] (user_role_id, last_seen_at, last_seen_count) VALUES (@UserRoleId, GETDATE(), @Count)";
                    using (var cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@UserRoleId", userRoleId.Value);
                        cmd.Parameters.AddWithValue("@Count", totalCount);
                        cmd.ExecuteNonQuery();
                    }
                }
                return Ok(new { message = "Notifications marked as seen" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }
        }

        // ====================================================================
        // HELPER: Get unseen count — compare current total vs last seen
        // ====================================================================
        private int GetUnseenCount(int userRoleId, int currentTotal)
        {
            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                string query = "SELECT last_seen_at, last_seen_count FROM [dbo].[notification_seen] WHERE user_role_id = @UserRoleId";
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@UserRoleId", userRoleId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            int lastSeenCount = reader["last_seen_count"] != DBNull.Value
                                ? Convert.ToInt32(reader["last_seen_count"])
                                : 0;
                            DateTime lastSeenAt = reader["last_seen_at"] != DBNull.Value
                                ? Convert.ToDateTime(reader["last_seen_at"])
                                : DateTime.MinValue;

                            // If user saw notifications today, show diff between current and what they saw
                            if (lastSeenAt.Date == DateTime.Now.Date)
                            {
                                int diff = currentTotal - lastSeenCount;
                                return diff > 0 ? diff : 0;
                            }
                            // If last seen was a different day, all are unseen
                            return currentTotal;
                        }
                    }
                }
            }
            // Never seen → all unseen
            return currentTotal;
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
        // 1. ACTIVITY REMINDERS — ending within 2 hours (user-specific)
        // ====================================================================
        private List<object> GetActivityReminders(long? empId)
        {
            var items = new List<object>();
            if (!empId.HasValue) return items;

            string query = @"
                SELECT TOP 20
                    a.id,
                    a.activity_name,
                    a.activity_type,
                    a.end_time,
                    a.status
                FROM [dbo].[activity] a
                WHERE a.end_time IS NOT NULL
                  AND a.end_time >= GETDATE()
                  AND a.end_time <= DATEADD(HOUR, 2, GETDATE())
                  AND a.owner = CAST(@EmpId AS NVARCHAR(50))
                  AND LOWER(ISNULL(a.status, '')) NOT IN ('done', 'cancelled', 'declined', 'completed')
                ORDER BY a.end_time ASC;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@EmpId", empId.Value);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                id = Convert.ToInt64(reader["id"]),
                                activityName = reader["activity_name"]?.ToString(),
                                activityType = reader["activity_type"]?.ToString(),
                                endTime = reader["end_time"] != DBNull.Value
                                    ? Convert.ToDateTime(reader["end_time"]).ToString("yyyy-MM-ddTHH:mm:ss")
                                    : null,
                                status = reader["status"]?.ToString()
                            });
                        }
                    }
                }
            }
            return items;
        }

        // ====================================================================
        // 2. QUOTE EXPIRATIONS — rate validity expiring within 3 days (user-specific)
        // ====================================================================
        private List<object> GetQuoteExpirations(long? empId)
        {
            var items = new List<object>();
            if (!empId.HasValue) return items;

            string query = @"
                SELECT TOP 20
                    q.QuoteId,
                    q.QuoteNumber,
                    q.Customer,
                    q.RateValidity
                FROM [dbo].[Quotes] q
                WHERE q.RateValidity IS NOT NULL
                  AND CAST(q.RateValidity AS DATE) >= CAST(GETDATE() AS DATE)
                  AND CAST(q.RateValidity AS DATE) <= DATEADD(DAY, 3, CAST(GETDATE() AS DATE))
                  AND q.CreatedBy = @EmpId
                  AND LOWER(ISNULL(q.Status, '')) NOT IN ('expired', 'rejected')
                ORDER BY q.RateValidity ASC;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@EmpId", empId.Value);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                quoteId = Convert.ToInt64(reader["QuoteId"]),
                                quoteNumber = reader["QuoteNumber"]?.ToString(),
                                customer = reader["Customer"]?.ToString(),
                                rateValidity = reader["RateValidity"] != DBNull.Value
                                    ? Convert.ToDateTime(reader["RateValidity"]).ToString("yyyy-MM-dd")
                                    : null
                            });
                        }
                    }
                }
            }
            return items;
        }

        // ====================================================================
        // 3. RFQ EXPIRATIONS — expiring within 24 hours (all users)
        // ====================================================================
        private List<object> GetRfqExpirations()
        {
            var items = new List<object>();

            string query = @"
                SELECT TOP 20
                    r.sysID,
                    r.rfq_number,
                    r.customer,
                    r.valid_date
                FROM [dbo].[rfq] r
                WHERE r.valid_date IS NOT NULL
                  AND CAST(r.valid_date AS DATE) >= CAST(GETDATE() AS DATE)
                  AND CAST(r.valid_date AS DATE) <= DATEADD(DAY, 1, CAST(GETDATE() AS DATE))
                ORDER BY r.valid_date ASC;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                sysId = Convert.ToInt64(reader["sysID"]),
                                rfqNumber = reader["rfq_number"]?.ToString(),
                                customer = reader["customer"]?.ToString(),
                                validDate = reader["valid_date"] != DBNull.Value
                                    ? Convert.ToDateTime(reader["valid_date"]).ToString("yyyy-MM-dd")
                                    : null
                            });
                        }
                    }
                }
            }
            return items;
        }

        // ====================================================================
        // 4. RATE EXPIRATIONS — rates expiring within 7 days (all users)
        //    Queries: rates, linear_rates, destination_rates
        // ====================================================================
        private List<object> GetRateExpirations()
        {
            var items = new List<object>();

            // 4a. General rates (validateDate is string ISO format)
            string ratesQuery = @"
                SELECT TOP 10
                    r.sysID AS id,
                    'General' AS rateType,
                    r.freightType,
                    r.origin,
                    r.destination,
                    r.validateDate
                FROM [dbo].[rates] r
                WHERE r.validateDate IS NOT NULL
                  AND r.validateDate <> ''
                  AND TRY_CAST(r.validateDate AS DATE) >= CAST(GETDATE() AS DATE)
                  AND TRY_CAST(r.validateDate AS DATE) <= DATEADD(DAY, 7, CAST(GETDATE() AS DATE))
                ORDER BY TRY_CAST(r.validateDate AS DATE) ASC;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(ratesQuery, con))
                {
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                id = Convert.ToInt64(reader["id"]),
                                rateType = reader["rateType"]?.ToString(),
                                freightType = reader["freightType"]?.ToString(),
                                origin = reader["origin"]?.ToString(),
                                destination = reader["destination"]?.ToString(),
                                validateDate = reader["validateDate"]?.ToString()
                            });
                        }
                    }
                }
            }

            // 4b. Linear rates (valid is DATE type)
            string linearQuery = @"
                SELECT TOP 10
                    lr.id,
                    'Linear' AS rateType,
                    lr.category AS freightType,
                    lr.pol AS origin,
                    lr.pod AS destination,
                    lr.valid AS validateDate
                FROM [dbo].[linear_rates] lr
                WHERE lr.valid IS NOT NULL
                  AND CAST(lr.valid AS DATE) >= CAST(GETDATE() AS DATE)
                  AND CAST(lr.valid AS DATE) <= DATEADD(DAY, 7, CAST(GETDATE() AS DATE))
                ORDER BY lr.valid ASC;";

            using (var con2 = new SqlConnection(_dbConnectionString))
            {
                con2.Open();
                using (var cmd2 = new SqlCommand(linearQuery, con2))
                {
                    using (var reader2 = cmd2.ExecuteReader())
                    {
                        while (reader2.Read())
                        {
                            items.Add(new
                            {
                                id = Convert.ToInt64(reader2["id"]),
                                rateType = reader2["rateType"]?.ToString(),
                                freightType = reader2["freightType"]?.ToString(),
                                origin = reader2["origin"]?.ToString(),
                                destination = reader2["destination"]?.ToString(),
                                validateDate = reader2["validateDate"] != DBNull.Value
                                    ? Convert.ToDateTime(reader2["validateDate"]).ToString("yyyy-MM-dd")
                                    : null
                            });
                        }
                    }
                }
            }

            // 4c. Destination rates (valid is DATE type)
            string destQuery = @"
                SELECT TOP 10
                    dr.id,
                    'Destination' AS rateType,
                    dr.category AS freightType,
                    '' AS origin,
                    dr.destination,
                    dr.valid AS validateDate
                FROM [dbo].[destination_rates] dr
                WHERE dr.valid IS NOT NULL
                  AND CAST(dr.valid AS DATE) >= CAST(GETDATE() AS DATE)
                  AND CAST(dr.valid AS DATE) <= DATEADD(DAY, 7, CAST(GETDATE() AS DATE))
                ORDER BY dr.valid ASC;";

            using (var con3 = new SqlConnection(_dbConnectionString))
            {
                con3.Open();
                using (var cmd3 = new SqlCommand(destQuery, con3))
                {
                    using (var reader3 = cmd3.ExecuteReader())
                    {
                        while (reader3.Read())
                        {
                            items.Add(new
                            {
                                id = Convert.ToInt64(reader3["id"]),
                                rateType = reader3["rateType"]?.ToString(),
                                freightType = reader3["freightType"]?.ToString(),
                                origin = reader3["origin"]?.ToString(),
                                destination = reader3["destination"]?.ToString(),
                                validateDate = reader3["validateDate"] != DBNull.Value
                                    ? Convert.ToDateTime(reader3["validateDate"]).ToString("yyyy-MM-dd")
                                    : null
                            });
                        }
                    }
                }
            }

            return items;
        }

        // ====================================================================
        // 5. NEW QUOTES — created in last 24 hours (all users)
        // ====================================================================
        private List<object> GetNewQuotes()
        {
            var items = new List<object>();

            string query = @"
                SELECT TOP 15
                    q.QuoteId,
                    q.QuoteNumber,
                    q.Customer,
                    q.FreightCategory,
                    q.CreatedDate
                FROM [dbo].[Quotes] q
                WHERE q.CreatedDate >= DATEADD(HOUR, -24, GETDATE())
                ORDER BY q.CreatedDate DESC;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                quoteId = Convert.ToInt64(reader["QuoteId"]),
                                quoteNumber = reader["QuoteNumber"]?.ToString(),
                                customer = reader["Customer"]?.ToString(),
                                freightCategory = reader["FreightCategory"]?.ToString(),
                                createdDate = reader["CreatedDate"] != DBNull.Value
                                    ? Convert.ToDateTime(reader["CreatedDate"]).ToString("yyyy-MM-ddTHH:mm:ss")
                                    : null
                            });
                        }
                    }
                }
            }
            return items;
        }

        // ====================================================================
        // 6. NEW RFQs — recently added (all users)
        // ====================================================================
        private List<object> GetNewRfqs()
        {
            var items = new List<object>();

            string query = @"
                SELECT TOP 15
                    r.sysID,
                    r.rfq_number,
                    r.customer,
                    r.created_at
                FROM [dbo].[rfq] r
                WHERE r.created_at IS NOT NULL
                  AND r.created_at >= DATEADD(HOUR, -24, GETDATE())
                ORDER BY r.created_at DESC;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                sysId = Convert.ToInt64(reader["sysID"]),
                                rfqNumber = reader["rfq_number"]?.ToString(),
                                customer = reader["customer"]?.ToString(),
                                createdAt = reader["created_at"] != DBNull.Value
                                    ? Convert.ToDateTime(reader["created_at"]).ToString("yyyy-MM-ddTHH:mm:ss")
                                    : null
                            });
                        }
                    }
                }
            }
            return items;
        }

        // ====================================================================
        // 7. NEWS FEED UPDATES — new uploads in last 24 hours (all users)
        // ====================================================================
        private List<object> GetNewsFeedUpdates()
        {
            var items = new List<object>();

            string query = @"
                SELECT TOP 10
                    nf.SysID,
                    nf.caption,
                    nf.created_at
                FROM [dbo].[news_feed] nf
                WHERE nf.created_at >= DATEADD(HOUR, -24, GETDATE())
                  AND nf.is_active = 1
                ORDER BY nf.created_at DESC;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                sysId = Convert.ToInt64(reader["SysID"]),
                                caption = reader["caption"]?.ToString(),
                                createdAt = reader["created_at"] != DBNull.Value
                                    ? Convert.ToDateTime(reader["created_at"]).ToString("yyyy-MM-ddTHH:mm:ss")
                                    : null
                            });
                        }
                    }
                }
            }
            return items;
        }

        // ====================================================================
        // 8. QUOTE OUTCOMES — won/lost in last 7 days (user-specific)
        // ====================================================================
        private List<object> GetQuoteOutcomes(long? empId)
        {
            var items = new List<object>();
            if (!empId.HasValue) return items;

            string query = @"
                SELECT TOP 20
                    qo.outcome_id,
                    qo.quote_id,
                    q.QuoteNumber,
                    q.Customer,
                    qo.outcome_status,
                    qo.created_date
                FROM [dbo].[quote_outcomes] qo
                INNER JOIN [dbo].[Quotes] q ON qo.quote_id = q.QuoteId
                WHERE qo.created_date >= DATEADD(DAY, -7, GETDATE())
                  AND q.CreatedBy = @EmpId
                ORDER BY qo.created_date DESC;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@EmpId", empId.Value);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            items.Add(new
                            {
                                outcomeId = Convert.ToInt64(reader["outcome_id"]),
                                quoteId = Convert.ToInt64(reader["quote_id"]),
                                quoteNumber = reader["QuoteNumber"]?.ToString(),
                                customer = reader["Customer"]?.ToString(),
                                outcomeStatus = reader["outcome_status"]?.ToString(),
                                createdDate = reader["created_date"] != DBNull.Value
                                    ? Convert.ToDateTime(reader["created_date"]).ToString("yyyy-MM-ddTHH:mm:ss")
                                    : null
                            });
                        }
                    }
                }
            }
            return items;
        }
    }
}
