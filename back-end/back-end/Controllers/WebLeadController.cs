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
    public class WebLeadController : ControllerBase
    {
        private readonly string _dbConnectionString;

        public WebLeadController(IConfiguration configuration)
        {
            _dbConnectionString = configuration.GetSection("DBCon").Value;
        }

        [HttpGet, Route("web-leads")]
        public ActionResult GetWebLeads()
        {
            string query = @"SELECT TOP 20 * FROM [dbo].[web_leads] ORDER BY sysId DESC;";
            DataTable tb = new DataTable();
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        tb.Load(myR);
                    }
                }
                myCon.Close();
            }
            return new OkObjectResult(tb);
        }

        [HttpGet, Route("web-leads/all")]
        public ActionResult GetAllWebLeads()
        {
            string query = @"SELECT * FROM [dbo].[web_leads] ORDER BY sysId DESC;";
            DataTable tb = new DataTable();
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        tb.Load(myR);
                    }
                }
                myCon.Close();
            }
            return new OkObjectResult(tb);
        }

        [HttpGet, Route("web-lead/{id}")]
        public ActionResult GetWebLeadById(int id)
        {
            string query = @"SELECT * FROM [dbo].[web_leads] WHERE sysId = @id;";
            DataTable tb = new DataTable();
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        tb.Load(myR);
                    }
                }
                myCon.Close();
            }
            if (tb.Rows.Count == 0)
            {
                return NotFound("Web lead not found.");
            }
            return new OkObjectResult(tb);
        }

        [HttpPost, Route("web-lead")]
        public IActionResult CreateWebLead([FromBody] WebLead webLead)
        {
            string query = @"
                INSERT INTO [dbo].[web_leads]
                (name, tp, email)
                VALUES
                (@name, @tp, @email)";

            try
            {
                using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
                {
                    myCon.Open();
                    using (SqlCommand myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@name", webLead.name ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@tp", webLead.tp ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@email", webLead.email ?? (object)DBNull.Value);

                        myCom.ExecuteNonQuery();
                    }
                    myCon.Close();
                }
                return Ok(new { message = "Web lead created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpPut, Route("web-lead")]
        public IActionResult UpdateWebLead([FromBody] WebLead webLead)
        {
            if (webLead.sysId == null || webLead.sysId == 0)
                return BadRequest("sysId is required.");

            string query = @"
                UPDATE [dbo].[web_leads] SET
                    name = @name,
                    tp = @tp,
                    email = @email
                WHERE sysId = @sysId";

            try
            {
                using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
                {
                    myCon.Open();
                    using (SqlCommand myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@sysId", webLead.sysId);
                        myCom.Parameters.AddWithValue("@name", webLead.name ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@tp", webLead.tp ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@email", webLead.email ?? (object)DBNull.Value);

                        int rows = myCom.ExecuteNonQuery();
                        if (rows == 0) return NotFound("Web lead not found.");
                    }
                    myCon.Close();
                }
                return Ok(new { message = "Web lead updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpDelete, Route("web-lead/{id}")]
        public IActionResult DeleteWebLead(int id)
        {
            string query = @"DELETE FROM [dbo].[web_leads] WHERE sysId = @id";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Web lead not found.");
                }
                myCon.Close();
            }

            return Ok("Web lead deleted successfully.");
        }
    }
}
