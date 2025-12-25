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
    public class QuoteOutcomeController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        string dbcon;
        DataTable tb;
        SqlConnection myCon;
        SqlCommand myCom;
        SqlDataReader myR;

        public QuoteOutcomeController(IConfiguration configuration)
        {
            _configuration = configuration;
            dbcon = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(dbcon);
        }

        [HttpPost]
        public IActionResult SaveQuoteOutcome([FromBody] QuoteOutcome model)
        {
            try
            {
                // Validate input
                if (model.QuoteId <= 0)
                {
                    return BadRequest(new { message = "Invalid quote ID" });
                }

                if (string.IsNullOrEmpty(model.OutcomeStatus) || 
                    (model.OutcomeStatus != "won" && model.OutcomeStatus != "lost"))
                {
                    return BadRequest(new { message = "Invalid outcome status. Must be 'won' or 'lost'" });
                }

                if (model.OutcomeStatus == "won" && (model.WonAmount == null || model.WonAmount <= 0))
                {
                    return BadRequest(new { message = "Won amount is required and must be greater than 0" });
                }

                if (model.OutcomeStatus == "lost" && string.IsNullOrEmpty(model.LostReason))
                {
                    return BadRequest(new { message = "Lost reason is required" });
                }

                using (myCon)
                {
                    myCon.Open();

                    // Check if quote exists and doesn't already have an outcome
                    // FIXED: Changed quote_id to QuoteId to match your table schema
                    string checkQuery = @"
                        SELECT outcome_status 
                        FROM quotes 
                        WHERE QuoteId = @QuoteId";

                    using (SqlCommand checkCmd = new SqlCommand(checkQuery, myCon))
                    {
                        checkCmd.Parameters.AddWithValue("@QuoteId", model.QuoteId);
                        
                        var existingStatus = checkCmd.ExecuteScalar();
                        
                        if (existingStatus == DBNull.Value || existingStatus == null)
                        {
                            // No existing outcome, proceed
                        }
                        else
                        {
                            return BadRequest(new { message = "Quote already has an outcome status set and cannot be changed" });
                        }
                    }

                    // Begin transaction
                    using (SqlTransaction transaction = myCon.BeginTransaction())
                    {
                        try
                        {
                            // Insert into quote_outcomes table
                            string insertOutcomeQuery = @"
                                INSERT INTO quote_outcomes 
                                (quote_id, outcome_status, won_amount, lost_reason, lost_note, created_date)
                                VALUES 
                                (@QuoteId, @OutcomeStatus, @WonAmount, @LostReason, @LostNote, GETDATE())";

                            using (SqlCommand insertCmd = new SqlCommand(insertOutcomeQuery, myCon, transaction))
                            {
                                insertCmd.Parameters.AddWithValue("@QuoteId", model.QuoteId);
                                insertCmd.Parameters.AddWithValue("@OutcomeStatus", model.OutcomeStatus);
                                insertCmd.Parameters.AddWithValue("@WonAmount", 
                                    model.WonAmount.HasValue ? (object)model.WonAmount.Value : DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@LostReason", 
                                    !string.IsNullOrEmpty(model.LostReason) ? (object)model.LostReason : DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@LostNote", 
                                    !string.IsNullOrEmpty(model.LostNote) ? (object)model.LostNote : DBNull.Value);

                                insertCmd.ExecuteNonQuery();
                            }

                            // Update quotes table
                            // FIXED: Changed quote_id to QuoteId to match your table schema
                            string updateQuoteQuery = @"
                                UPDATE quotes 
                                SET 
                                    outcome_status = @OutcomeStatus,
                                    won_amount = @WonAmount,
                                    lost_reason = @LostReason,
                                    lost_note = @LostNote
                                WHERE QuoteId = @QuoteId";

                            using (SqlCommand updateCmd = new SqlCommand(updateQuoteQuery, myCon, transaction))
                            {
                                updateCmd.Parameters.AddWithValue("@QuoteId", model.QuoteId);
                                updateCmd.Parameters.AddWithValue("@OutcomeStatus", model.OutcomeStatus);
                                updateCmd.Parameters.AddWithValue("@WonAmount", 
                                    model.WonAmount.HasValue ? (object)model.WonAmount.Value : DBNull.Value);
                                updateCmd.Parameters.AddWithValue("@LostReason", 
                                    !string.IsNullOrEmpty(model.LostReason) ? (object)model.LostReason : DBNull.Value);
                                updateCmd.Parameters.AddWithValue("@LostNote", 
                                    !string.IsNullOrEmpty(model.LostNote) ? (object)model.LostNote : DBNull.Value);

                                updateCmd.ExecuteNonQuery();
                            }

                            // Commit transaction
                            transaction.Commit();

                            return Ok(new { 
                                message = $"Quote outcome saved successfully as {model.OutcomeStatus}",
                                quoteId = model.QuoteId,
                                outcomeStatus = model.OutcomeStatus
                            });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            return StatusCode(500, new { message = "Error saving outcome: " + ex.Message });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }

        // GET: api/QuoteOutcome/{quoteId}
        // Get outcome for a specific quote
        [HttpGet("{quoteId}")]
        public IActionResult GetQuoteOutcome(int quoteId)
        {
            try
            {
                using (myCon)
                {
                    myCon.Open();

                    string query = @"
                        SELECT 
                            outcome_id,
                            quote_id,
                            outcome_status,
                            won_amount,
                            lost_reason,
                            lost_note,
                            created_date
                        FROM quote_outcomes
                        WHERE quote_id = @QuoteId";

                    using (SqlCommand myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@QuoteId", quoteId);

                        using (SqlDataReader myR = myCom.ExecuteReader())
                        {
                            if (myR.Read())
                            {
                                return Ok(new
                                {
                                    outcomeId = myR["outcome_id"],
                                    quoteId = myR["quote_id"],
                                    outcomeStatus = myR["outcome_status"],
                                    wonAmount = myR["won_amount"] != DBNull.Value ? myR["won_amount"] : null,
                                    lostReason = myR["lost_reason"] != DBNull.Value ? myR["lost_reason"] : null,
                                    lostNote = myR["lost_note"] != DBNull.Value ? myR["lost_note"] : null,
                                    createdDate = myR["created_date"]
                                });
                            }
                            else
                            {
                                return NotFound(new { message = "No outcome found for this quote" });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }

        // GET: api/QuoteOutcome/stats
        // Get statistics about won/lost quotes
        [HttpGet("stats")]
        public IActionResult GetOutcomeStats()
        {
            try
            {
                using (myCon)
                {
                    myCon.Open();

                    string query = @"
                        SELECT 
                            COUNT(CASE WHEN outcome_status = 'won' THEN 1 END) as total_won,
                            COUNT(CASE WHEN outcome_status = 'lost' THEN 1 END) as total_lost,
                            SUM(CASE WHEN outcome_status = 'won' THEN won_amount ELSE 0 END) as total_won_amount,
                            AVG(CASE WHEN outcome_status = 'won' THEN won_amount END) as avg_won_amount
                        FROM quote_outcomes";

                    using (SqlCommand myCom = new SqlCommand(query, myCon))
                    {
                        using (SqlDataReader myR = myCom.ExecuteReader())
                        {
                            if (myR.Read())
                            {
                                return Ok(new
                                {
                                    totalWon = myR["total_won"],
                                    totalLost = myR["total_lost"],
                                    totalWonAmount = myR["total_won_amount"] != DBNull.Value ? myR["total_won_amount"] : 0,
                                    avgWonAmount = myR["avg_won_amount"] != DBNull.Value ? myR["avg_won_amount"] : 0
                                });
                            }
                            else
                            {
                                return Ok(new
                                {
                                    totalWon = 0,
                                    totalLost = 0,
                                    totalWonAmount = 0,
                                    avgWonAmount = 0
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }

        // GET: api/QuoteOutcome/lost-reasons
        // Get count of each lost reason
        [HttpGet("lost-reasons")]
        public IActionResult GetLostReasons()
        {
            try
            {
                using (myCon)
                {
                    myCon.Open();

                    string query = @"
                        SELECT 
                            lost_reason,
                            COUNT(*) as count
                        FROM quote_outcomes
                        WHERE outcome_status = 'lost'
                        GROUP BY lost_reason
                        ORDER BY count DESC";

                    using (SqlCommand myCom = new SqlCommand(query, myCon))
                    {
                        var reasons = new System.Collections.Generic.List<object>();

                        using (SqlDataReader myR = myCom.ExecuteReader())
                        {
                            while (myR.Read())
                            {
                                reasons.Add(new
                                {
                                    reason = myR["lost_reason"],
                                    count = myR["count"]
                                });
                            }
                        }

                        return Ok(reasons);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }
    }
}