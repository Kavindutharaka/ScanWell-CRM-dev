using System;
using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly string _dbConnectionString;

        public ReportController(IConfiguration configuration)
        {
            _dbConnectionString = configuration.GetSection("DBCon").Value;
        }

        // ====================================================================
        // 1. QUOTATION REPORT
        // Filters: dateFrom, dateTo, freightCategory, freightMode, country,
        //          salesPerson, department
        // ====================================================================
        [HttpGet, Route("quotation")]
        public ActionResult GetQuotationReport(
            [FromQuery] string? dateFrom,
            [FromQuery] string? dateTo,
            [FromQuery] string? freightCategory,
            [FromQuery] string? freightMode,
            [FromQuery] string? country,
            [FromQuery] string? salesPerson,
            [FromQuery] string? department)
        {
            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrEmpty(dateFrom))
            {
                conditions.Add("q.CreatedDate >= @DateFrom");
                var pFrom = new SqlParameter("@DateFrom", System.Data.SqlDbType.Date);
                pFrom.Value = DateTime.Parse(dateFrom);
                parameters.Add(pFrom);
            }
            if (!string.IsNullOrEmpty(dateTo))
            {
                conditions.Add("q.CreatedDate <= @DateTo");
                var pTo = new SqlParameter("@DateTo", System.Data.SqlDbType.Date);
                pTo.Value = DateTime.Parse(dateTo);
                parameters.Add(pTo);
            }
            if (!string.IsNullOrEmpty(freightCategory) && freightCategory != "all")
            {
                conditions.Add("q.FreightCategory = @FreightCategory");
                parameters.Add(new SqlParameter("@FreightCategory", freightCategory));
            }
            if (!string.IsNullOrEmpty(freightMode) && freightMode != "all")
            {
                // Support multiple modes (comma-separated)
                var modes = freightMode.Split(',').Select(m => m.Trim()).Where(m => !string.IsNullOrEmpty(m)).ToList();
                if (modes.Count == 1)
                {
                    conditions.Add("(q.FreightCategory + '-' + q.FreightMode) = @FreightMode");
                    parameters.Add(new SqlParameter("@FreightMode", modes[0]));
                }
                else if (modes.Count > 1)
                {
                    var modeParams = new List<string>();
                    for (int i = 0; i < modes.Count; i++)
                    {
                        modeParams.Add($"@FreightMode{i}");
                        parameters.Add(new SqlParameter($"@FreightMode{i}", modes[i]));
                    }
                    conditions.Add($"(q.FreightCategory + '-' + q.FreightMode) IN ({string.Join(",", modeParams)})");
                }
            }
            if (!string.IsNullOrEmpty(country))
            {
                conditions.Add("(q.PortOfLoading LIKE @Country OR q.PortOfDischarge LIKE @Country OR q.DeliveryLocation LIKE @Country OR q.PickupLocation LIKE @Country)");
                parameters.Add(new SqlParameter("@Country", "%" + country + "%"));
            }
            if (!string.IsNullOrEmpty(salesPerson) && salesPerson != "all")
            {
                conditions.Add("(ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, '')) = @SalesPerson");
                parameters.Add(new SqlParameter("@SalesPerson", salesPerson));
            }
            if (!string.IsNullOrEmpty(department) && department != "all")
            {
                conditions.Add("e.department = @Department");
                parameters.Add(new SqlParameter("@Department", department));
            }

            string whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

            string query = $@"
                SELECT
                    q.QuoteId,
                    q.QuoteNumber,
                    q.FreightCategory,
                    q.FreightMode,
                    q.FreightType,
                    q.CreatedDate,
                    q.RateValidity,
                    q.Customer,
                    q.ContactName,
                    q.PickupLocation,
                    q.DeliveryLocation,
                    q.PortOfLoading,
                    q.PortOfDischarge,
                    q.Status,
                    q.CreatedBy,
                    ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, '') AS SalesPerson,
                    e.department AS Department,
                    qo.outcome_status AS OutcomeStatus,
                    qo.won_amount AS WonAmount,
                    qo.lost_reason AS LostReason,
                    qo.created_date AS OutcomeDate
                FROM [dbo].[Quotes] q
                LEFT JOIN [dbo].[emp_reg] e ON q.CreatedBy = e.SysID
                LEFT JOIN [dbo].[quote_outcomes] qo ON q.QuoteId = qo.quote_id
                {whereClause}
                ORDER BY q.CreatedDate DESC, q.QuoteId DESC;";

            DataTable tb = new DataTable();
            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    foreach (var p in parameters)
                        cmd.Parameters.Add(p);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        tb.Load(reader);
                    }
                }
            }

            return Ok(tb);
        }

        // ====================================================================
        // 2. SALES ACTIVITY REPORT
        // Filters: dateFrom, dateTo, salesPerson
        // ====================================================================
        [HttpGet, Route("sales-activity")]
        public ActionResult GetSalesActivityReport(
            [FromQuery] string? dateFrom,
            [FromQuery] string? dateTo,
            [FromQuery] string? salesPerson)
        {
            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrEmpty(dateFrom))
            {
                conditions.Add("CAST(a.start_time AS DATE) >= @DateFrom");
                var pFrom = new SqlParameter("@DateFrom", System.Data.SqlDbType.Date);
                pFrom.Value = DateTime.Parse(dateFrom);
                parameters.Add(pFrom);
            }
            if (!string.IsNullOrEmpty(dateTo))
            {
                conditions.Add("CAST(a.start_time AS DATE) <= @DateTo");
                var pTo = new SqlParameter("@DateTo", System.Data.SqlDbType.Date);
                pTo.Value = DateTime.Parse(dateTo);
                parameters.Add(pTo);
            }
            if (!string.IsNullOrEmpty(salesPerson) && salesPerson != "all")
            {
                conditions.Add("(ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, '')) = @SalesPerson");
                parameters.Add(new SqlParameter("@SalesPerson", salesPerson));
            }

            string whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

            string query = $@"
                SELECT
                    a.id,
                    a.activity_name AS ActivityName,
                    a.activity_type AS ActivityType,
                    ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, '') AS SalesPerson,
                    a.start_time AS StartTime,
                    a.end_time AS EndTime,
                    a.status AS Status,
                    a.related_account AS RelatedAccount,
                    (SELECT TOP 1 sl.note FROM [dbo].[status_logs] sl
                     WHERE sl.activity_id = a.id
                     ORDER BY sl.created_at DESC) AS LatestComment
                FROM [dbo].[activity] a
                LEFT JOIN [dbo].[emp_reg] e ON a.owner = e.SysID
                {whereClause}
                ORDER BY a.start_time DESC, a.id DESC;";

            DataTable tb = new DataTable();
            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    foreach (var p in parameters)
                        cmd.Parameters.Add(p);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        tb.Load(reader);
                    }
                }
            }

            return Ok(tb);
        }

        // ====================================================================
        // 3. USER LIST (EMPLOYEE) REPORT
        // Returns: Name, Position, Department
        // ====================================================================
        [HttpGet, Route("user-list")]
        public ActionResult GetUserListReport()
        {
            string query = @"
                SELECT
                    SysID,
                    ISNULL(fname, '') + ' ' + ISNULL(lname, '') AS FullName,
                    fname AS FirstName,
                    lname AS LastName,
                    position AS Position,
                    department AS Department,
                    email AS Email,
                    tp AS Phone,
                    w_location AS WorkLocation,
                    status AS Status
                FROM [dbo].[emp_reg]
                ORDER BY fname, lname;";

            DataTable tb = new DataTable();
            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        tb.Load(reader);
                    }
                }
            }

            return Ok(tb);
        }

        // ====================================================================
        // 4. CUSTOMER LIST (ACCOUNT) REPORT
        // Filters: salesPerson (or all)
        // ====================================================================
        [HttpGet, Route("customer-list")]
        public ActionResult GetCustomerListReport(
            [FromQuery] string? salesPerson)
        {
            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrEmpty(salesPerson) && salesPerson != "all")
            {
                conditions.Add("salesPerson = @SalesPerson");
                parameters.Add(new SqlParameter("@SalesPerson", salesPerson));
            }

            string whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

            string query = $@"
                SELECT
                    SysID,
                    accountName AS AccountName,
                    domain AS Domain,
                    fmsCode AS FmsCode,
                    accountType AS AccountType,
                    industry AS Industry,
                    tp AS Phone,
                    location AS Location,
                    salesPerson AS SalesPerson,
                    primaryContact AS PrimaryContact,
                    primaryEmail AS PrimaryEmail,
                    primaryMobile AS PrimaryMobile,
                    description AS Description
                FROM [dbo].[account_reg]
                {whereClause}
                ORDER BY accountName;";

            DataTable tb = new DataTable();
            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    foreach (var p in parameters)
                        cmd.Parameters.Add(p);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        tb.Load(reader);
                    }
                }
            }

            return Ok(tb);
        }

        // ====================================================================
        // HELPER: Get distinct values for filter dropdowns
        // ====================================================================

        // Get distinct salesperson names
        [HttpGet, Route("filter/salespersons")]
        public ActionResult GetSalespersons()
        {
            string query = @"
                SELECT DISTINCT ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, '') AS name
                FROM [dbo].[emp_reg] e
                WHERE e.fname IS NOT NULL AND e.fname <> ''
                ORDER BY name;";

            DataTable tb = new DataTable();
            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        tb.Load(reader);
                    }
                }
            }
            return Ok(tb);
        }

        // Get distinct departments
        [HttpGet, Route("filter/departments")]
        public ActionResult GetDepartments()
        {
            string query = @"SELECT Id, dName FROM [dbo].[department] ORDER BY dName;";

            DataTable tb = new DataTable();
            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        tb.Load(reader);
                    }
                }
            }
            return Ok(tb);
        }

        // Get distinct countries from quotes
        [HttpGet, Route("filter/countries")]
        public ActionResult GetCountries()
        {
            string query = @"
                SELECT DISTINCT val AS country FROM (
                    SELECT PortOfLoading AS val FROM [dbo].[Quotes] WHERE PortOfLoading IS NOT NULL AND PortOfLoading <> ''
                    UNION
                    SELECT PortOfDischarge FROM [dbo].[Quotes] WHERE PortOfDischarge IS NOT NULL AND PortOfDischarge <> ''
                    UNION
                    SELECT DeliveryLocation FROM [dbo].[Quotes] WHERE DeliveryLocation IS NOT NULL AND DeliveryLocation <> ''
                    UNION
                    SELECT PickupLocation FROM [dbo].[Quotes] WHERE PickupLocation IS NOT NULL AND PickupLocation <> ''
                ) AS locations
                ORDER BY country;";

            DataTable tb = new DataTable();
            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        tb.Load(reader);
                    }
                }
            }
            return Ok(tb);
        }
    }
}
