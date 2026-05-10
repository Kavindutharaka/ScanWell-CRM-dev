using System;
using System.Collections.Generic;
using System.Data;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RfqController : ControllerBase
    {
        private readonly string _dbConnectionString;

        public RfqController(IConfiguration configuration)
        {
            _dbConnectionString = configuration.GetSection("DBCon").Value;
        }

        // GET /api/rfq - Get all RFQs
        [HttpGet]
        public ActionResult GetRfqs()
        {
            string query = "SELECT sysID, rfq_number, customer, valid_date, link, added_by, created_at, amount FROM [dbo].[rfq] ORDER BY sysID DESC";
            DataTable table = new DataTable();
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        table.Load(myR);
                    }
                }
                myCon.Close();
            }
            return Ok(table);
        }

        // POST /api/rfq - Create a new RFQ
        [HttpPost]
        public ActionResult CreateRfq([FromBody] Rfq rfq)
        {
            string query = @"INSERT INTO [dbo].[rfq] (rfq_number, customer, valid_date, link, added_by, created_at, amount)
                     VALUES (@rfq_number, @customer, @valid_date, @link, @added_by, GETDATE(), @amount)";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@rfq_number", rfq.rfq_number ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@customer", rfq.customer ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@valid_date", rfq.valid_date);
                    myCom.Parameters.AddWithValue("@link", rfq.link ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@added_by", rfq.added_by ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@amount", rfq.amount.HasValue ? (object)rfq.amount.Value : DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("RFQ added successfully.");
        }

        // PUT /api/rfq/{id} - Update an RFQ
        [HttpPut("{id}")]
        public ActionResult UpdateRfq(long id, [FromBody] Rfq rfq)
        {
            string query = @"UPDATE [dbo].[rfq] SET
                rfq_number = @rfq_number,
                customer = @customer,
                valid_date = @valid_date,
                link = @link,
                amount = @amount
                WHERE sysID = @sysID";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@sysID", id);
                    myCom.Parameters.AddWithValue("@rfq_number", rfq.rfq_number ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@customer", rfq.customer ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@valid_date", rfq.valid_date);
                    myCom.Parameters.AddWithValue("@link", rfq.link ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@amount", rfq.amount.HasValue ? (object)rfq.amount.Value : DBNull.Value);

                    int rowsAffected = myCom.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound("RFQ not found.");
                }
                myCon.Close();
            }

            return Ok("RFQ updated successfully.");
        }

        // DELETE /api/rfq/{id} - Delete an RFQ and its sales entries
        [HttpDelete("{id}")]
        public ActionResult DeleteRfq(long id)
        {
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();

                // Delete sales entries first
                string deleteEntries = "DELETE FROM rfq_sales_entries WHERE rfq_id = @rfq_id";
                using (SqlCommand myCom = new SqlCommand(deleteEntries, myCon))
                {
                    myCom.Parameters.AddWithValue("@rfq_id", id);
                    myCom.ExecuteNonQuery();
                }

                // Delete the RFQ
                string deleteRfq = "DELETE FROM [dbo].[rfq] WHERE sysID = @sysID";
                using (SqlCommand myCom = new SqlCommand(deleteRfq, myCon))
                {
                    myCom.Parameters.AddWithValue("@sysID", id);
                    int rowsAffected = myCom.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound("RFQ not found.");
                }

                myCon.Close();
            }

            return Ok("RFQ deleted successfully.");
        }

        // GET /api/rfq/{id}/sales-entries - Get sales entries for an RFQ
        [HttpGet("{id}/sales-entries")]
        public ActionResult GetSalesEntries(long id)
        {
            string query = @"SELECT id, rfq_id, mode, type, booking_no, amount, sales_person, created_at
                FROM rfq_sales_entries WHERE rfq_id = @rfq_id ORDER BY id DESC";

            var entries = new List<RfqSalesEntry>();
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@rfq_id", id);
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        while (myR.Read())
                        {
                            entries.Add(new RfqSalesEntry
                            {
                                Id = myR.GetInt64(myR.GetOrdinal("id")),
                                RfqId = myR.GetInt64(myR.GetOrdinal("rfq_id")),
                                Mode = myR.IsDBNull(myR.GetOrdinal("mode")) ? null : myR.GetString(myR.GetOrdinal("mode")),
                                Type = myR.IsDBNull(myR.GetOrdinal("type")) ? null : myR.GetString(myR.GetOrdinal("type")),
                                BookingNo = myR.IsDBNull(myR.GetOrdinal("booking_no")) ? null : myR.GetString(myR.GetOrdinal("booking_no")),
                                Amount = myR.GetDecimal(myR.GetOrdinal("amount")),
                                SalesPerson = myR.IsDBNull(myR.GetOrdinal("sales_person")) ? null : myR.GetString(myR.GetOrdinal("sales_person")),
                                CreatedAt = DateTime.SpecifyKind(myR.GetDateTime(myR.GetOrdinal("created_at")), DateTimeKind.Utc)
                            });
                        }
                    }
                }
                myCon.Close();
            }

            return Ok(entries);
        }

        // POST /api/rfq/{id}/sales-entries - Add sales entries to an RFQ (supports multiple)
        [HttpPost("{id}/sales-entries")]
        public ActionResult CreateSalesEntries(long id, [FromBody] List<RfqSalesEntry> entries)
        {
            if (entries == null || entries.Count == 0)
                return BadRequest("No sales entries provided.");

            string query = @"INSERT INTO rfq_sales_entries (rfq_id, mode, type, booking_no, amount, sales_person, created_at)
                VALUES (@rfq_id, @mode, @type, @booking_no, @amount, @sales_person, GETUTCDATE())";

            int insertedCount = 0;
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                foreach (var entry in entries)
                {
                    using (SqlCommand myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@rfq_id", id);
                        myCom.Parameters.AddWithValue("@mode", entry.Mode ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@type", entry.Type ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@booking_no", entry.BookingNo ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@amount", entry.Amount);
                        myCom.Parameters.AddWithValue("@sales_person", entry.SalesPerson ?? (object)DBNull.Value);

                        myCom.ExecuteNonQuery();
                        insertedCount++;
                    }
                }
                myCon.Close();
            }

            return Ok(new { message = $"{insertedCount} sales entry(ies) added successfully.", count = insertedCount });
        }

        // DELETE /api/rfq/sales-entry/{entryId} - Delete a single sales entry
        [HttpDelete("sales-entry/{entryId}")]
        public ActionResult DeleteSalesEntry(long entryId)
        {
            string query = "DELETE FROM rfq_sales_entries WHERE id = @id";
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", entryId);
                    int rowsAffected = myCom.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound("Sales entry not found.");
                }
                myCon.Close();
            }

            return Ok("Sales entry deleted successfully.");
        }
    }
}
