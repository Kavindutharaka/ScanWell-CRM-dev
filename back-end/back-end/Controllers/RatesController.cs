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
                (freightType, origin, destination, airline, liner, route, surcharges, transitTime, transshipmentTime, frequency, routingType, rateDataJson, validateDate, note, remark, owner)
                VALUES 
                (@freightType, @origin, @destination, @airline, @liner, @route, @surcharges, @transitTime, @transshipmentTime, @frequency, @routingType, @rateDataJson, @validateDate, @note, @remark, @owner);
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
                    owner = @owner
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
    }
}