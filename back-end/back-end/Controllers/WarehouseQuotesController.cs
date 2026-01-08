using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

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
                        wq.UpdatedAt
                    FROM WarehouseQuotes wq
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
                        updatedAt = reader["UpdatedAt"]
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
        [HttpGet("{id}")]
        public async Task<IActionResult> GetWarehouseQuote(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                // Get main quote data
                var quoteQuery = @"
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
                        wq.UpdatedAt
                    FROM WarehouseQuotes wq
                    WHERE wq.SysID = @QuoteId";

                using var quoteCommand = new SqlCommand(quoteQuery, connection);
                quoteCommand.Parameters.AddWithValue("@QuoteId", id);

                object quoteData = null;
                using (var reader = await quoteCommand.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        quoteData = new
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
                            updatedAt = reader["UpdatedAt"]
                        };
                    }
                }

                if (quoteData == null)
                {
                    return NotFound(new { message = "Warehouse quote not found" });
                }

                // Get line items
                var lineItemsQuery = @"
                    SELECT 
                        SysID,
                        ItemSequence,
                        Category,
                        Description,
                        Remarks,
                        UnitOfMeasurement,
                        Amount
                    FROM WarehouseQuoteLineItems
                    WHERE WarehouseQuoteId = @QuoteId
                    ORDER BY ItemSequence";

                var lineItems = new List<object>();
                using var lineItemsCommand = new SqlCommand(lineItemsQuery, connection);
                lineItemsCommand.Parameters.AddWithValue("@QuoteId", id);

                using (var reader = await lineItemsCommand.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        lineItems.Add(new
                        {
                            id = reader["SysID"],
                            category = reader["Category"],
                            description = reader["Description"],
                            remarks = reader["Remarks"] == DBNull.Value ? null : reader["Remarks"],
                            unitOfMeasurement = reader["UnitOfMeasurement"] == DBNull.Value ? null : reader["UnitOfMeasurement"],
                            amount = reader["Amount"]
                        });
                    }
                }

                // Get notes
                var notesQuery = @"
                    SELECT 
                        SysID,
                        NoteSequence,
                        NoteText
                    FROM WarehouseQuoteNotes
                    WHERE WarehouseQuoteId = @QuoteId
                    ORDER BY NoteSequence";

                var notes = new List<string>();
                using var notesCommand = new SqlCommand(notesQuery, connection);
                notesCommand.Parameters.AddWithValue("@QuoteId", id);

                using (var reader = await notesCommand.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        notes.Add(reader["NoteText"].ToString());
                    }
                }

                var result = new
                {
                    quote = quoteData,
                    lineItems = lineItems,
                    notes = notes
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
                    // Insert main quote
                    var insertQuoteQuery = @"
                        INSERT INTO WarehouseQuotes (
                            CustomerId, CustomerName, Currency, IssuedDate, 
                            ValidityDays, ValidityDate, Status, CreatedBy
                        )
                        OUTPUT INSERTED.SysID
                        VALUES (
                            @CustomerId, @CustomerName, @Currency, @IssuedDate,
                            @ValidityDays, @ValidityDate, 'Draft', @CreatedBy
                        )";

                    int quoteId;
                    using (var command = new SqlCommand(insertQuoteQuery, connection, transaction))
                    {
                        command.Parameters.AddWithValue("@CustomerId", request.CustomerId);
                        command.Parameters.AddWithValue("@CustomerName", request.CustomerName ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@Currency", request.Currency);
                        command.Parameters.AddWithValue("@IssuedDate", request.IssuedDate);
                        command.Parameters.AddWithValue("@ValidityDays", request.ValidityDays);
                        command.Parameters.AddWithValue("@ValidityDate", request.ValidityDate ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@CreatedBy", "System"); // Replace with actual user

                        quoteId = (int)await command.ExecuteScalarAsync();
                    }

                    // Insert line items
                    if (request.LineItems != null && request.LineItems.Any())
                    {
                        var insertLineItemQuery = @"
                            INSERT INTO WarehouseQuoteLineItems (
                                WarehouseQuoteId, ItemSequence, Category, Description,
                                Remarks, UnitOfMeasurement, Amount
                            )
                            VALUES (
                                @WarehouseQuoteId, @ItemSequence, @Category, @Description,
                                @Remarks, @UnitOfMeasurement, @Amount
                            )";

                        for (int i = 0; i < request.LineItems.Count; i++)
                        {
                            var item = request.LineItems[i];
                            using var command = new SqlCommand(insertLineItemQuery, connection, transaction);
                            command.Parameters.AddWithValue("@WarehouseQuoteId", quoteId);
                            command.Parameters.AddWithValue("@ItemSequence", i + 1);
                            command.Parameters.AddWithValue("@Category", item.Category ?? (object)DBNull.Value);
                            command.Parameters.AddWithValue("@Description", item.Description);
                            command.Parameters.AddWithValue("@Remarks", item.Remarks ?? (object)DBNull.Value);
                            command.Parameters.AddWithValue("@UnitOfMeasurement", item.UnitOfMeasurement ?? (object)DBNull.Value);
                            command.Parameters.AddWithValue("@Amount", item.Amount);

                            await command.ExecuteNonQueryAsync();
                        }
                    }

                    // Insert notes
                    if (request.Notes != null && request.Notes.Any())
                    {
                        var insertNoteQuery = @"
                            INSERT INTO WarehouseQuoteNotes (
                                WarehouseQuoteId, NoteSequence, NoteText
                            )
                            VALUES (
                                @WarehouseQuoteId, @NoteSequence, @NoteText
                            )";

                        for (int i = 0; i < request.Notes.Count; i++)
                        {
                            if (!string.IsNullOrWhiteSpace(request.Notes[i]))
                            {
                                using var command = new SqlCommand(insertNoteQuery, connection, transaction);
                                command.Parameters.AddWithValue("@WarehouseQuoteId", quoteId);
                                command.Parameters.AddWithValue("@NoteSequence", i + 1);
                                command.Parameters.AddWithValue("@NoteText", request.Notes[i]);

                                await command.ExecuteNonQueryAsync();
                            }
                        }
                    }

                    transaction.Commit();

                    return Ok(new { 
                        message = "Warehouse quote created successfully", 
                        quoteId = quoteId 
                    });
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
                    // Update main quote
                    var updateQuoteQuery = @"
                        UPDATE WarehouseQuotes
                        SET CustomerId = @CustomerId,
                            CustomerName = @CustomerName,
                            Currency = @Currency,
                            IssuedDate = @IssuedDate,
                            ValidityDays = @ValidityDays,
                            ValidityDate = @ValidityDate,
                            UpdatedAt = GETDATE()
                        WHERE SysID = @QuoteId";

                    using (var command = new SqlCommand(updateQuoteQuery, connection, transaction))
                    {
                        command.Parameters.AddWithValue("@QuoteId", id);
                        command.Parameters.AddWithValue("@CustomerId", request.CustomerId);
                        command.Parameters.AddWithValue("@CustomerName", request.CustomerName ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@Currency", request.Currency);
                        command.Parameters.AddWithValue("@IssuedDate", request.IssuedDate);
                        command.Parameters.AddWithValue("@ValidityDays", request.ValidityDays);
                        command.Parameters.AddWithValue("@ValidityDate", request.ValidityDate ?? (object)DBNull.Value);

                        await command.ExecuteNonQueryAsync();
                    }

                    // Delete existing line items and notes
                    using (var command = new SqlCommand("DELETE FROM WarehouseQuoteLineItems WHERE WarehouseQuoteId = @QuoteId", connection, transaction))
                    {
                        command.Parameters.AddWithValue("@QuoteId", id);
                        await command.ExecuteNonQueryAsync();
                    }

                    using (var command = new SqlCommand("DELETE FROM WarehouseQuoteNotes WHERE WarehouseQuoteId = @QuoteId", connection, transaction))
                    {
                        command.Parameters.AddWithValue("@QuoteId", id);
                        await command.ExecuteNonQueryAsync();
                    }

                    // Insert new line items
                    if (request.LineItems != null && request.LineItems.Any())
                    {
                        var insertLineItemQuery = @"
                            INSERT INTO WarehouseQuoteLineItems (
                                WarehouseQuoteId, ItemSequence, Category, Description,
                                Remarks, UnitOfMeasurement, Amount
                            )
                            VALUES (
                                @WarehouseQuoteId, @ItemSequence, @Category, @Description,
                                @Remarks, @UnitOfMeasurement, @Amount
                            )";

                        for (int i = 0; i < request.LineItems.Count; i++)
                        {
                            var item = request.LineItems[i];
                            using var command = new SqlCommand(insertLineItemQuery, connection, transaction);
                            command.Parameters.AddWithValue("@WarehouseQuoteId", id);
                            command.Parameters.AddWithValue("@ItemSequence", i + 1);
                            command.Parameters.AddWithValue("@Category", item.Category ?? (object)DBNull.Value);
                            command.Parameters.AddWithValue("@Description", item.Description);
                            command.Parameters.AddWithValue("@Remarks", item.Remarks ?? (object)DBNull.Value);
                            command.Parameters.AddWithValue("@UnitOfMeasurement", item.UnitOfMeasurement ?? (object)DBNull.Value);
                            command.Parameters.AddWithValue("@Amount", item.Amount);

                            await command.ExecuteNonQueryAsync();
                        }
                    }

                    // Insert new notes
                    if (request.Notes != null && request.Notes.Any())
                    {
                        var insertNoteQuery = @"
                            INSERT INTO WarehouseQuoteNotes (
                                WarehouseQuoteId, NoteSequence, NoteText
                            )
                            VALUES (
                                @WarehouseQuoteId, @NoteSequence, @NoteText
                            )";

                        for (int i = 0; i < request.Notes.Count; i++)
                        {
                            if (!string.IsNullOrWhiteSpace(request.Notes[i]))
                            {
                                using var command = new SqlCommand(insertNoteQuery, connection, transaction);
                                command.Parameters.AddWithValue("@WarehouseQuoteId", id);
                                command.Parameters.AddWithValue("@NoteSequence", i + 1);
                                command.Parameters.AddWithValue("@NoteText", request.Notes[i]);

                                await command.ExecuteNonQueryAsync();
                            }
                        }
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
        public string CustomerId { get; set; } = null!;          // Changed to string to match table NVARCHAR(128)
        public string? CustomerName { get; set; }
        public string Currency { get; set; } = "LKR";
        public DateTime IssuedDate { get; set; }
        public int ValidityDays { get; set; } = 30;
        public DateTime? ValidityDate { get; set; }              // Kept for client convenience but IGNORED in INSERT/UPDATE (computed column)
        public List<LineItemRequest>? LineItems { get; set; }
        public List<string>? Notes { get; set; }
    }

    public class LineItemRequest
    {
        public string? Category { get; set; }
        public string Description { get; set; } = null!;
        public string? Remarks { get; set; }
        public string? UnitOfMeasurement { get; set; }
        public decimal Amount { get; set; }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = null!;
    }
}
