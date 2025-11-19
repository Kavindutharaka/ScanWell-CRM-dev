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

            foreach (var doc in documents)
            {
                LoadAdditionalCharges(doc);
                LoadRemarks(doc);
                LoadLookupNames(doc);  // New: Load names for IDs (e.g., CustomerName)
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
            LoadLookupNames(document);  // New

            return Ok(document);
        }

        [HttpPost("quotes")]
        public ActionResult CreateQuote([FromBody] Quote quote)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Auto-generate QuoteId if not provided (new format)
            if (string.IsNullOrEmpty(quote.QuoteId))
            {
                quote.QuoteId = GenerateQuoteId();
            }

            // Auto-generate DocumentNumber if not provided (old logic)
            if (string.IsNullOrEmpty(quote.DocumentNumber))
            {
                var year = DateTime.UtcNow.Year;
                var randomNum = new Random().Next(1000).ToString("D3");
                quote.DocumentNumber = $"QUO-{year}-{randomNum}";
            }

            // Serialize new JSON fields
            string routeConfigJson = JsonSerializer.Serialize(quote.RouteConfigJson);  // Assume front sends as object, but serialize here
            string directRouteJson = JsonSerializer.Serialize(quote.DirectRouteJson);
            string transitRouteJson = JsonSerializer.Serialize(quote.TransitRouteJson);
            string multimodalSegmentsJson = JsonSerializer.Serialize(quote.MultimodalSegmentsJson);
            string routePlanDataJson = JsonSerializer.Serialize(quote.RoutePlanDataJson);
            string freightChargesJson = JsonSerializer.Serialize(quote.FreightChargesJson);
            string termsConditionsJson = JsonSerializer.Serialize(quote.TermsConditionsJson);
            string customTermsJson = JsonSerializer.Serialize(quote.CustomTermsJson);

            // Map terms to remarks for backward compat (combine standard + custom)
            quote.Remarks = JsonSerializer.Deserialize<List<string>>(termsConditionsJson) ?? new List<string>();
            quote.Remarks.AddRange(JsonSerializer.Deserialize<List<string>>(customTermsJson) ?? new List<string>());

            quote.Amount = CalculateTotalAmount(quote);

            string rateDataJson = JsonSerializer.Serialize(quote.RateData);  // Old, keep if needed

            string query = @"
                INSERT INTO documents 
                (QuoteId, DocumentNumber, Type, Amount, CustomerId, CustomerName, Recipient, RecipientEmail, RecipientAddress, 
                 PickupLocationId, DeliveryLocationId, CreditTermsId, ClientId, ClientName, Days, FreightMode, FreightCategory, 
                 CreatedBy, CreatedDate, Status, IssueDate, DueDate, ExpiryDate, ValidUntil, Currency, Notes, Terms, 
                 FreightType, RateDataJson, Owner, RouteConfigJson, DirectRouteJson, TransitRouteJson, 
                 MultimodalSegmentsJson, RoutePlanDataJson, FreightChargesJson, TermsConditionsJson, CustomTermsJson)
                VALUES 
                (@QuoteId, @DocumentNumber, @Type, @Amount, @CustomerId, @CustomerName, @Recipient, @RecipientEmail, @RecipientAddress, 
                 @PickupLocationId, @DeliveryLocationId, @CreditTermsId, @ClientId, @ClientName, @Days, @FreightMode, @FreightCategory, 
                 @CreatedBy, @CreatedDate, @Status, @IssueDate, @DueDate, @ExpiryDate, @ValidUntil, @Currency, @Notes, @Terms, 
                 @FreightType, @RateDataJson, @Owner, @RouteConfigJson, @DirectRouteJson, @TransitRouteJson, 
                 @MultimodalSegmentsJson, @RoutePlanDataJson, @FreightChargesJson, @TermsConditionsJson, @CustomTermsJson);
                SELECT SCOPE_IDENTITY();";

            long newId;
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@QuoteId", quote.QuoteId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@DocumentNumber", quote.DocumentNumber ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Type", quote.Type ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Amount", quote.Amount);
                    myCom.Parameters.AddWithValue("@CustomerId", quote.CustomerId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@CustomerName", quote.CustomerName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Recipient", quote.Recipient ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RecipientEmail", quote.RecipientEmail ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RecipientAddress", quote.RecipientAddress ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@PickupLocationId", quote.PickupLocationId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@DeliveryLocationId", quote.DeliveryLocationId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@CreditTermsId", quote.CreditTermsId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@ClientId", quote.ClientId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@ClientName", quote.ClientName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@Days", quote.Days ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@FreightMode", quote.FreightMode ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@FreightCategory", quote.FreightCategory ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@CreatedBy", quote.CreatedBy ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@CreatedDate", quote.CreatedDate ?? (object)DBNull.Value);
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
                    myCom.Parameters.AddWithValue("@RouteConfigJson", routeConfigJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@DirectRouteJson", directRouteJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@TransitRouteJson", transitRouteJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@MultimodalSegmentsJson", multimodalSegmentsJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@RoutePlanDataJson", routePlanDataJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@FreightChargesJson", freightChargesJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@TermsConditionsJson", termsConditionsJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@CustomTermsJson", customTermsJson ?? (object)DBNull.Value);

                    newId = Convert.ToInt64(myCom.ExecuteScalar());
                }
                myCon.Close();
            }

            // Insert AdditionalCharges (updated with new fields)
            foreach (var charge in quote.AdditionalCharges)
            {
                string chargeQuery = @"
                    INSERT INTO additional_charges (DocumentId, Type, Description, Amount, Quantity, Rate, Currency)
                    VALUES (@DocumentId, @Type, @Description, @Amount, @Quantity, @Rate, @Currency);";

                using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
                {
                    myCon.Open();
                    using (SqlCommand myCom = new SqlCommand(chargeQuery, myCon))
                    {
                        myCom.Parameters.AddWithValue("@DocumentId", newId);
                        myCom.Parameters.AddWithValue("@Type", charge.Type ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@Description", charge.Description ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@Amount", charge.Amount);
                        myCom.Parameters.AddWithValue("@Quantity", charge.Quantity ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@Rate", charge.Rate ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@Currency", charge.Currency ?? (object)DBNull.Value);

                        myCom.ExecuteNonQuery();
                    }
                    myCon.Close();
                }
            }

            // Insert Remarks (from terms + custom)
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

        // Similar updates for [HttpPost("invoices")] - copy logic from CreateQuote and adjust for Invoice type.

        [HttpPut("{id}")]
        public ActionResult Update(long id, [FromBody] BaseDocument document)
        {
            if (document.Id != id) return BadRequest("ID mismatch");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Serialize JSON fields
            string routeConfigJson = JsonSerializer.Serialize(document.RouteConfigJson);
            string directRouteJson = JsonSerializer.Serialize(document.DirectRouteJson);
            string transitRouteJson = JsonSerializer.Serialize(document.TransitRouteJson);
            string multimodalSegmentsJson = JsonSerializer.Serialize(document.MultimodalSegmentsJson);
            string routePlanDataJson = JsonSerializer.Serialize(document.RoutePlanDataJson);
            string freightChargesJson = JsonSerializer.Serialize(document.FreightChargesJson);
            string termsConditionsJson = JsonSerializer.Serialize(document.TermsConditionsJson);
            string customTermsJson = JsonSerializer.Serialize(document.CustomTermsJson);

            document.Remarks = JsonSerializer.Deserialize<List<string>>(termsConditionsJson) ?? new List<string>();
            document.Remarks.AddRange(JsonSerializer.Deserialize<List<string>>(customTermsJson) ?? new List<string>());

            document.Amount = CalculateTotalAmount(document);

            string rateDataJson = JsonSerializer.Serialize(document.RateData);

            string query = @"
                UPDATE documents SET
                QuoteId = @QuoteId,
                DocumentNumber = @DocumentNumber,
                Type = @Type,
                Amount = @Amount,
                CustomerId = @CustomerId,
                CustomerName = @CustomerName,
                Recipient = @Recipient,
                RecipientEmail = @RecipientEmail,
                RecipientAddress = @RecipientAddress,
                PickupLocationId = @PickupLocationId,
                DeliveryLocationId = @DeliveryLocationId,
                CreditTermsId = @CreditTermsId,
                ClientId = @ClientId,
                ClientName = @ClientName,
                Days = @Days,
                FreightMode = @FreightMode,
                FreightCategory = @FreightCategory,
                CreatedBy = @CreatedBy,
                CreatedDate = @CreatedDate,
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
                Owner = @Owner,
                RouteConfigJson = @RouteConfigJson,
                DirectRouteJson = @DirectRouteJson,
                TransitRouteJson = @TransitRouteJson,
                MultimodalSegmentsJson = @MultimodalSegmentsJson,
                RoutePlanDataJson = @RoutePlanDataJson,
                FreightChargesJson = @FreightChargesJson,
                TermsConditionsJson = @TermsConditionsJson,
                CustomTermsJson = @CustomTermsJson
                WHERE Id = @Id;";

            int rowsAffected;
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@Id", id);
                    // Add all parameters similar to CreateQuote...

                    rowsAffected = myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            if (rowsAffected == 0) return NotFound("Document not found.");

            // Delete and re-insert AdditionalCharges and Remarks (updated)
            // ... (similar to old, but include new charge fields)

            return Ok(document);
        }

        // Delete remains the same.

        // New: Generate QuoteId helper
        private string GenerateQuoteId()
        {
            var now = DateTime.UtcNow;
            return $"{now:yyyyMMddHHmmss}";
        }

        // Updated CreateDocumentFromReader to include new fields
        private BaseDocument CreateDocumentFromReader(SqlDataReader reader)
        {
            string type = reader["Type"].ToString();
            BaseDocument doc = type == "Quote" ? new Quote() : new Invoice();

            doc.Id = Convert.ToInt64(reader["Id"]);
            doc.QuoteId = reader.IsDBNull(reader.GetOrdinal("QuoteId")) ? null : reader["QuoteId"].ToString();
            doc.DocumentNumber = reader["DocumentNumber"].ToString();
            doc.Type = type;
            doc.Amount = Convert.ToDecimal(reader["Amount"]);
            doc.CustomerId = reader.IsDBNull(reader.GetOrdinal("CustomerId")) ? null : (long?)Convert.ToInt64(reader["CustomerId"]);
            doc.CustomerName = reader.IsDBNull(reader.GetOrdinal("CustomerName")) ? null : reader["CustomerName"].ToString();
            doc.Recipient = reader["Recipient"].ToString();
            doc.RecipientEmail = reader["RecipientEmail"].ToString();
            doc.RecipientAddress = reader.IsDBNull(reader.GetOrdinal("RecipientAddress")) ? null : reader["RecipientAddress"].ToString();
            doc.PickupLocationId = reader.IsDBNull(reader.GetOrdinal("PickupLocationId")) ? null : (long?)Convert.ToInt64(reader["PickupLocationId"]);
            doc.DeliveryLocationId = reader.IsDBNull(reader.GetOrdinal("DeliveryLocationId")) ? null : (long?)Convert.ToInt64(reader["DeliveryLocationId"]);
            doc.CreditTermsId = reader.IsDBNull(reader.GetOrdinal("CreditTermsId")) ? null : (long?)Convert.ToInt64(reader["CreditTermsId"]);
            doc.ClientId = reader.IsDBNull(reader.GetOrdinal("ClientId")) ? null : (long?)Convert.ToInt64(reader["ClientId"]);
            doc.ClientName = reader.IsDBNull(reader.GetOrdinal("ClientName")) ? null : reader["ClientName"].ToString();
            doc.Days = reader.IsDBNull(reader.GetOrdinal("Days")) ? null : (int?)Convert.ToInt32(reader["Days"]);
            doc.FreightMode = reader.IsDBNull(reader.GetOrdinal("FreightMode")) ? null : reader["FreightMode"].ToString();
            doc.FreightCategory = reader.IsDBNull(reader.GetOrdinal("FreightCategory")) ? null : reader["FreightCategory"].ToString();
            doc.CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? null : reader["CreatedBy"].ToString();
            doc.CreatedDate = reader.IsDBNull(reader.GetOrdinal("CreatedDate")) ? null : (DateTime?)Convert.ToDateTime(reader["CreatedDate"]);
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

            // New JSON fields (stored as strings)
            doc.RouteConfigJson = reader.IsDBNull(reader.GetOrdinal("RouteConfigJson")) ? null : reader["RouteConfigJson"].ToString();
            doc.DirectRouteJson = reader.IsDBNull(reader.GetOrdinal("DirectRouteJson")) ? null : reader["DirectRouteJson"].ToString();
            doc.TransitRouteJson = reader.IsDBNull(reader.GetOrdinal("TransitRouteJson")) ? null : reader["TransitRouteJson"].ToString();
            doc.MultimodalSegmentsJson = reader.IsDBNull(reader.GetOrdinal("MultimodalSegmentsJson")) ? null : reader["MultimodalSegmentsJson"].ToString();
            doc.RoutePlanDataJson = reader.IsDBNull(reader.GetOrdinal("RoutePlanDataJson")) ? null : reader["RoutePlanDataJson"].ToString();
            doc.FreightChargesJson = reader.IsDBNull(reader.GetOrdinal("FreightChargesJson")) ? null : reader["FreightChargesJson"].ToString();
            doc.TermsConditionsJson = reader.IsDBNull(reader.GetOrdinal("TermsConditionsJson")) ? null : reader["TermsConditionsJson"].ToString();
            doc.CustomTermsJson = reader.IsDBNull(reader.GetOrdinal("CustomTermsJson")) ? null : reader["CustomTermsJson"].ToString();

            return doc;
        }

        // Updated LoadAdditionalCharges with new fields
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
                                Amount = Convert.ToDecimal(myR["Amount"]),
                                Quantity = myR.IsDBNull(myR.GetOrdinal("Quantity")) ? null : (decimal?)Convert.ToDecimal(myR["Quantity"]),
                                Rate = myR.IsDBNull(myR.GetOrdinal("Rate")) ? null : (decimal?)Convert.ToDecimal(myR["Rate"]),
                                Currency = myR.IsDBNull(myR.GetOrdinal("Currency")) ? null : myR["Currency"].ToString()
                            };
                            doc.AdditionalCharges.Add(charge);
                        }
                    }
                }
                myCon.Close();
            }
        }

        // LoadRemarks remains the same, but can populate from JSON if needed.

        // New: Load names for lookup IDs (e.g., CustomerName from customers table)
        private void LoadLookupNames(BaseDocument doc)
        {
            if (doc.CustomerId.HasValue)
            {
                doc.CustomerName = GetLookupName("customers", doc.CustomerId.Value);
            }
            if (doc.ClientId.HasValue)
            {
                doc.ClientName = GetLookupName("customers", doc.ClientId.Value);  // Assuming clients from same table
            }
            // Add for locations, etc., if needed.
        }

        private string GetLookupName(string tableName, long id)
        {
            string query = $"SELECT Name FROM {tableName} WHERE Id = @id";
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    return (string)myCom.ExecuteScalar();
                }
            }
        }

        // Updated CalculateTotalAmount
        // Now sums additionalCharges + parsed freightCharges (assume each has 'amount' field in JSON array)
        private decimal CalculateTotalAmount(BaseDocument document)
        {
            decimal total = document.AdditionalCharges?.Sum(c => c.Amount) ?? 0;

            // Parse and sum freightCharges
            if (!string.IsNullOrEmpty(document.FreightChargesJson))
            {
                var freightCharges = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(document.FreightChargesJson);
                foreach (var charge in freightCharges)
                {
                    if (charge.ContainsKey("amount") && decimal.TryParse(charge["amount"].ToString(), out decimal amt))
                    {
                        total += amt;
                    }
                    // Adjust if dynamic columns; sum all numeric fields except id/uom etc.
                }
            }

            // Old rateData sum if needed
            if (document.RateData != null)
            {
                // ... old logic
            }

            return total;
        }

        // New endpoints for dropdown options
        [HttpGet("options/customers")]
        public ActionResult GetCustomers()
        {
            return Ok(GetOptions("customers"));
        }

        [HttpGet("options/locations")]
        public ActionResult GetLocations()
        {
            return Ok(GetOptions("locations"));
        }

        [HttpGet("options/creditTerms")]
        public ActionResult GetCreditTerms()
        {
            return Ok(GetOptions("credit_terms"));
        }

        [HttpGet("options/carriers")]
        public ActionResult GetCarriers()
        {
            return Ok(GetOptions("carriers"));
        }

        // Add more for incoterms, currencies, etc.

        private List<Dictionary<string, object>> GetOptions(string tableName)
        {
            var options = new List<Dictionary<string, object>>();
            string query = $"SELECT Id, Name FROM {tableName}";  // Assume common structure

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        while (myR.Read())
                        {
                            options.Add(new Dictionary<string, object>
                            {
                                { "value", myR["Id"] },
                                { "label", myR["Name"].ToString() }
                            });
                        }
                    }
                }
                myCon.Close();
            }

            return options;
        }

        // Placeholder for DownloadPdf and Send remain the same.
    }
}