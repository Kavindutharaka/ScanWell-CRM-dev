using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WarehouseQuotesController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly ILogger<WarehouseQuotesController> _logger;

        public WarehouseQuotesController(IConfiguration configuration, ILogger<WarehouseQuotesController> logger)
        {
            _connectionString = configuration.GetSection("DBCon").Value;
            _logger = logger;
        }

        // GET: api/warehouse-quotes
        [HttpGet]
        public async Task<IActionResult> GetWarehouseQuotes([FromQuery] string? status = null, [FromQuery] int? customerId = null)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT
                        wq.SysID,
                        wq.QuoteNumber,
                        wq.CustomerId,
                        wq.CustomerName,
                        wq.Currency,
                        wq.IssuedDate,
                        wq.ValidityDays,
                        wq.ValidityDate,
                        wq.Status,
                        wq.CreatedBy,
                        wq.CreatedAt,
                        wq.UpdatedAt,
                        e.fname + ' ' + e.lname AS fullName,
                        e.email
                    FROM WarehouseQuotes wq
                    LEFT JOIN emp_reg e ON TRY_CAST(wq.CreatedBy AS INT) = e.SysID
                    WHERE (@Status IS NULL OR wq.Status = @Status)
                    AND (@CustomerId IS NULL OR wq.CustomerId = @CustomerId)
                    ORDER BY wq.CreatedAt DESC";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@Status", (object)status ?? DBNull.Value);
                command.Parameters.AddWithValue("@CustomerId", (object)customerId ?? DBNull.Value);

                var quotes = new List<object>();
                using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    quotes.Add(new
                    {
                        sysId = reader["SysID"],
                        quoteNumber = reader["QuoteNumber"],
                        customerId = reader["CustomerId"],
                        customerName = reader["CustomerName"],
                        currency = reader["Currency"],
                        issuedDate = reader["IssuedDate"],
                        validityDays = reader["ValidityDays"],
                        validityDate = reader["ValidityDate"],
                        status = reader["Status"],
                        createdBy = reader["CreatedBy"],
                        createdAt = reader["CreatedAt"],
                        updatedAt = reader["UpdatedAt"],
                        fullName = reader["fullName"] != DBNull.Value ? reader["fullName"].ToString() : null,
                        email = reader["email"] != DBNull.Value ? reader["email"].ToString() : null
                    });
                }

                return Ok(quotes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching warehouse quotes");
                return StatusCode(500, new { message = "Error fetching warehouse quotes", error = ex.Message });
            }
        }

        // GET: api/warehouse-quotes/{id}
        // GET: api/warehouse-quotes/{id}
        // GET: api/warehouse-quotes/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetWarehouseQuote(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
            SELECT 
                wq.SysID,
                wq.QuoteNumber,
                wq.CustomerId,
                wq.CustomerName,
                wq.Currency,
                wq.IssuedDate,
                wq.ValidityDays,
                wq.ValidityDate,
                wq.Status,
                wq.LineItemsJson,
                wq.NotesJson,
                wq.CreatedBy,
                wq.CreatedAt,
                wq.UpdatedAt
            FROM WarehouseQuotes wq
            WHERE wq.SysID = @QuoteId";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@QuoteId", id);

                using var reader = await command.ExecuteReaderAsync();

                if (!await reader.ReadAsync())
                {
                    return NotFound(new { message = "Warehouse quote not found" });
                }

                // Deserialize JSON strings to objects WITH CASE-INSENSITIVE OPTION
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var lineItemsJson = reader["LineItemsJson"] == DBNull.Value ? "[]" : reader["LineItemsJson"].ToString();
                var notesJson = reader["NotesJson"] == DBNull.Value ? "[]" : reader["NotesJson"].ToString();

                var lineItems = JsonSerializer.Deserialize<List<LineItemResponse>>(lineItemsJson, jsonOptions);
                var notes = JsonSerializer.Deserialize<List<NoteResponse>>(notesJson, jsonOptions);

                var result = new
                {
                    sysId = reader["SysID"],
                    quoteNumber = reader["QuoteNumber"],
                    customerId = reader["CustomerId"],
                    customerName = reader["CustomerName"],
                    currency = reader["Currency"],
                    issuedDate = reader["IssuedDate"],
                    validityDays = reader["ValidityDays"],
                    validityDate = reader["ValidityDate"],
                    status = reader["Status"],
                    lineItems = lineItems?.Select(item => new
                    {
                        category = item.Category,
                        description = item.Description,
                        remarks = item.Remarks,
                        unitOfMeasurement = item.UnitOfMeasurement,
                        amount = item.Amount
                    }),
                    notes = notes?.Select(n => n.Value).ToList() ?? new List<string>(),
                    createdBy = reader["CreatedBy"],
                    createdAt = reader["CreatedAt"],
                    updatedAt = reader["UpdatedAt"]
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching warehouse quote");
                return StatusCode(500, new { message = "Error fetching warehouse quote", error = ex.Message });
            }
        }

        // POST: api/warehouse-quotes
        [HttpPost]
        public async Task<IActionResult> CreateWarehouseQuote([FromBody] WarehouseQuoteRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var transaction = connection.BeginTransaction();

                try
                {
                    // Serialize line items and notes to JSON
                    var lineItemsJson = request.LineItems != null && request.LineItems.Any()
                        ? JsonSerializer.Serialize(request.LineItems)
                        : "[]";

                    var notesJson = request.Notes != null && request.Notes.Any()
                        ? JsonSerializer.Serialize(request.Notes.Select(n => new { value = n }))
                        : "[]";

                    // Insert main quote with JSON data
                    var insertQuery = @"
                        INSERT INTO WarehouseQuotes (
                            CustomerId, CustomerName, Currency, IssuedDate, ValidityDays,
                            LineItemsJson, NotesJson, Status, CreatedBy, CreatedAt, UpdatedAt
                        )
                        VALUES (
                            @CustomerId, @CustomerName, @Currency, @IssuedDate, @ValidityDays,
                            @LineItemsJson, @NotesJson, 'Active', @CreatedBy, GETDATE(), GETDATE()
                        );
                        SELECT SCOPE_IDENTITY();";

                    int quoteId;
                    using (var command = new SqlCommand(insertQuery, connection, transaction))
                    {
                        command.Parameters.AddWithValue("@CustomerId", string.IsNullOrEmpty(request.CustomerId) ? (object)DBNull.Value : request.CustomerId);
                        command.Parameters.AddWithValue("@CustomerName", request.CustomerName ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@Currency", request.Currency);
                        command.Parameters.AddWithValue("@IssuedDate", request.IssuedDate ?? DateTime.Now);
                        command.Parameters.AddWithValue("@ValidityDays", request.ValidityDays ?? 30);
                        command.Parameters.AddWithValue("@LineItemsJson", lineItemsJson);
                        command.Parameters.AddWithValue("@NotesJson", notesJson);
                        command.Parameters.AddWithValue("@CreatedBy", "System");

                        var result = await command.ExecuteScalarAsync();
                        quoteId = Convert.ToInt32(result);
                    }

                    transaction.Commit();

                    return Ok(new { message = "Warehouse quote created successfully", quoteId });
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating warehouse quote");
                return StatusCode(500, new { message = "Error creating warehouse quote", error = ex.Message });
            }
        }

        // PUT: api/warehouse-quotes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWarehouseQuote(int id, [FromBody] WarehouseQuoteRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var transaction = connection.BeginTransaction();

                try
                {
                    // Serialize line items and notes to JSON
                    var lineItemsJson = request.LineItems != null && request.LineItems.Any()
                        ? JsonSerializer.Serialize(request.LineItems)
                        : "[]";

                    var notesJson = request.Notes != null && request.Notes.Any()
                        ? JsonSerializer.Serialize(request.Notes.Select(n => new { value = n }))
                        : "[]";

                    // Update main quote with JSON data
                    var updateQuery = @"
                        UPDATE WarehouseQuotes
                        SET CustomerId = @CustomerId,
                            CustomerName = @CustomerName,
                            Currency = @Currency,
                            IssuedDate = @IssuedDate,
                            ValidityDays = @ValidityDays,
                            LineItemsJson = @LineItemsJson,
                            NotesJson = @NotesJson,
                            UpdatedAt = GETDATE()
                        WHERE SysID = @QuoteId";

                    using (var command = new SqlCommand(updateQuery, connection, transaction))
                    {
                        command.Parameters.AddWithValue("@QuoteId", id);
                        command.Parameters.AddWithValue("@CustomerId", string.IsNullOrEmpty(request.CustomerId) ? (object)DBNull.Value : request.CustomerId);
                        command.Parameters.AddWithValue("@CustomerName", request.CustomerName ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@Currency", request.Currency);
                        command.Parameters.AddWithValue("@IssuedDate", request.IssuedDate);
                        command.Parameters.AddWithValue("@ValidityDays", request.ValidityDays);
                        command.Parameters.AddWithValue("@LineItemsJson", lineItemsJson);
                        command.Parameters.AddWithValue("@NotesJson", notesJson);

                        await command.ExecuteNonQueryAsync();
                    }

                    transaction.Commit();

                    return Ok(new { message = "Warehouse quote updated successfully" });
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating warehouse quote");
                return StatusCode(500, new { message = "Error updating warehouse quote", error = ex.Message });
            }
        }

        // DELETE: api/warehouse-quotes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouseQuote(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = "DELETE FROM WarehouseQuotes WHERE SysID = @QuoteId";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@QuoteId", id);

                int rowsAffected = await command.ExecuteNonQueryAsync();

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "Warehouse quote not found" });
                }

                return Ok(new { message = "Warehouse quote deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting warehouse quote");
                return StatusCode(500, new { message = "Error deleting warehouse quote", error = ex.Message });
            }
        }

        // PUT: api/warehouse-quotes/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateQuoteStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    UPDATE WarehouseQuotes
                    SET Status = @Status, UpdatedAt = GETDATE()
                    WHERE SysID = @QuoteId";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@QuoteId", id);
                command.Parameters.AddWithValue("@Status", request.Status);

                int rowsAffected = await command.ExecuteNonQueryAsync();

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "Warehouse quote not found" });
                }

                return Ok(new { message = "Quote status updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating quote status");
                return StatusCode(500, new { message = "Error updating quote status", error = ex.Message });
            }
        }
    }

    // Request models
    public class WarehouseQuoteRequest
    {
        public string? CustomerId { get; set; } = null!;
        public string? CustomerName { get; set; }
        public string? Currency { get; set; } = "LKR";
        public DateTime? IssuedDate { get; set; }
        public int? ValidityDays { get; set; } = 30;
        public DateTime? ValidityDate { get; set; }              // Ignored on save – computed in DB
        public List<LineItemRequest>? LineItems { get; set; }
        public List<string>? Notes { get; set; }
    }

    public class LineItemRequest
    {
        public string? Category { get; set; }
        public string? Description { get; set; } = null!;
        public string? Remarks { get; set; }
        public string? UnitOfMeasurement { get; set; }
        public decimal? Amount { get; set; }
    }

    public class UpdateStatusRequest
    {
        public string? Status { get; set; } = null!;
    }

    // Response models for deserialization
    public class LineItemResponse
    {
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string? Remarks { get; set; }
        public string? UnitOfMeasurement { get; set; }
        public decimal? Amount { get; set; }
    }

    public class NoteResponse
    {
        public string? Value { get; set; }
    }
}