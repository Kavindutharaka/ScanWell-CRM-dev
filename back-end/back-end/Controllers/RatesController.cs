// Controllers/RatesController.cs
using System;
using System.Data;
using System.Text.Json;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RatesController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string dbcon;
        private DataTable tb;
        private SqlConnection myCon;
        private SqlCommand myCom;
        private SqlDataReader myR;

        public RatesController(IConfiguration configuration)
        {
            _configuration = configuration;
            dbcon = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(dbcon);
        }

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
        // LINER RATES ENDPOINTS
        // ============================================================================

        // GET: api/rates/liner?category=MSC
        [HttpGet]
        [Route("liner")]
        public IActionResult GetLinerRatesByCategory([FromQuery] string category)
        {
            if (string.IsNullOrEmpty(category))
            {
                return BadRequest(new { message = "Category is required." });
            }

            string query = @"SELECT * FROM [dbo].[liner_rates] WHERE category = @category ORDER BY id DESC;";
            var rates = new List<LinerRate>();

            // FIXED: Use the same connection string format as constructor
            using (var connection = new SqlConnection(dbcon))
            {
                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@category", category);
                    
                    try
                    {
                        connection.Open();

                        using (var reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                rates.Add(new LinerRate
                                {
                                    id = reader["id"] != DBNull.Value ? Convert.ToInt64(reader["id"]) : null,
                                    freightType = reader["freightType"]?.ToString(),
                                    origin = reader["origin"]?.ToString(),
                                    destination = reader["destination"]?.ToString(),
                                    airline = reader["airline"]?.ToString(),
                                    liner = reader["liner"]?.ToString(),
                                    route = reader["route"]?.ToString(),
                                    surcharges = reader["surcharges"]?.ToString(),
                                    transitTime = reader["transitTime"]?.ToString(),
                                    transshipmentTime = reader["transshipmentTime"]?.ToString(),
                                    frequency = reader["frequency"]?.ToString(),
                                    routingType = reader["routingType"]?.ToString(),
                                    rateDataJson = reader["rateDataJson"]?.ToString(),
                                    validateDate = reader["validateDate"] != DBNull.Value ? Convert.ToDateTime(reader["validateDate"]) : null,
                                    note = reader["note"]?.ToString(),
                                    remark = reader["remark"]?.ToString(),
                                    owner = reader["owner"]?.ToString(),
                                    currency = reader["currency"]?.ToString(),
                                    category = reader["category"]?.ToString(),
                                });
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        return StatusCode(500, new { message = "Database error", error = ex.Message });
                    }
                }
            }

            if (rates.Count == 0)
                return NotFound(new { message = $"No rates found for category '{category}'." });

            return Ok(rates);
        }

        // GET: api/rates/liner/{id}
        [HttpGet]
        [Route("liner/{id}")]
        public IActionResult GetLinerRateById(long id)
        {
            string query = @"SELECT * FROM [dbo].[liner_rates] WHERE id = @id;";
            LinerRate rate = null;

            using (var connection = new SqlConnection(dbcon))
            {
                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@id", id);

                    try
                    {
                        connection.Open();

                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                rate = new LinerRate
                                {
                                    id = reader["id"] != DBNull.Value ? Convert.ToInt64(reader["id"]) : null,
                                    freightType = reader["freightType"]?.ToString(),
                                    origin = reader["origin"]?.ToString(),
                                    destination = reader["destination"]?.ToString(),
                                    airline = reader["airline"]?.ToString(),
                                    liner = reader["liner"]?.ToString(),
                                    route = reader["route"]?.ToString(),
                                    surcharges = reader["surcharges"]?.ToString(),
                                    transitTime = reader["transitTime"]?.ToString(),
                                    transshipmentTime = reader["transshipmentTime"]?.ToString(),
                                    frequency = reader["frequency"]?.ToString(),
                                    routingType = reader["routingType"]?.ToString(),
                                    rateDataJson = reader["rateDataJson"]?.ToString(),
                                    validateDate = reader["validateDate"] != DBNull.Value ? Convert.ToDateTime(reader["validateDate"]) : null,
                                    note = reader["note"]?.ToString(),
                                    remark = reader["remark"]?.ToString(),
                                    owner = reader["owner"]?.ToString(),
                                    currency = reader["currency"]?.ToString(),
                                    category = reader["category"]?.ToString(),
                                };
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        return StatusCode(500, new { message = "Database error", error = ex.Message });
                    }
                }
            }

            if (rate == null)
                return NotFound(new { message = $"Liner rate with id {id} not found." });

            return Ok(rate);
        }

        // POST: api/rates/liner/bulk
        [HttpPost]
        [Route("liner/bulk")]
        public IActionResult CreateLinerRatesBulk([FromBody] LinerRateBulkRequest request)
        {
            if (request == null || request.rates == null || request.rates.Count == 0)
            {
                return BadRequest(new { message = "No rates provided." });
            }

            var results = new List<object>();
            int successCount = 0;
            int failCount = 0;

            string query = @"
                INSERT INTO [dbo].[liner_rates]
                (freightType, origin, destination, airline, liner, route, surcharges, 
                 transitTime, transshipmentTime, frequency, routingType, rateDataJson, 
                 validateDate, note, remark, owner, currency, category)
                VALUES 
                (@freightType, @origin, @destination, @airline, @liner, @route, @surcharges, 
                 @transitTime, @transshipmentTime, @frequency, @routingType, @rateDataJson, 
                 @validateDate, @note, @remark, @owner, @currency, @category);
                SELECT SCOPE_IDENTITY();";

            using (var connection = new SqlConnection(dbcon))
            {
                connection.Open();

                foreach (var rate in request.rates)
                {
                    try
                    {
                        using (var command = new SqlCommand(query, connection))
                        {
                            command.Parameters.AddWithValue("@freightType", (object?)rate.freightType ?? DBNull.Value);
                            command.Parameters.AddWithValue("@origin", (object?)rate.origin ?? DBNull.Value);
                            command.Parameters.AddWithValue("@destination", (object?)rate.destination ?? DBNull.Value);
                            command.Parameters.AddWithValue("@airline", (object?)rate.airline ?? DBNull.Value);
                            command.Parameters.AddWithValue("@liner", (object?)rate.liner ?? DBNull.Value);
                            command.Parameters.AddWithValue("@route", (object?)rate.route ?? DBNull.Value);
                            command.Parameters.AddWithValue("@surcharges", (object?)rate.surcharges ?? DBNull.Value);
                            command.Parameters.AddWithValue("@transitTime", (object?)rate.transitTime ?? DBNull.Value);
                            command.Parameters.AddWithValue("@transshipmentTime", (object?)rate.transshipmentTime ?? DBNull.Value);
                            command.Parameters.AddWithValue("@frequency", (object?)rate.frequency ?? DBNull.Value);
                            command.Parameters.AddWithValue("@routingType", (object?)rate.routingType ?? DBNull.Value);
                            command.Parameters.AddWithValue("@rateDataJson", (object?)rate.rateDataJson ?? DBNull.Value);
                            command.Parameters.AddWithValue("@validateDate", (object?)rate.validateDate ?? DBNull.Value);
                            command.Parameters.AddWithValue("@note", (object?)rate.note ?? DBNull.Value);
                            command.Parameters.AddWithValue("@remark", (object?)rate.remark ?? DBNull.Value);
                            command.Parameters.AddWithValue("@owner", (object?)rate.owner ?? DBNull.Value);
                            command.Parameters.AddWithValue("@currency", (object?)rate.currency ?? DBNull.Value);
                            command.Parameters.AddWithValue("@category", (object?)rate.category ?? DBNull.Value);

                            var newId = command.ExecuteScalar();
                            results.Add(new { success = true, id = newId });
                            successCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        results.Add(new { success = false, error = ex.Message });
                        failCount++;
                    }
                }
            }

            return Ok(new 
            { 
                message = $"Processed {request.rates.Count} rates. Success: {successCount}, Failed: {failCount}", 
                successCount,
                failCount,
                results 
            });
        }

        // PUT: api/rates/liner/{id}
        [HttpPut]
        [Route("liner/{id}")]
        public IActionResult UpdateLinerRate(long id, [FromBody] LinerRate rate)
        {
            string query = @"
                UPDATE [dbo].[liner_rates] SET
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
                    currency = @currency,
                    category = @category,
                    updatedAt = GETDATE()
                WHERE id = @id";

            using (var connection = new SqlConnection(dbcon))
            {
                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@id", id);
                    command.Parameters.AddWithValue("@freightType", (object?)rate.freightType ?? DBNull.Value);
                    command.Parameters.AddWithValue("@origin", (object?)rate.origin ?? DBNull.Value);
                    command.Parameters.AddWithValue("@destination", (object?)rate.destination ?? DBNull.Value);
                    command.Parameters.AddWithValue("@airline", (object?)rate.airline ?? DBNull.Value);
                    command.Parameters.AddWithValue("@liner", (object?)rate.liner ?? DBNull.Value);
                    command.Parameters.AddWithValue("@route", (object?)rate.route ?? DBNull.Value);
                    command.Parameters.AddWithValue("@surcharges", (object?)rate.surcharges ?? DBNull.Value);
                    command.Parameters.AddWithValue("@transitTime", (object?)rate.transitTime ?? DBNull.Value);
                    command.Parameters.AddWithValue("@transshipmentTime", (object?)rate.transshipmentTime ?? DBNull.Value);
                    command.Parameters.AddWithValue("@frequency", (object?)rate.frequency ?? DBNull.Value);
                    command.Parameters.AddWithValue("@routingType", (object?)rate.routingType ?? DBNull.Value);
                    command.Parameters.AddWithValue("@rateDataJson", (object?)rate.rateDataJson ?? DBNull.Value);
                    command.Parameters.AddWithValue("@validateDate", (object?)rate.validateDate ?? DBNull.Value);
                    command.Parameters.AddWithValue("@note", (object?)rate.note ?? DBNull.Value);
                    command.Parameters.AddWithValue("@remark", (object?)rate.remark ?? DBNull.Value);
                    command.Parameters.AddWithValue("@owner", (object?)rate.owner ?? DBNull.Value);
                    command.Parameters.AddWithValue("@currency", (object?)rate.currency ?? DBNull.Value);
                    command.Parameters.AddWithValue("@category", (object?)rate.category ?? DBNull.Value);

                    try
                    {
                        connection.Open();
                        int rowsAffected = command.ExecuteNonQuery();

                        if (rowsAffected == 0)
                            return NotFound(new { message = "Liner rate not found." });
                    }
                    catch (Exception ex)
                    {
                        return StatusCode(500, new { message = "Database error", error = ex.Message });
                    }
                }
            }

            return Ok(new { message = "Liner rate updated successfully." });
        }

        // DELETE: api/rates/liner/{id}
        [HttpDelete]
        [Route("liner/{id}")]
        public IActionResult DeleteLinerRate(long id)
        {
            string query = @"DELETE FROM [dbo].[liner_rates] WHERE id = @id";

            using (var connection = new SqlConnection(dbcon))
            {
                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@id", id);

                    try
                    {
                        connection.Open();
                        int rowsAffected = command.ExecuteNonQuery();

                        if (rowsAffected == 0)
                            return NotFound(new { message = "Liner rate not found." });
                    }
                    catch (Exception ex)
                    {
                        return StatusCode(500, new { message = "Database error", error = ex.Message });
                    }
                }
            }

            return Ok(new { message = "Liner rate deleted successfully." });
        }
    }
}