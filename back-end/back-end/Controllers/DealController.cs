using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DealController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        string dbcon;
        DataTable tb;
        SqlConnection myCon;
        SqlCommand myCom;
        SqlDataReader myR;

        public DealController(IConfiguration configuration)
        {
            _configuration = configuration;
            dbcon = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(dbcon);
        }

        [HttpGet, Route("deal")]
        public ActionResult getDeals()
        {
            string query = @"select * from [dbo].[deal_reg] order by SysID desc;";
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

        [HttpGet, Route("deal/{id}")]
        public ActionResult getDealById(string id)
        {
            string query = @"select * from [dbo].[deal_reg] where SysID = @id;";
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
                return NotFound("Deal not found.");
            }
            return new OkObjectResult(tb);
        }

        [HttpPost, Route("deal")]
        public IActionResult CreateDeal([FromBody] Deal deal)
        {
            // Auto-calculate forecast value if not provided or to ensure accuracy
            if (decimal.TryParse(deal.dealsValue?.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out decimal dealValue) &&
                int.TryParse(deal.closeProbability, out int probability))
            {
                deal.forecastValue = (dealValue * probability / 100).ToString("F2", CultureInfo.InvariantCulture);
            }

            string query = @"
            INSERT INTO [dbo].[deal_reg] 
            (dealName, stage, owner, dealsValue, contacts, accounts, expectedCloseDate, closeProbability, forecastValue, lastInteraction, quotesInvoicesNumber, notes)
            VALUES 
            (@dealName, @stage, @owner, @dealsValue, @contacts, @accounts, @expectedCloseDate, @closeProbability, @forecastValue, @lastInteraction, @quotesInvoicesNumber, @notes)";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@dealName", deal.dealName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@stage", deal.stage ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@owner", deal.owner ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@dealsValue", deal.dealsValue ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@contacts", deal.contacts ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@accounts", deal.accounts ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@expectedCloseDate", string.IsNullOrEmpty(deal.expectedCloseDate) ? (object)DBNull.Value : DateTime.Parse(deal.expectedCloseDate));
                    myCom.Parameters.AddWithValue("@closeProbability", deal.closeProbability ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@forecastValue", deal.forecastValue ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@lastInteraction", string.IsNullOrEmpty(deal.lastInteraction) ? (object)DBNull.Value : DateTime.Parse(deal.lastInteraction));
                    myCom.Parameters.AddWithValue("@quotesInvoicesNumber", deal.quotesInvoicesNumber ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@notes", deal.notes ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Deal added successfully.");
        }

        [HttpPut, Route("deal")]
        public IActionResult UpdateDeal([FromBody] Deal deal)
        {
            if (string.IsNullOrEmpty(deal.sysID))
                return BadRequest("Deal ID is required for update.");

            // Auto-calculate forecast value if not provided or to ensure accuracy
            if (decimal.TryParse(deal.dealsValue?.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out decimal dealValue) &&
                int.TryParse(deal.closeProbability, out int probability))
            {
                deal.forecastValue = (dealValue * probability / 100).ToString("F2", CultureInfo.InvariantCulture);
            }

            string query = @"
            UPDATE [dbo].[deal_reg] SET
                dealName = @dealName,
                stage = @stage,
                owner = @owner,
                dealsValue = @dealsValue,
                contacts = @contacts,
                accounts = @accounts,
                expectedCloseDate = @expectedCloseDate,
                closeProbability = @closeProbability,
                forecastValue = @forecastValue,
                lastInteraction = @lastInteraction,
                quotesInvoicesNumber = @quotesInvoicesNumber,
                notes = @notes
            WHERE SysID = @id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", deal.sysID);
                    myCom.Parameters.AddWithValue("@dealName", deal.dealName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@stage", deal.stage ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@owner", deal.owner ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@dealsValue", deal.dealsValue ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@contacts", deal.contacts ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@accounts", deal.accounts ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@expectedCloseDate", string.IsNullOrEmpty(deal.expectedCloseDate) ? (object)DBNull.Value : DateTime.Parse(deal.expectedCloseDate));
                    myCom.Parameters.AddWithValue("@closeProbability", deal.closeProbability ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@forecastValue", deal.forecastValue ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@lastInteraction", string.IsNullOrEmpty(deal.lastInteraction) ? (object)DBNull.Value : DateTime.Parse(deal.lastInteraction));
                    myCom.Parameters.AddWithValue("@quotesInvoicesNumber", deal.quotesInvoicesNumber ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@notes", deal.notes ?? (object)DBNull.Value);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Deal not found.");
                }
                myCon.Close();
            }

            return Ok("Deal updated successfully.");
        }

        [HttpDelete, Route("deal/{id}")]
        public IActionResult DeleteDeal(string id)
        {
            string query = @"DELETE FROM [dbo].[deal_reg] WHERE SysID = @id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Deal not found.");
                }
                myCon.Close();
            }

            return Ok("Deal deleted successfully.");
        }
    }
}