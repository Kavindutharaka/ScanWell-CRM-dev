using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly string _dbCon;

        public InvoiceController(IConfiguration configuration)
        {
            _dbCon = configuration.GetSection("DBCon").Value;
        }

        // GET: api/Invoice/won-quotes
        // Get all quotes with outcome = 'won'
        [HttpGet("won-quotes")]
        public IActionResult GetWonQuotes()
        {
            try
            {
                var quotes = new List<object>();

                using (var con = new SqlConnection(_dbCon))
                {
                    con.Open();

                    string query = @"
                        SELECT
                            q.QuoteId,
                            q.QuoteNumber,
                            q.Customer,
                            q.FreightCategory,
                            q.FreightType,
                            q.CreatedDate,
                            q.CreatedBy,
                            ISNULL(e.fname + ' ' + e.lname, '') AS CreatedByName,
                            qo.outcome_id,
                            qo.outcome_status,
                            qo.created_date AS outcome_date,
                            ISNULL(qo.invoice_completed, 0) AS invoice_completed
                        FROM [dbo].[Quotes] q
                        INNER JOIN quote_outcomes qo ON q.QuoteId = qo.quote_id
                        LEFT JOIN [dbo].[emp_reg] e ON q.CreatedBy = e.SysID
                        WHERE qo.outcome_status = 'won'
                        ORDER BY qo.created_date DESC";

                    using (var cmd = new SqlCommand(query, con))
                    {
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                quotes.Add(new
                                {
                                    quoteId = reader["QuoteId"],
                                    quoteNumber = reader["QuoteNumber"]?.ToString(),
                                    customerName = reader["Customer"]?.ToString(),
                                    salesPerson = reader["CreatedByName"]?.ToString(),
                                    category = reader["FreightCategory"]?.ToString(),
                                    type = reader["FreightType"]?.ToString(),
                                    createdDate = reader["CreatedDate"] != DBNull.Value
                                        ? DateTime.SpecifyKind(Convert.ToDateTime(reader["CreatedDate"]), DateTimeKind.Utc)
                                        : (DateTime?)null,
                                    outcomeDate = reader["outcome_date"] != DBNull.Value
                                        ? DateTime.SpecifyKind(Convert.ToDateTime(reader["outcome_date"]), DateTimeKind.Utc)
                                        : (DateTime?)null,
                                    invoiceCompleted = reader["invoice_completed"] != DBNull.Value && Convert.ToBoolean(reader["invoice_completed"])
                                });
                            }
                        }
                    }
                }

                return Ok(quotes);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetWonQuotes Error: {ex.Message}");
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }

        // GET: api/Invoice/entries/{quoteId}
        // Get invoice entries for a specific quote
        [HttpGet("entries/{quoteId}")]
        public IActionResult GetInvoiceEntries(int quoteId)
        {
            try
            {
                var entries = new List<object>();

                using (var con = new SqlConnection(_dbCon))
                {
                    con.Open();

                    string query = @"
                        SELECT id, quote_id, entry_date, invoice_number, amount, created_at
                        FROM invoice_entries
                        WHERE quote_id = @QuoteId
                        ORDER BY id DESC";

                    using (var cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@QuoteId", quoteId);

                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                entries.Add(new
                                {
                                    id = Convert.ToInt32(reader["id"]),
                                    quoteId = Convert.ToInt32(reader["quote_id"]),
                                    entryDate = reader["entry_date"] != DBNull.Value
                                        ? Convert.ToDateTime(reader["entry_date"]).ToString("yyyy-MM-dd")
                                        : null,
                                    invoiceNumber = reader["invoice_number"]?.ToString(),
                                    amount = reader["amount"] != DBNull.Value ? Convert.ToDecimal(reader["amount"]) : 0m,
                                    createdAt = reader["created_at"] != DBNull.Value
                                        ? DateTime.SpecifyKind(Convert.ToDateTime(reader["created_at"]), DateTimeKind.Utc)
                                        : (DateTime?)null
                                });
                            }
                        }
                    }
                }

                return Ok(entries);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetInvoiceEntries Error: {ex.Message}");
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }

        // POST: api/Invoice/entries
        // Create invoice entries for a quote
        [HttpPost("entries")]
        public IActionResult CreateInvoiceEntries([FromBody] InvoiceEntriesRequest request)
        {
            try
            {
                if (request.QuoteId <= 0)
                    return BadRequest(new { message = "Invalid quote ID" });

                if (request.Entries == null || request.Entries.Count == 0)
                    return BadRequest(new { message = "No entries provided" });

                using (var con = new SqlConnection(_dbCon))
                {
                    con.Open();

                    // Check if invoice is completed (frozen)
                    string checkQuery = @"
                        SELECT invoice_completed
                        FROM quote_outcomes
                        WHERE quote_id = @QuoteId AND outcome_status = 'won'";

                    using (var checkCmd = new SqlCommand(checkQuery, con))
                    {
                        checkCmd.Parameters.AddWithValue("@QuoteId", request.QuoteId);
                        var completed = checkCmd.ExecuteScalar();
                        if (completed != null && completed != DBNull.Value && Convert.ToBoolean(completed))
                        {
                            return BadRequest(new { message = "Invoice is completed and cannot be modified" });
                        }
                    }

                    int count = 0;
                    foreach (var entry in request.Entries)
                    {
                        string insertQuery = @"
                            INSERT INTO invoice_entries (quote_id, entry_date, invoice_number, amount, created_at)
                            VALUES (@QuoteId, @EntryDate, @InvoiceNumber, @Amount, GETUTCDATE())";

                        using (var cmd = new SqlCommand(insertQuery, con))
                        {
                            cmd.Parameters.AddWithValue("@QuoteId", request.QuoteId);
                            cmd.Parameters.AddWithValue("@EntryDate",
                                !string.IsNullOrEmpty(entry.EntryDate) ? (object)DateTime.Parse(entry.EntryDate) : DBNull.Value);
                            cmd.Parameters.AddWithValue("@InvoiceNumber",
                                !string.IsNullOrEmpty(entry.InvoiceNumber) ? (object)entry.InvoiceNumber : DBNull.Value);
                            cmd.Parameters.AddWithValue("@Amount",
                                entry.Amount.HasValue ? (object)entry.Amount.Value : DBNull.Value);

                            cmd.ExecuteNonQuery();
                            count++;
                        }
                    }

                    return Ok(new { message = $"{count} invoice entries saved successfully" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CreateInvoiceEntries Error: {ex.Message}");
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }

        // DELETE: api/Invoice/entries/{entryId}
        // Delete a single invoice entry
        [HttpDelete("entries/{entryId}")]
        public IActionResult DeleteInvoiceEntry(int entryId)
        {
            try
            {
                using (var con = new SqlConnection(_dbCon))
                {
                    con.Open();

                    // Check if the invoice is completed before allowing delete
                    string checkQuery = @"
                        SELECT qo.invoice_completed
                        FROM invoice_entries ie
                        INNER JOIN quote_outcomes qo ON ie.quote_id = qo.quote_id
                        WHERE ie.id = @EntryId";

                    using (var checkCmd = new SqlCommand(checkQuery, con))
                    {
                        checkCmd.Parameters.AddWithValue("@EntryId", entryId);
                        var completed = checkCmd.ExecuteScalar();
                        if (completed != null && completed != DBNull.Value && Convert.ToBoolean(completed))
                        {
                            return BadRequest(new { message = "Invoice is completed and cannot be modified" });
                        }
                    }

                    string query = "DELETE FROM invoice_entries WHERE id = @EntryId";
                    using (var cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@EntryId", entryId);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0)
                            return NotFound(new { message = "Entry not found" });
                    }
                }

                return Ok(new { message = "Invoice entry deleted" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DeleteInvoiceEntry Error: {ex.Message}");
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }

        // PUT: api/Invoice/complete/{quoteId}
        // Mark invoice as completed (frozen) - Admin only
        [HttpPut("complete/{quoteId}")]
        public IActionResult CompleteInvoice(int quoteId)
        {
            try
            {
                using (var con = new SqlConnection(_dbCon))
                {
                    con.Open();

                    string query = @"
                        UPDATE quote_outcomes
                        SET invoice_completed = 1
                        WHERE quote_id = @QuoteId AND outcome_status = 'won'";

                    using (var cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@QuoteId", quoteId);
                        int rows = cmd.ExecuteNonQuery();

                        if (rows == 0)
                            return NotFound(new { message = "No won outcome found for this quote" });
                    }
                }

                return Ok(new { message = "Invoice completed successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CompleteInvoice Error: {ex.Message}");
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }
    }

    // Request models
    public class InvoiceEntriesRequest
    {
        public int QuoteId { get; set; }
        public List<InvoiceEntryItem> Entries { get; set; }
    }

    public class InvoiceEntryItem
    {
        public string EntryDate { get; set; }
        public string InvoiceNumber { get; set; }
        public decimal? Amount { get; set; }
    }
}
