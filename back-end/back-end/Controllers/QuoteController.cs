using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using back_end.Models;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuoteController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string dbcon;

        public QuoteController(IConfiguration configuration)
        {
            _configuration = configuration;
            dbcon = _configuration.GetSection("DBCon").Value;
        }

        private SqlConnection GetConnection() => new SqlConnection(dbcon);

        // GET: api/quote
        [HttpGet, Route("quote")]
        public ActionResult GetAllQuotes()
        {
            string query = @"
        SELECT 
            q.*,
            e.fname + ' ' + e.lname AS fullName,
            e.email
        FROM [dbo].[Quotes] q
        LEFT JOIN [dbo].[emp_reg] e ON q.CreatedBy = e.SysID
        ORDER BY q.QuoteId DESC;";
            var tb = new DataTable();

            try
            {
                using var con = GetConnection();
                con.Open();
                using var cmd = new SqlCommand(query, con);
                using var reader = cmd.ExecuteReader();
                tb.Load(reader);
                return Ok(tb);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // GET: api/quote/quote/paged?page=1&pageSize=10&search=&category=all&type=all
        [HttpGet, Route("quote/paged")]
        public ActionResult GetPagedQuotes(int page = 1, int pageSize = 10, string search = "", string category = "all", string type = "all", string status = "all", string createdBy = "")
        {
            try
            {
                using var con = GetConnection();
                con.Open();

                // Build WHERE clause
                var conditions = new List<string>();
                var parameters = new List<SqlParameter>();

                // Filter by creator (non-admin users only see their own quotes)
                if (!string.IsNullOrWhiteSpace(createdBy))
                {
                    conditions.Add("q.CreatedBy = @CreatedBy");
                    parameters.Add(new SqlParameter("@CreatedBy", createdBy));
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    conditions.Add("(q.QuoteNumber LIKE @Search OR q.Customer LIKE @Search)");
                    parameters.Add(new SqlParameter("@Search", $"%{search}%"));
                }

                if (!string.IsNullOrEmpty(category) && category != "all")
                {
                    var categoryValues = category.Split(',', StringSplitOptions.RemoveEmptyEntries);
                    if (categoryValues.Length == 1)
                    {
                        conditions.Add("q.FreightCategory = @Category");
                        parameters.Add(new SqlParameter("@Category", categoryValues[0]));
                    }
                    else
                    {
                        var catParams = new List<string>();
                        for (int i = 0; i < categoryValues.Length; i++)
                        {
                            catParams.Add($"@Cat{i}");
                            parameters.Add(new SqlParameter($"@Cat{i}", categoryValues[i].Trim()));
                        }
                        conditions.Add($"q.FreightCategory IN ({string.Join(",", catParams)})");
                    }
                }

                if (!string.IsNullOrEmpty(type) && type != "all")
                {
                    var typeValues = type.Split(',', StringSplitOptions.RemoveEmptyEntries);
                    if (typeValues.Length == 1)
                    {
                        conditions.Add("q.FreightType = @Type");
                        parameters.Add(new SqlParameter("@Type", typeValues[0]));
                    }
                    else
                    {
                        var typeParams = new List<string>();
                        for (int i = 0; i < typeValues.Length; i++)
                        {
                            typeParams.Add($"@Typ{i}");
                            parameters.Add(new SqlParameter($"@Typ{i}", typeValues[i].Trim()));
                        }
                        conditions.Add($"q.FreightType IN ({string.Join(",", typeParams)})");
                    }
                }

                if (!string.IsNullOrEmpty(status) && status != "all")
                {
                    var statusValues = status.Split(',', StringSplitOptions.RemoveEmptyEntries);
                    if (statusValues.Length == 1)
                    {
                        conditions.Add("q.Status = @Status");
                        parameters.Add(new SqlParameter("@Status", statusValues[0]));
                    }
                    else
                    {
                        var statusParams = new List<string>();
                        for (int i = 0; i < statusValues.Length; i++)
                        {
                            statusParams.Add($"@Stat{i}");
                            parameters.Add(new SqlParameter($"@Stat{i}", statusValues[i].Trim()));
                        }
                        conditions.Add($"q.Status IN ({string.Join(",", statusParams)})");
                    }
                }

                string whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

                // Count query
                string countQuery = $"SELECT COUNT(*) FROM [dbo].[Quotes] q {whereClause}";
                using var countCmd = new SqlCommand(countQuery, con);
                foreach (var p in parameters) countCmd.Parameters.Add(new SqlParameter(p.ParameterName, p.Value));
                int totalCount = (int)countCmd.ExecuteScalar();

                // Data query with pagination
                string dataQuery = $@"
                    SELECT
                        q.*,
                        e.fname + ' ' + e.lname AS fullName,
                        e.email
                    FROM [dbo].[Quotes] q
                    LEFT JOIN [dbo].[emp_reg] e ON q.CreatedBy = e.SysID
                    {whereClause}
                    ORDER BY q.QuoteId DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

                using var dataCmd = new SqlCommand(dataQuery, con);
                foreach (var p in parameters) dataCmd.Parameters.Add(new SqlParameter(p.ParameterName, p.Value));
                dataCmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                dataCmd.Parameters.AddWithValue("@PageSize", pageSize);

                var tb = new DataTable();
                using var reader = dataCmd.ExecuteReader();
                tb.Load(reader);

                return Ok(new { data = tb, totalCount = totalCount, page = page, pageSize = pageSize });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // GET: api/quote/quote/counts?createdBy=123
        [HttpGet, Route("quote/counts")]
        public ActionResult GetQuoteCounts([FromQuery] string createdBy = "")
        {
            string whereClause = string.IsNullOrWhiteSpace(createdBy)
                ? ""
                : "WHERE CreatedBy = @CreatedBy";

            string query = $@"
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN FreightCategory = 'air' THEN 1 ELSE 0 END) AS air,
                    SUM(CASE WHEN FreightCategory = 'sea' THEN 1 ELSE 0 END) AS sea,
                    SUM(CASE WHEN FreightCategory = 'multimodal' THEN 1 ELSE 0 END) AS multimodal
                FROM [dbo].[Quotes]
                {whereClause};";

            try
            {
                using var con = GetConnection();
                con.Open();
                using var cmd = new SqlCommand(query, con);
                if (!string.IsNullOrWhiteSpace(createdBy))
                    cmd.Parameters.AddWithValue("@CreatedBy", createdBy);

                using var reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return Ok(new
                    {
                        total = reader.GetInt32(0),
                        air = reader.GetInt32(1),
                        sea = reader.GetInt32(2),
                        multimodal = reader.GetInt32(3)
                    });
                }

                return Ok(new { total = 0, air = 0, sea = 0, multimodal = 0 });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // GET: api/quote/5
        [HttpGet, Route("quote/{id}")]
        public ActionResult GetQuoteById(int id)
        {
            string query = @"
        SELECT 
            q.*,
            e.fname + ' ' + e.lname AS fullName,
            e.email
        FROM [dbo].[Quotes] q
        LEFT JOIN [dbo].[emp_reg] e ON q.CreatedBy = e.SysID
        WHERE q.QuoteId = @id;";
            var tb = new DataTable();

            try
            {
                using var con = GetConnection();
                con.Open();
                using var cmd = new SqlCommand(query, con);
                cmd.Parameters.AddWithValue("@id", id);
                using var reader = cmd.ExecuteReader();
                tb.Load(reader);

                if (tb.Rows.Count == 0)
                    return NotFound("Quote not found.");

                return Ok(tb);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // POST: api/quote
        [HttpPost, Route("quote")]
        public IActionResult CreateQuote([FromBody] Quote quote)
        {
            if (quote == null) return BadRequest("Quote data is required.");

            string query = @"
                INSERT INTO [dbo].[Quotes] (
                    QuoteNumber, FreightCategory, FreightMode, FreightType, CreatedDate, RateValidity,
                    Customer, ContactName, PickupLocation, DeliveryLocation, PortOfLoading, PortOfDischarge,
                    Carriers, Equipment, carrierOptions, FreightCharges, OtherCharges, DestinationCharges,
                    OriginHandling, DestinationHandling, TransitRoutes, Routes,
                    TotalTransitTime, TermsConditions, Status, CreatedBy
                ) VALUES (
                    @QuoteNumber, @FreightCategory, @FreightMode, @FreightType, @CreatedDate, @RateValidity,
                    @Customer, @ContactName, @PickupLocation, @DeliveryLocation, @PortOfLoading, @PortOfDischarge,
                    @Carriers, @Equipment, @CarrierOptions, @FreightCharges, @OtherCharges, @DestinationCharges,
                    @OriginHandling, @DestinationHandling, @TransitRoutes, @Routes,
                    @TotalTransitTime, @TermsConditions, @Status, @CreatedBy
                );
                SELECT SCOPE_IDENTITY();";

            try
            {
                using var con = GetConnection();
                con.Open();
                using var cmd = new SqlCommand(query, con);

                cmd.Parameters.AddWithValue("@QuoteNumber", quote.QuoteNumber);
                cmd.Parameters.AddWithValue("@FreightCategory", quote.FreightCategory);
                cmd.Parameters.AddWithValue("@FreightMode", quote.FreightMode);
                cmd.Parameters.AddWithValue("@FreightType", quote.FreightType);
                cmd.Parameters.AddWithValue("@CreatedDate", quote.CreatedDate);
                cmd.Parameters.AddWithValue("@RateValidity", quote.RateValidity ?? (object)DBNull.Value);

                cmd.Parameters.AddWithValue("@Customer", quote.Customer ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ContactName", quote.ContactName ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PickupLocation", quote.PickupLocation ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DeliveryLocation", quote.DeliveryLocation ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PortOfLoading", quote.PortOfLoading ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PortOfDischarge", quote.PortOfDischarge ?? (object)DBNull.Value);

                cmd.Parameters.AddWithValue("@Carriers", quote.Carriers ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Equipment", quote.Equipment ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@CarrierOptions", quote.CarrierOptions ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@FreightCharges", quote.FreightCharges ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OtherCharges", quote.OtherCharges ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DestinationCharges", quote.DestinationCharges ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OriginHandling", quote.OriginHandling ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DestinationHandling", quote.DestinationHandling ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TransitRoutes", quote.TransitRoutes ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Routes", quote.Routes ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TotalTransitTime", quote.TotalTransitTime ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TermsConditions", quote.TermsConditions ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Status", quote.Status ?? "draft");
                cmd.Parameters.AddWithValue("@CreatedBy", quote.CreatedBy);

                var newId = cmd.ExecuteScalar();
                int newQuoteId = Convert.ToInt32(newId);
                return Ok(new { message = "Quote created successfully.", quoteId = newQuoteId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error creating quote: {ex.Message}");
            }
        }

        // PUT: api/quote
        [HttpPut, Route("quote")]
        public IActionResult UpdateQuote([FromBody] Quote quote)
        {
            if (quote == null || quote.QuoteId <= 0)
                return BadRequest("Valid QuoteId is required.");

            string query = @"
                UPDATE [dbo].[Quotes] SET
                    QuoteNumber = @QuoteNumber,
                    FreightCategory = @FreightCategory,
                    FreightMode = @FreightMode,
                    FreightType = @FreightType,
                    CreatedDate = @CreatedDate,
                    RateValidity = @RateValidity,
                    Customer = @Customer,
                    ContactName = @ContactName,
                    PickupLocation = @PickupLocation,
                    DeliveryLocation = @DeliveryLocation,
                    PortOfLoading = @PortOfLoading,
                    PortOfDischarge = @PortOfDischarge,
                    Carriers = @Carriers,
                    Equipment = @Equipment,
                    CarrierOptions = @CarrierOptions,
                    FreightCharges = @FreightCharges,
                    DestinationCharges = @DestinationCharges,
                    OriginHandling = @OriginHandling,
                    DestinationHandling = @DestinationHandling,
                    TransitRoutes = @TransitRoutes,
                    Routes = @Routes,
                    TotalTransitTime = @TotalTransitTime,
                    TermsConditions = @TermsConditions,
                    Status = @Status,
                    UpdatedAt = GETDATE()
                WHERE QuoteId = @QuoteId";

            try
            {
                using var con = GetConnection();
                con.Open();
                using var cmd = new SqlCommand(query, con);

                cmd.Parameters.AddWithValue("@QuoteId", quote.QuoteId);
                cmd.Parameters.AddWithValue("@QuoteNumber", quote.QuoteNumber);
                cmd.Parameters.AddWithValue("@FreightCategory", quote.FreightCategory);
                cmd.Parameters.AddWithValue("@FreightMode", quote.FreightMode);
                cmd.Parameters.AddWithValue("@FreightType", quote.FreightType);
                cmd.Parameters.AddWithValue("@CreatedDate", quote.CreatedDate);
                cmd.Parameters.AddWithValue("@RateValidity", quote.RateValidity ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Customer", quote.Customer ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ContactName", quote.ContactName ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PickupLocation", quote.PickupLocation ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DeliveryLocation", quote.DeliveryLocation ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PortOfLoading", quote.PortOfLoading ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PortOfDischarge", quote.PortOfDischarge ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Carriers", quote.Carriers ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Equipment", quote.Equipment ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@CarrierOptions", quote.CarrierOptions ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@FreightCharges", quote.FreightCharges ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DestinationCharges", quote.DestinationCharges ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OriginHandling", quote.OriginHandling ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DestinationHandling", quote.DestinationHandling ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TransitRoutes", quote.TransitRoutes ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Routes", quote.Routes ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TotalTransitTime", quote.TotalTransitTime ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TermsConditions", quote.TermsConditions ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Status", quote.Status ?? "draft");

                int rows = cmd.ExecuteNonQuery();
                return rows > 0
                    ? Ok("Quote updated successfully.")
                    : NotFound("Quote not found.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating quote: {ex.Message}");
            }
        }

        // PUT: api/quote/quote/{id}/status
        [HttpPut, Route("quote/{id}/status")]
        public IActionResult UpdateQuoteStatus(int id, [FromBody] StatusUpdateModel statusModel)
        {
            string query = @"UPDATE [dbo].[Quotes] SET Status = @Status, UpdatedAt = GETDATE() WHERE QuoteId = @QuoteId";

            try
            {
                using var con = GetConnection();
                con.Open();
                using var cmd = new SqlCommand(query, con);
                cmd.Parameters.AddWithValue("@QuoteId", id);
                cmd.Parameters.AddWithValue("@Status", statusModel.Status ?? "draft");

                int rows = cmd.ExecuteNonQuery();
                return rows > 0
                    ? Ok("Quote status updated successfully.")
                    : NotFound("Quote not found.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating quote status: {ex.Message}");
            }
        }

        // DELETE: api/quote/5
        [HttpDelete, Route("quote/{id}")]
        public IActionResult DeleteQuote(int id)
        {
            string query = @"DELETE FROM [dbo].[Quotes] WHERE QuoteId = @id";

            try
            {
                using var con = GetConnection();
                con.Open();
                using var cmd = new SqlCommand(query, con);
                cmd.Parameters.AddWithValue("@id", id);

                int rows = cmd.ExecuteNonQuery();
                return rows > 0
                    ? Ok("Quote deleted successfully.")
                    : NotFound("Quote not found.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error deleting quote: {ex.Message}");
            }
        }

        [HttpGet, Route("quote/sale-person")]
        public ActionResult GetSpByName(string name)
        {
            string query = @"select Top(1) salesPerson from [dbo].[account_reg] where accountName COLLATE Latin1_General_CS_AS = @name";
            var tb = new DataTable();

            try
            {
                using var con = GetConnection();
                con.Open();
                using var cmd = new SqlCommand(query, con);
                cmd.Parameters.AddWithValue("@name", name);
                using var reader = cmd.ExecuteReader();
                tb.Load(reader);

                if (tb.Rows.Count == 0)
                    return NotFound("Name not found.");

                return Ok(tb);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
    }

    public class StatusUpdateModel
    {
        public string Status { get; set; }
    }
}