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
        //          salesPerson, department, createdById
        // ====================================================================
        [HttpGet, Route("quotation")]
        public ActionResult GetQuotationReport(
            [FromQuery] string? dateFrom,
            [FromQuery] string? dateTo,
            [FromQuery] string? freightCategory,
            [FromQuery] string? freightMode,
            [FromQuery] string? country,
            [FromQuery] string? salesPerson,
            [FromQuery] string? department,
            [FromQuery] long? createdById)
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
                // Filter on the sales person assigned to the customer account, not the quote entrant
                // LTRIM/RTRIM strips trailing/leading whitespace that often slips into
                // manually-typed salesPerson fields in account_reg.
                conditions.Add("LTRIM(RTRIM(ar.salesPerson)) = LTRIM(RTRIM(@SalesPerson))");
                parameters.Add(new SqlParameter("@SalesPerson", salesPerson));
            }
            if (!string.IsNullOrEmpty(department) && department != "all")
            {
                // Department of the sales person (looked up via account_reg → emp_reg by name)
                conditions.Add("esp.department = @Department");
                parameters.Add(new SqlParameter("@Department", department));
            }
            if (createdById.HasValue)
            {
                // Filter by the employee who created the quote
                conditions.Add("q.CreatedBy = @CreatedById");
                parameters.Add(new SqlParameter("@CreatedById", createdById.Value));
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
                    -- CreatedByName: resolve via user_roles (q.CreatedBy = user_roles.Id) then to emp_reg.
                    -- Also try direct SysID match as fallback so both storage patterns are covered.
                    NULLIF(RTRIM(LTRIM(
                        ISNULL(
                            ISNULL(ecb.fname, '') + ' ' + ISNULL(ecb.lname, ''),
                            ISNULL(ecb2.fname, '') + ' ' + ISNULL(ecb2.lname, '')
                        )
                    )), '') AS CreatedByName,
                    -- SalesPerson: the person assigned to this customer in account_reg,
                    -- NOT the employee who entered the quote (q.CreatedBy).
                    ar.salesPerson AS SalesPerson,
                    esp.department AS Department
                FROM [dbo].[Quotes] q
                -- Path 1: q.CreatedBy = user_roles.Id (quote forms store the role row id)
                LEFT JOIN [dbo].[user_roles]  ucb  ON q.CreatedBy = ucb.Id
                LEFT JOIN [dbo].[emp_reg]     ecb  ON ucb.EmployeeId = CAST(ecb.SysID AS NVARCHAR(50))
                -- Path 2: q.CreatedBy = emp_reg.SysID directly (fallback for older records)
                LEFT JOIN [dbo].[emp_reg]     ecb2 ON q.CreatedBy = ecb2.SysID
                LEFT JOIN [dbo].[account_reg] ar   ON q.Customer = ar.accountName
                LEFT JOIN [dbo].[emp_reg]     esp  ON ar.salesPerson = ISNULL(esp.fname, '') + ' ' + ISNULL(esp.lname, '')
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
        // Filters: dateFrom, dateTo, salesPerson, activityType, status
        // ====================================================================
        [HttpGet, Route("sales-activity")]
        public ActionResult GetSalesActivityReport(
            [FromQuery] string? dateFrom,
            [FromQuery] string? dateTo,
            [FromQuery] string? salesPerson,
            [FromQuery] string? activityType,
            [FromQuery] string? status)
        {
            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrEmpty(dateFrom))
            {
                conditions.Add("CAST(a.end_time AS DATE) >= @DateFrom");
                var pFrom = new SqlParameter("@DateFrom", System.Data.SqlDbType.Date);
                pFrom.Value = DateTime.Parse(dateFrom);
                parameters.Add(pFrom);
            }
            if (!string.IsNullOrEmpty(dateTo))
            {
                conditions.Add("CAST(a.end_time AS DATE) <= @DateTo");
                var pTo = new SqlParameter("@DateTo", System.Data.SqlDbType.Date);
                pTo.Value = DateTime.Parse(dateTo);
                parameters.Add(pTo);
            }
            if (!string.IsNullOrEmpty(salesPerson) && salesPerson != "all")
            {
                conditions.Add("LTRIM(RTRIM(ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, ''))) = LTRIM(RTRIM(@SalesPerson))");
                parameters.Add(new SqlParameter("@SalesPerson", salesPerson));
            }
            if (!string.IsNullOrEmpty(activityType) && activityType != "all")
            {
                var types = activityType.Split(',').Select(t => t.Trim()).Where(t => !string.IsNullOrEmpty(t)).ToList();
                if (types.Count == 1)
                {
                    conditions.Add("a.activity_type = @ActivityType");
                    parameters.Add(new SqlParameter("@ActivityType", types[0]));
                }
                else if (types.Count > 1)
                {
                    var typeParams = new List<string>();
                    for (int i = 0; i < types.Count; i++)
                    {
                        typeParams.Add($"@ActivityType{i}");
                        parameters.Add(new SqlParameter($"@ActivityType{i}", types[i]));
                    }
                    conditions.Add($"a.activity_type IN ({string.Join(",", typeParams)})");
                }
            }
            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                var statuses = status.Split(',').Select(s => s.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList();
                if (statuses.Count == 1)
                {
                    conditions.Add("a.status = @Status");
                    parameters.Add(new SqlParameter("@Status", statuses[0]));
                }
                else if (statuses.Count > 1)
                {
                    var statusParams = new List<string>();
                    for (int i = 0; i < statuses.Count; i++)
                    {
                        statusParams.Add($"@Status{i}");
                        parameters.Add(new SqlParameter($"@Status{i}", statuses[i]));
                    }
                    conditions.Add($"a.status IN ({string.Join(",", statusParams)})");
                }
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
                    a.reschedule_date AS RescheduleDate,
                    (SELECT TOP 1 sl.note FROM [dbo].[status_logs] sl
                     WHERE sl.activity_id = a.id
                     ORDER BY sl.created_at DESC) AS LatestComment
                FROM [dbo].[activity] a
                -- Path 1: owner stores emp_reg.SysID directly
                LEFT JOIN [dbo].[emp_reg]    e1  ON a.owner = e1.SysID
                -- Path 2: owner stores user_roles.Id (fallback for activities created via role ID)
                LEFT JOIN [dbo].[user_roles] ur  ON a.owner = ur.Id
                LEFT JOIN [dbo].[emp_reg]    e2  ON ur.EmployeeId = CAST(e2.SysID AS NVARCHAR(50))
                -- Resolve whichever path succeeded
                CROSS APPLY (SELECT
                    COALESCE(e1.fname, e2.fname) AS fname,
                    COALESCE(e1.lname, e2.lname) AS lname
                ) e
                {whereClause}
                ORDER BY a.end_time DESC, a.id DESC;";

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
        // Filters: salesPerson, country (location), accountType
        // ====================================================================
        [HttpGet, Route("customer-list")]
        public ActionResult GetCustomerListReport(
            [FromQuery] string? salesPerson,
            [FromQuery] string? country,
            [FromQuery] string? accountType)
        {
            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrEmpty(salesPerson) && salesPerson != "all")
            {
                conditions.Add("LTRIM(RTRIM(salesPerson)) = LTRIM(RTRIM(@SalesPerson))");
                parameters.Add(new SqlParameter("@SalesPerson", salesPerson));
            }
            if (!string.IsNullOrEmpty(country) && country != "all")
            {
                conditions.Add("location = @Country");
                parameters.Add(new SqlParameter("@Country", country));
            }
            if (!string.IsNullOrEmpty(accountType) && accountType != "all")
            {
                conditions.Add("accountType = @AccountType");
                parameters.Add(new SqlParameter("@AccountType", accountType));
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

        // Get salesperson names from emp_reg (all employees).
        // Source from emp_reg instead of account_reg.salesPerson so:
        //   1. EVERY employee appears in the dropdown, not just those assigned to a customer.
        //   2. Names are consistent — no manually-typed casing/whitespace mismatches.
        [HttpGet, Route("filter/salespersons")]
        public ActionResult GetSalespersons()
        {
            string query = @"
                SELECT DISTINCT
                    LTRIM(RTRIM(ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, ''))) AS name
                FROM [dbo].[emp_reg] e
                WHERE (ISNULL(e.fname, '') <> '' OR ISNULL(e.lname, '') <> '')
                  AND (e.status IS NULL OR e.status <> 'inactive')
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
            string query = @"SELECT SysID, d_name FROM [dbo].[department] ORDER BY d_name;";

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

        // Get distinct customer locations (from account_reg)
        [HttpGet, Route("filter/customer-locations")]
        public ActionResult GetCustomerLocations()
        {
            string query = @"
                SELECT DISTINCT location AS country
                FROM [dbo].[account_reg]
                WHERE location IS NOT NULL AND location <> ''
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

        // Get distinct account types (from account_reg)
        [HttpGet, Route("filter/account-types")]
        public ActionResult GetAccountTypes()
        {
            string query = @"
                SELECT DISTINCT accountType AS type
                FROM [dbo].[account_reg]
                WHERE accountType IS NOT NULL AND accountType <> ''
                ORDER BY type;";

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
        // 5. INVOICE LIST / PROFIT MARGIN REPORT (Sales Person Wise)
        // Filters: dateFrom, dateTo, salesPerson
        // ====================================================================
        [HttpGet, Route("invoice-profit")]
        public ActionResult GetInvoiceProfitReport(
            [FromQuery] string? dateFrom,
            [FromQuery] string? dateTo,
            [FromQuery] string? salesPerson)
        {
            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            // Always filter to won quotes only
            conditions.Add("qo.outcome_status = 'won'");

            if (!string.IsNullOrEmpty(dateFrom))
            {
                conditions.Add("CAST(ie.entry_date AS DATE) >= @DateFrom");
                var pFrom = new SqlParameter("@DateFrom", System.Data.SqlDbType.Date);
                pFrom.Value = DateTime.Parse(dateFrom);
                parameters.Add(pFrom);
            }
            if (!string.IsNullOrEmpty(dateTo))
            {
                conditions.Add("CAST(ie.entry_date AS DATE) <= @DateTo");
                var pTo = new SqlParameter("@DateTo", System.Data.SqlDbType.Date);
                pTo.Value = DateTime.Parse(dateTo);
                parameters.Add(pTo);
            }
            if (!string.IsNullOrEmpty(salesPerson) && salesPerson != "all")
            {
                // Filter on the sales person assigned to the customer account, not the quote entrant
                conditions.Add("LTRIM(RTRIM(ar.salesPerson)) = LTRIM(RTRIM(@SalesPerson))");
                parameters.Add(new SqlParameter("@SalesPerson", salesPerson));
            }

            string whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

            string query = $@"
                SELECT
                    ie.id AS EntryId,
                    ie.quote_id AS QuoteId,
                    q.QuoteNumber,
                    q.Customer,
                    q.FreightCategory,
                    q.FreightType,
                    ar.salesPerson AS SalesPerson,
                    esp.department AS Department,
                    ie.entry_date AS EntryDate,
                    ie.invoice_number AS InvoiceNumber,
                    ie.amount AS Amount,
                    ie.cost_invoice AS CostInvoice,
                    ie.invoice_margin AS InvoiceMargin,
                    ISNULL(qo.invoice_completed, 0) AS InvoiceCompleted
                FROM invoice_entries ie
                INNER JOIN [dbo].[Quotes] q ON ie.quote_id = q.QuoteId
                INNER JOIN quote_outcomes qo ON q.QuoteId = qo.quote_id
                LEFT JOIN [dbo].[account_reg] ar  ON q.Customer = ar.accountName
                LEFT JOIN [dbo].[emp_reg]     esp ON ar.salesPerson = ISNULL(esp.fname, '') + ' ' + ISNULL(esp.lname, '')
                {whereClause}
                ORDER BY ie.entry_date DESC, ie.id DESC;";

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
        // 6. SALES TARGET LIST REPORT (Employee Wise)
        // Filters: year, salesPerson, period (monthly/quarterly/annually)
        // ====================================================================
        [HttpGet, Route("sales-target")]
        public ActionResult GetSalesTargetReport(
            [FromQuery] int? year,
            [FromQuery] string? salesPerson)
        {
            int targetYear = year ?? DateTime.Now.Year;

            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            conditions.Add("t.year = @Year");
            parameters.Add(new SqlParameter("@Year", targetYear));

            if (!string.IsNullOrEmpty(salesPerson) && salesPerson != "all")
            {
                conditions.Add("LTRIM(RTRIM(ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, ''))) = LTRIM(RTRIM(@SalesPerson))");
                parameters.Add(new SqlParameter("@SalesPerson", salesPerson));
            }

            string whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

            string query = $@"
                SELECT
                    t.id,
                    t.employee_id AS EmployeeId,
                    ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, '') AS EmployeeName,
                    e.position AS Position,
                    e.department AS Department,
                    t.year AS Year,
                    t.jan_target AS JanTarget,
                    t.feb_target AS FebTarget,
                    t.mar_target AS MarTarget,
                    t.apr_target AS AprTarget,
                    t.may_target AS MayTarget,
                    t.jun_target AS JunTarget,
                    t.jul_target AS JulTarget,
                    t.aug_target AS AugTarget,
                    t.sep_target AS SepTarget,
                    t.oct_target AS OctTarget,
                    t.nov_target AS NovTarget,
                    t.dec_target AS DecTarget,
                    t.annual_target AS AnnualTarget,
                    t.updated_at AS UpdatedAt
                FROM [dbo].[employee_sales_targets] t
                LEFT JOIN [dbo].[emp_reg] e ON t.employee_id = CAST(e.SysID AS NVARCHAR(50))
                {whereClause}
                ORDER BY e.fname, e.lname;";

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

        // Get distinct employees who have created at least one quote (for Created By filter)
        [HttpGet, Route("filter/quote-creators")]
        public ActionResult GetQuoteCreators()
        {
            string query = @"
                SELECT DISTINCT
                    q.CreatedBy AS id,
                    NULLIF(RTRIM(LTRIM(ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, ''))), '') AS name
                FROM [dbo].[Quotes] q
                -- Path 1: q.CreatedBy = user_roles.Id
                LEFT JOIN [dbo].[user_roles] ur ON q.CreatedBy = ur.Id
                LEFT JOIN [dbo].[emp_reg]    e1 ON ur.EmployeeId = CAST(e1.SysID AS NVARCHAR(50))
                -- Path 2: q.CreatedBy = emp_reg.SysID directly
                LEFT JOIN [dbo].[emp_reg]    e2 ON q.CreatedBy = e2.SysID
                CROSS APPLY (SELECT COALESCE(e1.fname, e2.fname) AS fname,
                                    COALESCE(e1.lname, e2.lname) AS lname) e
                WHERE NULLIF(RTRIM(LTRIM(ISNULL(e.fname, '') + ' ' + ISNULL(e.lname, ''))), '') IS NOT NULL
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
