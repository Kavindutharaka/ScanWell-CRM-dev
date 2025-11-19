// File: Controllers/QuoteController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Text.Json;
using back_end.Models;
using System.Data;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuoteController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public QuoteController(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") 
                ?? _configuration.GetSection("DBCon").Value;
        }

        // GET: api/quote
        [HttpGet]
        public async Task<ActionResult> GetQuotes()
        {
            var quotes = new List<Quote>();
            string query = "SELECT * FROM Quotes ORDER BY CreatedAt DESC";

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using (var command = new SqlCommand(query, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            quotes.Add(new Quote
                            {
                                Id = reader.GetInt32("Id"),
                                QuoteId = reader.GetString("QuoteId"),
                                CustomerName = reader.GetString("CustomerName"),
                                ClientName = reader.GetString("ClientName"),
                                FreightMode = reader.GetString("FreightMode"),
                                FreightCategory = reader.GetString("FreightCategory"),
                                CreatedDate = reader.GetDateTime("CreatedDate"),
                                CreatedAt = reader.GetDateTime("CreatedAt")
                                // Add more fields as needed for list view
                            });
                        }
                    }
                }
            }

            return Ok(quotes);
        }

        // GET: api/quote/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Quote>> GetQuote(int id)
        {
            string query = "SELECT * FROM Quotes WHERE Id = @id";
            Quote? quote = null;

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@id", id);
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            quote = MapReaderToQuote(reader);
                        }
                    }
                }
            }

            if (quote == null) return NotFound("Quote not found.");

            return Ok(quote);
        }

        // POST: api/quote
        [HttpPost]
        public async Task<ActionResult> CreateQuote([FromBody] Quote quote)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            string insertQuery = @"
                INSERT INTO Quotes (
                    QuoteId, CustomerId, CustomerName, ClientId, ClientName,
                    PickupLocationId, DeliveryLocationId, CreditTermsId,
                    CreatedDate, DaysValid, FreightMode, FreightCategory, CreatedBy,
                    DirectRouteJson, TransitRouteJson, MultimodalSegmentsJson,
                    RoutePlanJson, FreightChargesJson, AdditionalChargesJson, CustomTermsJson,
                    CreatedAt
                ) VALUES (
                    @QuoteId, @CustomerId, @CustomerName, @ClientId, @ClientName,
                    @PickupLocationId, @DeliveryLocationId, @CreditTermsId,
                    @CreatedDate, @DaysValid, @FreightMode, @FreightCategory, @CreatedBy,
                    @DirectRouteJson, @TransitRouteJson, @MultimodalSegmentsJson,
                    @RoutePlanJson, @FreightChargesJson, @AdditionalChargesJson, @CustomTermsJson,
                    GETDATE()
                )";

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using (var command = new SqlCommand(insertQuery, connection))
                {
                    command.Parameters.AddWithValue("@QuoteId", quote.QuoteId);
                    command.Parameters.AddWithValue("@CustomerId", (object?)quote.CustomerId ?? DBNull.Value);
                    command.Parameters.AddWithValue("@CustomerName", quote.CustomerName ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@ClientId", (object?)quote.ClientId ?? DBNull.Value);
                    command.Parameters.AddWithValue("@ClientName", quote.ClientName ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@PickupLocationId", (object?)quote.PickupLocationId ?? DBNull.Value);
                    command.Parameters.AddWithValue("@DeliveryLocationId", (object?)quote.DeliveryLocationId ?? DBNull.Value);
                    command.Parameters.AddWithValue("@CreditTermsId", (object?)quote.CreditTermsId ?? DBNull.Value);
                    command.Parameters.AddWithValue("@CreatedDate", quote.CreatedDate);
                    command.Parameters.AddWithValue("@DaysValid", (object?)quote.DaysValid ?? DBNull.Value);
                    command.Parameters.AddWithValue("@FreightMode", quote.FreightMode);
                    command.Parameters.AddWithValue("@FreightCategory", quote.FreightCategory);
                    command.Parameters.AddWithValue("@CreatedBy", quote.CreatedBy ?? "System");

                    // Serialize complex objects to JSON
                    command.Parameters.AddWithValue("@DirectRouteJson", quote.DirectRouteJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@TransitRouteJson", quote.TransitRouteJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@MultimodalSegmentsJson", quote.MultimodalSegmentsJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@RoutePlanJson", quote.RoutePlanJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@FreightChargesJson", quote.FreightChargesJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@AdditionalChargesJson", quote.AdditionalChargesJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@CustomTermsJson", quote.CustomTermsJson ?? (object)DBNull.Value);

                    await command.ExecuteNonQueryAsync();
                }
            }

            return Ok(new { message = "Quote created successfully", quoteId = quote.QuoteId });
        }

        // PUT: api/quote/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateQuote(int id, [FromBody] Quote quote)
        {
            if (id != quote.Id) return BadRequest("ID mismatch.");

            string updateQuery = @"
                UPDATE Quotes SET
                    CustomerName = @CustomerName,
                    ClientName = @ClientName,
                    FreightMode = @FreightMode,
                    FreightCategory = @FreightCategory,
                    DirectRouteJson = @DirectRouteJson,
                    TransitRouteJson = @TransitRouteJson,
                    MultimodalSegmentsJson = @MultimodalSegmentsJson,
                    RoutePlanJson = @RoutePlanJson,
                    FreightChargesJson = @FreightChargesJson,
                    AdditionalChargesJson = @AdditionalChargesJson,
                    CustomTermsJson = @CustomTermsJson,
                    UpdatedAt = GETDATE()
                WHERE Id = @Id";

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using (var command = new SqlCommand(updateQuery, connection))
                {
                    command.Parameters.AddWithValue("@Id", id);
                    command.Parameters.AddWithValue("@CustomerName", quote.CustomerName ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@ClientName", quote.ClientName ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@FreightMode", quote.FreightMode);
                    command.Parameters.AddWithValue("@FreightCategory", quote.FreightCategory);
                    command.Parameters.AddWithValue("@DirectRouteJson", quote.DirectRouteJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@TransitRouteJson", quote.TransitRouteJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@MultimodalSegmentsJson", quote.MultimodalSegmentsJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@RoutePlanJson", quote.RoutePlanJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@FreightChargesJson", quote.FreightChargesJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@AdditionalChargesJson", quote.AdditionalChargesJson ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@CustomTermsJson", quote.CustomTermsJson ?? (object)DBNull.Value);

                    int rows = await command.ExecuteNonQueryAsync();
                    if (rows == 0) return NotFound("Quote not found.");
                }
            }

            return Ok("Quote updated successfully.");
        }

        private Quote MapReaderToQuote(SqlDataReader reader)
        {
            return new Quote
            {
                Id = reader.GetInt32("Id"),
                QuoteId = reader.GetString("QuoteId"),
                CustomerId = reader.IsDBNull("CustomerId") ? null : reader.GetInt32("CustomerId"),
                CustomerName = reader.IsDBNull("CustomerName") ? "" : reader.GetString("CustomerName"),
                ClientId = reader.IsDBNull("ClientId") ? null : reader.GetInt32("ClientId"),
                ClientName = reader.IsDBNull("ClientName") ? "" : reader.GetString("ClientName"),
                PickupLocationId = reader.IsDBNull("PickupLocationId") ? null : reader.GetInt32("PickupLocationId"),
                DeliveryLocationId = reader.IsDBNull("DeliveryLocationId") ? null : reader.GetInt32("DeliveryLocationId"),
                CreditTermsId = reader.IsDBNull("CreditTermsId") ? null : reader.GetInt32("CreditTermsId"),
                CreatedDate = reader.GetDateTime("CreatedDate"),
                DaysValid = reader.IsDBNull("DaysValid") ? null : reader.GetInt32("DaysValid"),
                FreightMode = reader.GetString("FreightMode"),
                FreightCategory = reader.GetString("FreightCategory"),
                CreatedBy = reader.IsDBNull("CreatedBy") ? "Unknown" : reader.GetString("CreatedBy"),
                DirectRouteJson = reader.IsDBNull("DirectRouteJson") ? null : reader.GetString("DirectRouteJson"),
                TransitRouteJson = reader.IsDBNull("TransitRouteJson") ? null : reader.GetString("TransitRouteJson"),
                MultimodalSegmentsJson = reader.IsDBNull("MultimodalSegmentsJson") ? null : reader.GetString("MultimodalSegmentsJson"),
                RoutePlanJson = reader.IsDBNull("RoutePlanJson") ? null : reader.GetString("RoutePlanJson"),
                FreightChargesJson = reader.IsDBNull("FreightChargesJson") ? null : reader.GetString("FreightChargesJson"),
                AdditionalChargesJson = reader.IsDBNull("AdditionalChargesJson") ? null : reader.GetString("AdditionalChargesJson"),
                CustomTermsJson = reader.IsDBNull("CustomTermsJson") ? null : reader.GetString("CustomTermsJson"),
                CreatedAt = reader.GetDateTime("CreatedAt"),
                UpdatedAt = reader.IsDBNull("UpdatedAt") ? null : reader.GetDateTime("UpdatedAt")
            };
        }
    }
}