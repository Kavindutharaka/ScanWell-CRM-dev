using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;

        public DocumentsController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
        }

        [HttpGet]
        public ActionResult GetAll()
        {
            var documents = new List<BaseDocument>();

            string query = "SELECT * FROM documents ORDER BY Id DESC";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        while (myR.Read())
                        {
                            BaseDocument doc = CreateDocumentFromReader(myR);
                            documents.Add(doc);
                        }
                    }
                }
                myCon.Close();
            }

            // Load charges and remarks for each
            foreach (var doc in documents)
            {
                LoadAdditionalCharges(doc);
                LoadRemarks(doc);
            }

            return Ok(documents);
        }

        [HttpGet("{id}")]
        public ActionResult GetById(long id)
        {
            BaseDocument document = null;

            string query = "SELECT * FROM documents WHERE Id = @id";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        if (myR.Read())
                        {
                            document = CreateDocumentFromReader(myR);
                        }
                    }
                }
                myCon.Close();
            }

            if (document == null) return NotFound("Document not found.");

            LoadAdditionalCharges(document);
            LoadRemarks(document);

            return Ok(document);
        }

        [HttpPost("quotes")]
        public ActionResult CreateQuote([FromBody] Quote quote)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Auto-generate document number if not provided
            if (string.IsNullOrEmpty(quote.DocumentNumber))
            {
                var year = DateTime.UtcNow.Year;
                var randomNum = new Random().Next(1000).ToString("D3");
                quote.DocumentNumber = $"QUO-{year}-{randomNum}";
            }

            quote.Amount = CalculateTotalAmount(quote);

            string rateDataJson = JsonSerializer.Serialize(quote.RateData);

            string query = @"
                INSERT INTO documents 
                (DocumentNumber, Type, Amount, Recipient, RecipientEmail, RecipientAddress, Status, IssueDate, DueDate, ExpiryDate, ValidUntil, Currency, Notes, Terms, FreightType, RateDataJson, Owner)
                VALUES 
                (@DocumentNumber, @Type, @Amount, @Recipient, @RecipientEmail, @RecipientAddress, @Status, @IssueDate, @DueDate, @ExpiryDate, @ValidUntil, @Currency, @Notes, @Terms, @FreightType, @RateDataJson, @Owner);
                SELECT SCOPE_IDENTITY();";

            long newId;
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@DocumentNumber", quote.DocumentNumber ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Type", quote.Type ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Amount", quote.Amount);
                    myCom.Parameters.AddWithValue("@Recipient", quote.Recipient ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RecipientEmail", quote.RecipientEmail ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RecipientAddress", quote.RecipientAddress ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Status", quote.Status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@IssueDate", quote.IssueDate);
                    myCom.Parameters.AddWithValue("@DueDate", quote.DueDate ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@ExpiryDate", quote.ExpiryDate ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@ValidUntil", quote.ValidUntil ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Currency", quote.Currency ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Notes", quote.Notes ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Terms", quote.Terms ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@FreightType", quote.FreightType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RateDataJson", rateDataJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Owner", quote.Owner ?? (object)DBNull.Value);

                    newId = Convert.ToInt64(myCom.ExecuteScalar());
                }
                myCon.Close();
            }

            // Insert AdditionalCharges
            foreach (var charge in quote.AdditionalCharges)
            {
                string chargeQuery = @"
                    INSERT INTO additional_charges (DocumentId, Type, Description, Amount)
                    VALUES (@DocumentId, @Type, @Description, @Amount);";

                using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
                {
                    myCon.Open();
                    using (SqlCommand myCom = new SqlCommand(chargeQuery, myCon))
                    {
                        myCom.Parameters.AddWithValue("@DocumentId", newId);
                        myCom.Parameters.AddWithValue("@Type", charge.Type ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@Description", charge.Description ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@Amount", charge.Amount);

                        myCom.ExecuteNonQuery();
                    }
                    myCon.Close();
                }
            }

            // Insert Remarks
            foreach (var remark in quote.Remarks)
            {
                string remarkQuery = @"
                    INSERT INTO remarks (DocumentId, Remark)
                    VALUES (@DocumentId, @Remark);";

                using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
                {
                    myCon.Open();
                    using (SqlCommand myCom = new SqlCommand(remarkQuery, myCon))
                    {
                        myCom.Parameters.AddWithValue("@DocumentId", newId);
                        myCom.Parameters.AddWithValue("@Remark", remark);

                        myCom.ExecuteNonQuery();
                    }
                    myCon.Close();
                }
            }

            quote.Id = newId;
            return Ok(quote);
        }

        [HttpPost("invoices")]
        public ActionResult CreateInvoice([FromBody] Invoice invoice)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Auto-generate document number if not provided
            if (string.IsNullOrEmpty(invoice.DocumentNumber))
            {
                var year = DateTime.UtcNow.Year;
                var randomNum = new Random().Next(1000).ToString("D3");
                invoice.DocumentNumber = $"INV-{year}-{randomNum}";
            }

            invoice.Amount = CalculateTotalAmount(invoice);

            string rateDataJson = JsonSerializer.Serialize(invoice.RateData);

            string query = @"
                INSERT INTO documents 
                (DocumentNumber, Type, Amount, Recipient, RecipientEmail, RecipientAddress, Status, IssueDate, DueDate, ExpiryDate, ValidUntil, Currency, Notes, Terms, FreightType, RateDataJson, Owner)
                VALUES 
                (@DocumentNumber, @Type, @Amount, @Recipient, @RecipientEmail, @RecipientAddress, @Status, @IssueDate, @DueDate, @ExpiryDate, @ValidUntil, @Currency, @Notes, @Terms, @FreightType, @RateDataJson, @Owner);
                SELECT SCOPE_IDENTITY();";

            long newId;
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@DocumentNumber", invoice.DocumentNumber ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Type", invoice.Type ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Amount", invoice.Amount);
                    myCom.Parameters.AddWithValue("@Recipient", invoice.Recipient ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RecipientEmail", invoice.RecipientEmail ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RecipientAddress", invoice.RecipientAddress ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Status", invoice.Status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@IssueDate", invoice.IssueDate);
                    myCom.Parameters.AddWithValue("@DueDate", invoice.DueDate ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@ExpiryDate", invoice.ExpiryDate ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@ValidUntil", invoice.ValidUntil ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Currency", invoice.Currency ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Notes", invoice.Notes ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Terms", invoice.Terms ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@FreightType", invoice.FreightType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RateDataJson", rateDataJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Owner", invoice.Owner ?? (object)DBNull.Value);

                    newId = Convert.ToInt64(myCom.ExecuteScalar());
                }
                myCon.Close();
            }

            // Insert AdditionalCharges
            foreach (var charge in invoice.AdditionalCharges)
            {
                string chargeQuery = @"
                    INSERT INTO additional_charges (DocumentId, Type, Description, Amount)
                    VALUES (@DocumentId, @Type, @Description, @Amount);";

                using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
                {
                    myCon.Open();
                    using (SqlCommand myCom = new SqlCommand(chargeQuery, myCon))
                    {
                        myCom.Parameters.AddWithValue("@DocumentId", newId);
                        myCom.Parameters.AddWithValue("@Type", charge.Type ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@Description", charge.Description ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@Amount", charge.Amount);

                        myCom.ExecuteNonQuery();
                    }
                    myCon.Close();
                }
            }

            // Insert Remarks
            foreach (var remark in invoice.Remarks)
            {
                string remarkQuery = @"
                    INSERT INTO remarks (DocumentId, Remark)
                    VALUES (@DocumentId, @Remark);";

                using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
                {
                    myCon.Open();
                    using (SqlCommand myCom = new SqlCommand(remarkQuery, myCon))
                    {
                        myCom.Parameters.AddWithValue("@DocumentId", newId);
                        myCom.Parameters.AddWithValue("@Remark", remark);

                        myCom.ExecuteNonQuery();
                    }
                    myCon.Close();
                }
            }

            invoice.Id = newId;
            return Ok(invoice);
        }

        [HttpPut("{id}")]
        public ActionResult Update(long id, [FromBody] BaseDocument document)
        {
            if (document.Id != id) return BadRequest("ID mismatch");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            document.Amount = CalculateTotalAmount(document);

            string rateDataJson = JsonSerializer.Serialize(document.RateData);

            string query = @"
                UPDATE documents SET
                DocumentNumber = @DocumentNumber,
                Type = @Type,
                Amount = @Amount,
                Recipient = @Recipient,
                RecipientEmail = @RecipientEmail,
                RecipientAddress = @RecipientAddress,
                Status = @Status,
                IssueDate = @IssueDate,
                DueDate = @DueDate,
                ExpiryDate = @ExpiryDate,
                ValidUntil = @ValidUntil,
                Currency = @Currency,
                Notes = @Notes,
                Terms = @Terms,
                FreightType = @FreightType,
                RateDataJson = @RateDataJson,
                Owner = @Owner
                WHERE Id = @Id;";

            int rowsAffected;
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@Id", id);
                    myCom.Parameters.AddWithValue("@DocumentNumber", document.DocumentNumber ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Type", document.Type ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Amount", document.Amount);
                    myCom.Parameters.AddWithValue("@Recipient", document.Recipient ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RecipientEmail", document.RecipientEmail ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RecipientAddress", document.RecipientAddress ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Status", document.Status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@IssueDate", document.IssueDate);
                    myCom.Parameters.AddWithValue("@DueDate", document.DueDate ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@ExpiryDate", document.ExpiryDate ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@ValidUntil", document.ValidUntil ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Currency", document.Currency ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Notes", document.Notes ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Terms", document.Terms ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@FreightType", document.FreightType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RateDataJson", rateDataJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Owner", document.Owner ?? (object)DBNull.Value);

                    rowsAffected = myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            if (rowsAffected == 0) return NotFound("Document not found.");

            // Delete existing AdditionalCharges and Remarks
            string deleteCharges = "DELETE FROM additional_charges WHERE DocumentId = @DocumentId;";
            string deleteRemarks = "DELETE FROM remarks WHERE DocumentId = @DocumentId;";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(deleteCharges + deleteRemarks, myCon))
                {
                    myCom.Parameters.AddWithValue("@DocumentId", id);
                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            // Insert new AdditionalCharges
            foreach (var charge in document.AdditionalCharges)
            {
                string chargeQuery = @"
                    INSERT INTO additional_charges (DocumentId, Type, Description, Amount)
                    VALUES (@DocumentId, @Type, @Description, @Amount);";

                using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
                {
                    myCon.Open();
                    using (SqlCommand myCom = new SqlCommand(chargeQuery, myCon))
                    {
                        myCom.Parameters.AddWithValue("@DocumentId", id);
                        myCom.Parameters.AddWithValue("@Type", charge.Type ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@Description", charge.Description ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@Amount", charge.Amount);

                        myCom.ExecuteNonQuery();
                    }
                    myCon.Close();
                }
            }

            // Insert new Remarks
            foreach (var remark in document.Remarks)
            {
                string remarkQuery = @"
                    INSERT INTO remarks (DocumentId, Remark)
                    VALUES (@DocumentId, @Remark);";

                using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
                {
                    myCon.Open();
                    using (SqlCommand myCom = new SqlCommand(remarkQuery, myCon))
                    {
                        myCom.Parameters.AddWithValue("@DocumentId", id);
                        myCom.Parameters.AddWithValue("@Remark", remark);

                        myCom.ExecuteNonQuery();
                    }
                    myCon.Close();
                }
            }

            return Ok(document);
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(long id)
        {
            string query = @"DELETE FROM documents WHERE Id = @id;";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);

                    int rowsAffected = myCom.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound("Document not found.");
                }
                myCon.Close();
            }

            return Ok("Document deleted successfully.");
        }

        // Placeholder for PDF download
        [HttpGet("{id}/download")]
        public ActionResult DownloadPdf(long id)
        {
            // Implement PDF generation
            byte[] pdfBytes = new byte[0]; // Placeholder
            return File(pdfBytes, "application/pdf", "document.pdf");
        }

        // Placeholder for send
        [HttpPost("{id}/send")]
        public ActionResult Send(long id)
        {
            // Implement email sending
            return Ok("Document sent successfully.");
        }

        private BaseDocument CreateDocumentFromReader(SqlDataReader reader)
        {
            string type = reader["Type"].ToString();
            BaseDocument doc = type == "Quote" ? new Quote() : new Invoice();

            doc.Id = Convert.ToInt64(reader["Id"]);
            doc.DocumentNumber = reader["DocumentNumber"].ToString();
            doc.Type = type;
            doc.Amount = Convert.ToDecimal(reader["Amount"]);
            doc.Recipient = reader["Recipient"].ToString();
            doc.RecipientEmail = reader["RecipientEmail"].ToString();
            doc.RecipientAddress = reader.IsDBNull(reader.GetOrdinal("RecipientAddress")) ? null : reader["RecipientAddress"].ToString();
            doc.Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader["Status"].ToString();
            doc.IssueDate = Convert.ToDateTime(reader["IssueDate"]);
            doc.DueDate = reader.IsDBNull(reader.GetOrdinal("DueDate")) ? null : (DateTime?)Convert.ToDateTime(reader["DueDate"]);
            doc.ExpiryDate = reader.IsDBNull(reader.GetOrdinal("ExpiryDate")) ? null : (DateTime?)Convert.ToDateTime(reader["ExpiryDate"]);
            doc.ValidUntil = reader.IsDBNull(reader.GetOrdinal("ValidUntil")) ? null : (DateTime?)Convert.ToDateTime(reader["ValidUntil"]);
            doc.Currency = reader["Currency"].ToString();
            doc.Notes = reader.IsDBNull(reader.GetOrdinal("Notes")) ? null : reader["Notes"].ToString();
            doc.Terms = reader.IsDBNull(reader.GetOrdinal("Terms")) ? null : reader["Terms"].ToString();
            doc.FreightType = reader.IsDBNull(reader.GetOrdinal("FreightType")) ? null : reader["FreightType"].ToString();
            string rateJson = reader.IsDBNull(reader.GetOrdinal("RateDataJson")) ? null : reader["RateDataJson"].ToString();
            doc.RateData = string.IsNullOrEmpty(rateJson) ? null : JsonSerializer.Deserialize<RateData>(rateJson);
            doc.Owner = reader.IsDBNull(reader.GetOrdinal("Owner")) ? null : reader["Owner"].ToString();

            return doc;
        }

        private void LoadAdditionalCharges(BaseDocument doc)
        {
            string query = "SELECT * FROM additional_charges WHERE DocumentId = @id";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", doc.Id);
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        while (myR.Read())
                        {
                            var charge = new AdditionalCharge
                            {
                                Id = Convert.ToInt64(myR["Id"]),
                                Type = myR.IsDBNull(myR.GetOrdinal("Type")) ? null : myR["Type"].ToString(),
                                Description = myR.IsDBNull(myR.GetOrdinal("Description")) ? null : myR["Description"].ToString(),
                                Amount = Convert.ToDecimal(myR["Amount"])
                            };
                            doc.AdditionalCharges.Add(charge);
                        }
                    }
                }
                myCon.Close();
            }
        }

        private void LoadRemarks(BaseDocument doc)
        {
            string query = "SELECT * FROM remarks WHERE DocumentId = @id";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", doc.Id);
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        while (myR.Read())
                        {
                            doc.Remarks.Add(myR["Remark"].ToString());
                        }
                    }
                }
                myCon.Close();
            }
        }

        private decimal CalculateTotalAmount(BaseDocument document)
        {
            decimal total = document.AdditionalCharges?.Sum(c => c.Amount) ?? 0;

            if (document.RateData != null)
            {
                if (document.FreightType.StartsWith("air"))
                {
                    total += document.RateData.RateM ?? 0;
                    total += document.RateData.Rate45Minus ?? 0;
                    total += document.RateData.Rate45Plus ?? 0;
                    total += document.RateData.Rate100 ?? 0;
                    total += document.RateData.Rate300 ?? 0;
                    total += document.RateData.Rate500 ?? 0;
                    total += document.RateData.Rate1000 ?? 0;
                }
                else if (document.FreightType.Contains("fcl"))
                {
                    total += document.RateData.Rate20GP ?? 0;
                    total += document.RateData.Rate40GP ?? 0;
                    total += document.RateData.Rate40HQ ?? 0;
                }
                else if (document.FreightType.Contains("lcl"))
                {
                    total += document.RateData.LclRate ?? 0;
                }
            }

            return total;
        }
    }
}