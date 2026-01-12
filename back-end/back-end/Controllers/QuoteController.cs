using System;
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
                    Customer, PickupLocation, DeliveryLocation, PortOfLoading, PortOfDischarge,
                    Carriers, Equipment, carrierOptions, FreightCharges, OtherCharges, DestinationCharges,
                    OriginHandling, DestinationHandling, TransitRoutes, Routes,
                    TotalTransitTime, TermsConditions, Status, CreatedBy
                ) VALUES (
                    @QuoteNumber, @FreightCategory, @FreightMode, @FreightType, @CreatedDate, @RateValidity,
                    @Customer, @PickupLocation, @DeliveryLocation, @PortOfLoading, @PortOfDischarge,
                    @Carriers, @Equipment, @CarrierOptions, @FreightCharges, @OtherCharges, @DestinationCharges,
                    @OriginHandling, @DestinationHandling, @TransitRoutes, @Routes,
                    @TotalTransitTime, @TermsConditions, @Status, @CreatedBy
                );";

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

                cmd.ExecuteNonQuery();
                return Ok("Quote created successfully.");
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
    }
}