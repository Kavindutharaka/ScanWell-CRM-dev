using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuoteController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        string dbcon;
        DataTable tb;
        SqlConnection myCon;
        SqlCommand myCom;
        SqlDataReader myR;

        public QuoteController(IConfiguration configuration)
        {
            _configuration = configuration;
            dbcon = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(dbcon);
        }

        [HttpGet, Route("quote")]
        public ActionResult getQuotes()
        {
            string query = @"select * from [dbo].[quotes_save] order by SysID desc;";
            tb = new DataTable();
            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myR = myCom.ExecuteReader();
                    tb.Load(myR);
                    myR.Close();
                    myCon.Close();
                }
                return new OkObjectResult(tb);
            }
        }

        [HttpGet, Route("quote/{id}")]
        public ActionResult getQuoteById(string id)
        {
            string query = @"select * from [dbo].[quotes_save] where SysID = @id;";
            tb = new DataTable();
            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    myR = myCom.ExecuteReader();
                    tb.Load(myR);
                    myR.Close();
                    myCon.Close();
                }
            }
            if (tb.Rows.Count == 0)
            {
                return NotFound("Quote not found.");
            }
            return new OkObjectResult(tb);
        }

        [HttpPost, Route("quote")]
        public IActionResult CreateQuote([FromBody] Quote quote)
        {
            string query = @"
            INSERT INTO [dbo].[quotes_save] 
            (quoteId, customerId, customerName, pickupLocationId, deliveryLocationId, creditTermsId, createdDate, clientId, clientName, days, freightMode, freightCategory, createdBy, directRoute, transitRoute, multimodalSegments, routePlanData, freightCharges, handlingCharges, termsConditions, customTerms)
            VALUES 
            (@quoteId, @customerId, @customerName, @pickupLocationId, @deliveryLocationId, @creditTermsId, @createdDate, @clientId, @clientName, @days, @freightMode, @freightCategory, @createdBy, @directRoute, @transitRoute, @multimodalSegments, @routePlanData, @freightCharges, @handlingCharges, @termsConditions, @customTerms)";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@quoteId", quote.quoteId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@customerId", quote.customerId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@customerName", quote.customerName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@pickupLocationId", quote.pickupLocationId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@deliveryLocationId", quote.deliveryLocationId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@creditTermsId", quote.creditTermsId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@createdDate", quote.createdDate ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@clientId", quote.clientId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@clientName", quote.clientName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@days", quote.days ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@freightMode", quote.freightMode ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@freightCategory", quote.freightCategory ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@createdBy", quote.createdBy ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@directRoute", quote.directRoute ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@transitRoute", quote.transitRoute ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@multimodalSegments", quote.multimodalSegments ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@routePlanData", quote.routePlanData ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@freightCharges", quote.freightCharges ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@handlingCharges", quote.handlingCharges ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@termsConditions", quote.termsConditions ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@customTerms", quote.customTerms ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Quote added successfully.");
        }

        [HttpPut, Route("quote")]
        public IActionResult UpdateQuote([FromBody] Quote quote)
        {
            if (string.IsNullOrEmpty(quote.sysID))
                return BadRequest("Quote ID is required for update.");

            string query = @"
            UPDATE [dbo].[quotes_save] SET
                quoteId = @quoteId,
                customerId = @customerId,
                customerName = @customerName,
                pickupLocationId = @pickupLocationId,
                deliveryLocationId = @deliveryLocationId,
                creditTermsId = @creditTermsId,
                createdDate = @createdDate,
                clientId = @clientId,
                clientName = @clientName,
                days = @days,
                freightMode = @freightMode,
                freightCategory = @freightCategory,
                createdBy = @createdBy,
                directRoute = @directRoute,
                transitRoute = @transitRoute,
                multimodalSegments = @multimodalSegments,
                routePlanData = @routePlanData,
                freightCharges = @freightCharges,
                handlingCharges = @handlingCharges,
                termsConditions = @termsConditions,
                customTerms = @customTerms
            WHERE SysID = @id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", quote.sysID);
                    myCom.Parameters.AddWithValue("@quoteId", quote.quoteId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@customerId", quote.customerId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@customerName", quote.customerName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@pickupLocationId", quote.pickupLocationId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@deliveryLocationId", quote.deliveryLocationId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@creditTermsId", quote.creditTermsId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@createdDate", quote.createdDate ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@clientId", quote.clientId ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@clientName", quote.clientName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@days", quote.days ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@freightMode", quote.freightMode ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@freightCategory", quote.freightCategory ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@createdBy", quote.createdBy ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@directRoute", quote.directRoute ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@transitRoute", quote.transitRoute ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@multimodalSegments", quote.multimodalSegments ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@routePlanData", quote.routePlanData ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@freightCharges", quote.freightCharges ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@handlingCharges", quote.handlingCharges ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@termsConditions", quote.termsConditions ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@customTerms", quote.customTerms ?? (object)DBNull.Value);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Quote not found.");
                }
                myCon.Close();
            }

            return Ok("Quote updated successfully.");
        }

        [HttpDelete, Route("quote/{id}")]
        public IActionResult DeleteQuote(string id)
        {
            string query = @"DELETE FROM [dbo].[quotes_save] WHERE SysID = @id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Quote not found.");
                }
                myCon.Close();
            }

            return Ok("Quote deleted successfully.");
        }
    }
}