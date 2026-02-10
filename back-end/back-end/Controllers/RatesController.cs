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
        (pol, pod, gp20_usd, hq40_usd, tt_routing, valid, category, liner_type, destination_header, remark)
        VALUES 
        (@pol, @pod, @gp20_usd, @hq40_usd, @tt_routing, @valid, @category, @liner_type, @destination_header, @remark);
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
                            myCom.Parameters.AddWithValue("@liner_type", rate.LinerType ?? (object)DBNull.Value);
                            myCom.Parameters.AddWithValue("@destination_header", rate.DestinationHeader ?? (object)DBNull.Value);
                            myCom.Parameters.AddWithValue("@remark", rate.Remark ?? (object)DBNull.Value);

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

        // PUT: api/rates/linear/{id} - UPDATE
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
            category = @category,
            liner_type = @liner_type,
            destination_header = @destination_header,
            remark = @remark
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
                    myCom.Parameters.AddWithValue("@liner_type", rate.LinerType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@destination_header", rate.DestinationHeader ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@remark", rate.Remark ?? (object)DBNull.Value);

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

        // GET: api/rates/linear/all-spot - Get all sea spot liner rates (no category filter)
        [HttpGet, Route("linear/all-spot")]
        public ActionResult getAllSpotRates()
        {
            string query = @"SELECT * FROM [dbo].[linear_rates] WHERE liner_type = 'LINER' ORDER BY id DESC;";
            DataTable spotTb = new DataTable();

            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        spotTb.Load(reader);
                    }
                }
                con.Close();
            }

            return new OkObjectResult(spotTb);
        }

        // DELETE: api/rates/linear/all-spot - Delete all sea spot liner rates
        [HttpDelete, Route("linear/all-spot")]
        public IActionResult DeleteAllSpotRates()
        {
            string query = @"DELETE FROM [dbo].[linear_rates] WHERE liner_type = 'LINER';";

            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    int rowsAffected = cmd.ExecuteNonQuery();
                    con.Close();
                    return Ok(new { message = $"Deleted {rowsAffected} sea spot rates", count = rowsAffected });
                }
            }
        }

        // POST: api/rates/linear/fix-liner-type - Fix existing records with NULL liner_type that have a category
        [HttpPost, Route("linear/fix-liner-type")]
        public IActionResult FixLinerType()
        {
            string query = @"UPDATE [dbo].[linear_rates] SET liner_type = 'LINEAR_HEADER' WHERE liner_type IS NULL AND category IS NOT NULL;";

            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    int rowsAffected = cmd.ExecuteNonQuery();
                    con.Close();
                    return Ok(new { message = $"Updated {rowsAffected} records with liner_type = 'LINEAR_HEADER'", count = rowsAffected });
                }
            }
        }

        // ============================================================================
        // DESTINATION RATES ENDPOINTS (Different format: DESTINATION, LINER, 20GP, 40HQ, TT/ROUTING, VALID)
        // ============================================================================

        // GET: api/rates/destination?category=USEC/USWC
        [HttpGet, Route("destination")]
        public ActionResult getDestinationRates([FromQuery] string category)
        {
            if (string.IsNullOrEmpty(category))
            {
                return BadRequest(new { message = "Category parameter is required." });
            }

            string query = @"SELECT * FROM [dbo].[destination_rates] WHERE category = @category ORDER BY id DESC;";
            tb = new DataTable();

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@category", category);
                    using (var reader = cmd.ExecuteReader())
                    {
                        tb.Load(reader);
                    }
                }
                con.Close();
            }

            return new OkObjectResult(tb);
        }

        // GET: api/rates/destination/{id}
        [HttpGet, Route("destination/{id:int}")]
        public ActionResult getDestinationRateById(int id)
        {
            string query = @"SELECT * FROM [dbo].[destination_rates] WHERE id = @id;";
            tb = new DataTable();

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    using (var reader = cmd.ExecuteReader())
                    {
                        tb.Load(reader);
                    }
                }
                con.Close();
            }

            if (tb.Rows.Count == 0)
                return NotFound(new { message = $"Destination rate with id {id} not found." });

            return new OkObjectResult(tb);
        }

        // POST: api/rates/destination/bulk
        [HttpPost, Route("destination/bulk")]
        public IActionResult CreateDestinationRatesBulk([FromBody] DestinationRateBulkRequest request)
        {
            if (request == null || request.Rates == null || request.Rates.Count == 0)
            {
                return BadRequest(new { message = "No rates provided." });
            }

            var results = new List<object>();
            int successCount = 0;
            int failCount = 0;

            string query = @"
                INSERT INTO [dbo].[destination_rates]
                (destination, liner, gp20, hq40, tt_routing, valid, category, remark)
                VALUES
                (@destination, @liner, @gp20, @hq40, @tt_routing, @valid, @category, @remark);
                SELECT SCOPE_IDENTITY();";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();

                foreach (var rate in request.Rates)
                {
                    try
                    {
                        using (var cmd = new SqlCommand(query, con))
                        {
                            cmd.Parameters.AddWithValue("@destination", rate.Destination ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@liner", rate.Liner ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@gp20", rate.Gp20 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@hq40", rate.Hq40 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@tt_routing", rate.TtRouting ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@valid", rate.Valid ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@category", rate.Category ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@remark", rate.Remark ?? (object)DBNull.Value);

                            var newId = cmd.ExecuteScalar();
                            results.Add(new { success = true, id = newId });
                            successCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        results.Add(new { success = false, error = ex.Message, rate = new { rate.Destination, rate.Liner } });
                        failCount++;
                    }
                }

                con.Close();
            }

            return Ok(new
            {
                message = $"Processed {request.Rates.Count} rates. Success: {successCount}, Failed: {failCount}",
                successCount,
                failCount,
                results
            });
        }

        // PUT: api/rates/destination/{id}
        [HttpPut, Route("destination/{id:int}")]
        public IActionResult UpdateDestinationRate(int id, [FromBody] DestinationRate rate)
        {
            if (rate == null)
            {
                return BadRequest(new { message = "Invalid rate data." });
            }

            string query = @"
                UPDATE [dbo].[destination_rates]
                SET destination = @destination,
                    liner = @liner,
                    gp20 = @gp20,
                    hq40 = @hq40,
                    tt_routing = @tt_routing,
                    valid = @valid,
                    category = @category,
                    remark = @remark
                WHERE id = @id;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.Parameters.AddWithValue("@destination", rate.Destination ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@liner", rate.Liner ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@gp20", rate.Gp20 ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@hq40", rate.Hq40 ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@tt_routing", rate.TtRouting ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@valid", rate.Valid ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@category", rate.Category ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@remark", rate.Remark ?? (object)DBNull.Value);

                    int rowsAffected = cmd.ExecuteNonQuery();

                    if (rowsAffected == 0)
                    {
                        con.Close();
                        return NotFound(new { message = $"Destination rate with id {id} not found." });
                    }
                }
                con.Close();
            }

            return Ok(new { message = "Destination rate updated successfully", id });
        }

        // DELETE: api/rates/destination/{id}
        [HttpDelete, Route("destination/{id:int}")]
        public IActionResult DeleteDestinationRate(int id)
        {
            string query = @"DELETE FROM [dbo].[destination_rates] WHERE id = @id;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@id", id);

                    int rowsAffected = cmd.ExecuteNonQuery();

                    if (rowsAffected == 0)
                    {
                        con.Close();
                        return NotFound(new { message = $"Destination rate with id {id} not found." });
                    }
                }
                con.Close();
            }

            return Ok(new { message = "Destination rate deleted successfully", id });
        }

        // DELETE: api/rates/destination/category/{category}
        [HttpDelete, Route("destination/category/{category}")]
        public IActionResult DeleteDestinationRatesByCategory(string category)
        {
            string query = @"DELETE FROM [dbo].[destination_rates] WHERE category = @category;";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@category", category);

                    int rowsAffected = cmd.ExecuteNonQuery();
                    con.Close();

                    return Ok(new { message = $"Deleted {rowsAffected} rates for category {category}", count = rowsAffected });
                }
            }
        }

        // ============================================================================
        // AIR EXPORT RATES ENDPOINTS
        // ============================================================================

        // GET: api/rates/air-export - Get all air export rates
        [HttpGet, Route("air-export")]
        public ActionResult getAirExportRates()
        {
            string query = @"SELECT * FROM [dbo].[air_export_rates] ORDER BY id DESC;";
            DataTable airTb = new DataTable();

            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        airTb.Load(reader);
                    }
                }
                con.Close();
            }

            return new OkObjectResult(airTb);
        }

        // POST: api/rates/air-export/bulk - Bulk upload air export rates
        [HttpPost, Route("air-export/bulk")]
        public IActionResult BulkInsertAirExportRates([FromBody] AirExportRateBulkRequest request)
        {
            if (request?.Rates == null || request.Rates.Count == 0)
                return BadRequest(new { message = "No rates provided." });

            int successCount = 0;
            int failCount = 0;

            // Use the shared commodity type from request if individual rows don't have one
            string sharedCommodityType = request.CommodityType;

            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();

                foreach (var rate in request.Rates)
                {
                    try
                    {
                        string query = @"INSERT INTO [dbo].[air_export_rates]
                            (country, commodity_type, airline, rate_m, rate_45_minus, rate_45, rate_100, rate_300, rate_500, rate_1000, surcharges, transit_time, frequency, routing, remarks, updated_date)
                            VALUES
                            (@country, @commodity_type, @airline, @rate_m, @rate_45_minus, @rate_45, @rate_100, @rate_300, @rate_500, @rate_1000, @surcharges, @transit_time, @frequency, @routing, @remarks, @updated_date);";

                        using (SqlCommand cmd = new SqlCommand(query, con))
                        {
                            cmd.Parameters.AddWithValue("@country", rate.Country ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@commodity_type", rate.CommodityType ?? sharedCommodityType ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@airline", rate.Airline ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@rate_m", rate.RateM ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@rate_45_minus", rate.Rate45Minus ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@rate_45", rate.Rate45 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@rate_100", rate.Rate100 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@rate_300", rate.Rate300 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@rate_500", rate.Rate500 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@rate_1000", rate.Rate1000 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@surcharges", rate.Surcharges ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@transit_time", rate.TransitTime ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@frequency", rate.Frequency ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@routing", rate.Routing ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@remarks", rate.Remarks ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@updated_date", rate.UpdatedDate ?? (object)DBNull.Value);

                            cmd.ExecuteNonQuery();
                            successCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        failCount++;
                        Console.WriteLine($"Failed to insert air export rate: {ex.Message}");
                    }
                }
                con.Close();
            }

            return Ok(new { successCount, failCount, message = $"Inserted {successCount} air export rates." });
        }

        // PUT: api/rates/air-export/{id} - Update single air export rate
        [HttpPut, Route("air-export/{id:int}")]
        public IActionResult UpdateAirExportRate(int id, [FromBody] AirExportRate rate)
        {
            string query = @"UPDATE [dbo].[air_export_rates] SET
                country = @country,
                commodity_type = @commodity_type,
                airline = @airline,
                rate_m = @rate_m,
                rate_45_minus = @rate_45_minus,
                rate_45 = @rate_45,
                rate_100 = @rate_100,
                rate_300 = @rate_300,
                rate_500 = @rate_500,
                rate_1000 = @rate_1000,
                surcharges = @surcharges,
                transit_time = @transit_time,
                frequency = @frequency,
                routing = @routing,
                remarks = @remarks,
                updated_date = @updated_date
                WHERE id = @id;";

            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.Parameters.AddWithValue("@country", rate.Country ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@commodity_type", rate.CommodityType ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@airline", rate.Airline ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@rate_m", rate.RateM ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@rate_45_minus", rate.Rate45Minus ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@rate_45", rate.Rate45 ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@rate_100", rate.Rate100 ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@rate_300", rate.Rate300 ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@rate_500", rate.Rate500 ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@rate_1000", rate.Rate1000 ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@surcharges", rate.Surcharges ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@transit_time", rate.TransitTime ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@frequency", rate.Frequency ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@routing", rate.Routing ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@remarks", rate.Remarks ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@updated_date", rate.UpdatedDate ?? (object)DBNull.Value);

                    int rowsAffected = cmd.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound(new { message = $"Air export rate with id {id} not found." });

                    return Ok(new { message = "Updated successfully." });
                }
            }
        }

        // DELETE: api/rates/air-export/{id} - Delete single air export rate
        [HttpDelete, Route("air-export/{id:int}")]
        public IActionResult DeleteAirExportRate(int id)
        {
            string query = @"DELETE FROM [dbo].[air_export_rates] WHERE id = @id;";

            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    int rowsAffected = cmd.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound(new { message = $"Air export rate with id {id} not found." });

                    return Ok(new { message = "Deleted successfully." });
                }
            }
        }

        // DELETE: api/rates/air-export/all - Delete all air export rates
        [HttpDelete, Route("air-export/all")]
        public IActionResult DeleteAllAirExportRates()
        {
            string query = @"DELETE FROM [dbo].[air_export_rates];";

            using (SqlConnection con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    int rowsAffected = cmd.ExecuteNonQuery();
                    return Ok(new { message = $"Deleted {rowsAffected} air export rates.", count = rowsAffected });
                }
            }
        }
    }
}