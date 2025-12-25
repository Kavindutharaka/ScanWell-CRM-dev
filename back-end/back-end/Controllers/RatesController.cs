using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using back_end.Models;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RatesController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;
        private SqlConnection myCon;
        private SqlCommand myCom;
        private SqlDataReader myR;
        private DataTable tb;

        public RatesController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(_dbConnectionString);
        }

        // ============================================================================
        // REGULAR RATES ENDPOINTS
        // ============================================================================

        // GET: api/rates/rates
        [HttpGet, Route("rates")]
        public ActionResult getRates()
        {
            string query = @"SELECT * FROM [dbo].[rates] ORDER BY sysID DESC;";
            tb = new DataTable();

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myR = myCom.ExecuteReader();
                    tb.Load(myR);
                    myR.Close();
                }
                myCon.Close();
            }

            return new OkObjectResult(tb);
        }

        // GET: api/rates/rates/{id}
        [HttpGet, Route("rates/{id}")]
        public ActionResult getRateById(string id)
        {
            string query = @"SELECT * FROM [dbo].[rates] WHERE sysID = @id;";
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
                }
                myCon.Close();
            }

            if (tb.Rows.Count == 0)
                return NotFound("Rate not found.");

            return new OkObjectResult(tb);
        }

        // POST: api/rates/rates
        [HttpPost, Route("rates")]
        public IActionResult CreateRate([FromBody] Rate rate)
        {
            string query = @"
                INSERT INTO [dbo].[rates] 
                (freightType, origin, destination, airline, liner, route, surcharges, transitTime, transshipmentTime, frequency, routingType, rateDataJson, validateDate, note, remark, owner, currency)
                VALUES 
                (@freightType, @origin, @destination, @airline, @liner, @route, @surcharges, @transitTime, @transshipmentTime, @frequency, @routingType, @rateDataJson, @validateDate, @note, @remark, @owner, @currency);
                SELECT SCOPE_IDENTITY();";

            string newId;
            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@freightType", rate.freightType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@origin", rate.origin ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@destination", rate.destination ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@airline", rate.airline ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@liner", rate.liner ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@route", rate.route ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@surcharges", rate.surcharges ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@transitTime", rate.transitTime ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@transshipmentTime", rate.transshipmentTime ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@frequency", rate.frequency ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@routingType", rate.routingType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@rateDataJson", rate.rateDataJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@validateDate", rate.validateDate ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@note", rate.note ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@remark", rate.remark ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@owner", rate.owner ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@currency", rate.currency ?? (object)DBNull.Value);

                    newId = myCom.ExecuteScalar().ToString();
                }
                myCon.Close();
            }

            return Ok($"Rate added successfully. ID: {newId}");
        }

        // PUT: api/rates/rates/{id}
        [HttpPut, Route("rates/{id}")]
        public IActionResult UpdateRate(string id, [FromBody] Rate rate)
        {
            string query = @"
                UPDATE [dbo].[rates] SET
                    freightType = @freightType,
                    origin = @origin,
                    destination = @destination,
                    airline = @airline,
                    liner = @liner,
                    route = @route,
                    surcharges = @surcharges,
                    transitTime = @transitTime,
                    transshipmentTime = @transshipmentTime,
                    frequency = @frequency,
                    routingType = @routingType,
                    rateDataJson = @rateDataJson,
                    validateDate = @validateDate,
                    note = @note,
                    remark = @remark,
                    owner = @owner,
                    currency = @currency
                WHERE sysID = @id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    myCom.Parameters.AddWithValue("@freightType", rate.freightType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@origin", rate.origin ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@destination", rate.destination ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@airline", rate.airline ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@liner", rate.liner ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@route", rate.route ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@surcharges", rate.surcharges ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@transitTime", rate.transitTime ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@transshipmentTime", rate.transshipmentTime ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@frequency", rate.frequency ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@routingType", rate.routingType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@rateDataJson", rate.rateDataJson ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@validateDate", rate.validateDate ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@note", rate.note ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@remark", rate.remark ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@owner", rate.owner ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@currency", rate.currency ?? (object)DBNull.Value);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Rate not found.");
                }
                myCon.Close();
            }

            return Ok("Rate updated successfully.");
        }

        // DELETE: api/rates/rates/{id}
        [HttpDelete, Route("rates/{id}")]
        public IActionResult DeleteRate(string id)
        {
            string query = @"DELETE FROM [dbo].[rates] WHERE sysID = @id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Rate not found.");
                }
                myCon.Close();
            }

            return Ok("Rate deleted successfully.");
        }

        // ============================================================================
        // LINEAR RATES ENDPOINTS
        // ============================================================================

        // GET: api/rates/linear?category=MSC
        [HttpGet, Route("linear")]
        public ActionResult getLinearRates([FromQuery] string category)
        {
            if (string.IsNullOrEmpty(category))
            {
                return BadRequest(new { message = "Category parameter is required." });
            }

            string query = @"SELECT * FROM [dbo].[linear_rates] WHERE category = @category ORDER BY id DESC;";
            tb = new DataTable();

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@category", category);
                    myR = myCom.ExecuteReader();
                    tb.Load(myR);
                    myR.Close();
                }
                myCon.Close();
            }

            return new OkObjectResult(tb);
        }

        // GET: api/rates/linear/{id}
        [HttpGet, Route("linear/{id}")]
        public ActionResult getLinearRateById(int id)
        {
            string query = @"SELECT * FROM [dbo].[linear_rates] WHERE id = @id;";
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
                }
                myCon.Close();
            }

            if (tb.Rows.Count == 0)
                return NotFound(new { message = $"Linear rate with id {id} not found." });

            return new OkObjectResult(tb);
        }

        // POST: api/rates/linear/bulk
        [HttpPost, Route("linear/bulk")]
        public IActionResult CreateLinearRatesBulk([FromBody] LinearRateBulkRequest request)
        {
            if (request == null || request.Rates == null || request.Rates.Count == 0)
            {
                return BadRequest(new { message = "No rates provided." });
            }

            var results = new List<object>();
            int successCount = 0;
            int failCount = 0;

            string query = @"
                INSERT INTO [dbo].[linear_rates]
                (pol, pod, gp20_usd, hq40_usd, tt_routing, valid, category)
                VALUES 
                (@pol, @pod, @gp20_usd, @hq40_usd, @tt_routing, @valid, @category);
                SELECT SCOPE_IDENTITY();";

            using (myCon)
            {
                myCon.Open();

                foreach (var rate in request.Rates)
                {
                    try
                    {
                        using (myCom = new SqlCommand(query, myCon))
                        {
                            myCom.Parameters.AddWithValue("@pol", rate.Pol ?? (object)DBNull.Value);
                            myCom.Parameters.AddWithValue("@pod", rate.Pod ?? (object)DBNull.Value);
                            myCom.Parameters.AddWithValue("@gp20_usd", rate.Gp20Usd ?? (object)DBNull.Value);
                            myCom.Parameters.AddWithValue("@hq40_usd", rate.Hq40Usd ?? (object)DBNull.Value);
                            myCom.Parameters.AddWithValue("@tt_routing", rate.TtRouting ?? (object)DBNull.Value);
                            myCom.Parameters.AddWithValue("@valid", rate.Valid ?? (object)DBNull.Value);
                            myCom.Parameters.AddWithValue("@category", rate.Category ?? (object)DBNull.Value);

                            var newId = myCom.ExecuteScalar();
                            results.Add(new { success = true, id = newId });
                            successCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        results.Add(new { success = false, error = ex.Message, rate = new { rate.Pol, rate.Pod } });
                        failCount++;
                    }
                }

                myCon.Close();
            }

            return Ok(new 
            { 
                message = $"Processed {request.Rates.Count} rates. Success: {successCount}, Failed: {failCount}", 
                successCount,
                failCount,
                results 
            });
        }

        // PUT: api/rates/linear/{id}
        [HttpPut, Route("linear/{id}")]
        public IActionResult UpdateLinearRate(int id, [FromBody] LinearRate rate)
        {
            if (rate == null)
            {
                return BadRequest(new { message = "Invalid rate data." });
            }

            string query = @"
                UPDATE [dbo].[linear_rates]
                SET pol = @pol,
                    pod = @pod,
                    gp20_usd = @gp20_usd,
                    hq40_usd = @hq40_usd,
                    tt_routing = @tt_routing,
                    valid = @valid,
                    category = @category
                WHERE id = @id;";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    myCom.Parameters.AddWithValue("@pol", rate.Pol ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@pod", rate.Pod ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@gp20_usd", rate.Gp20Usd ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@hq40_usd", rate.Hq40Usd ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@tt_routing", rate.TtRouting ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@valid", rate.Valid ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@category", rate.Category ?? (object)DBNull.Value);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                    {
                        myCon.Close();
                        return NotFound(new { message = $"Linear rate with id {id} not found." });
                    }
                }
                myCon.Close();
            }

            return Ok(new { message = "Linear rate updated successfully", id });
        }

        // DELETE: api/rates/linear/{id}
        [HttpDelete, Route("linear/{id}")]
        public IActionResult DeleteLinearRate(int id)
        {
            string query = @"DELETE FROM [dbo].[linear_rates] WHERE id = @id;";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                    {
                        myCon.Close();
                        return NotFound(new { message = $"Linear rate with id {id} not found." });
                    }
                }
                myCon.Close();
            }

            return Ok(new { message = "Linear rate deleted successfully", id });
        }

        // DELETE: api/rates/linear/category/{category}
        [HttpDelete, Route("linear/category/{category}")]
        public IActionResult DeleteLinearRatesByCategory(string category)
        {
            string query = @"DELETE FROM [dbo].[linear_rates] WHERE category = @category;";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@category", category);

                    int rowsAffected = myCom.ExecuteNonQuery();
                    myCon.Close();
                    
                    return Ok(new { message = $"Deleted {rowsAffected} rates for category {category}", count = rowsAffected });
                }
            }
        }
    }
}