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
    public class TemplatesController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;

        public TemplatesController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
        }

        [HttpGet]
        public ActionResult GetAll([FromQuery] string freightType = null)
        {
            var templates = new List<Template>();

            string query = "SELECT * FROM templates";
            if (!string.IsNullOrEmpty(freightType))
            {
                query += " WHERE FreightType = @freightType";
            }

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    if (!string.IsNullOrEmpty(freightType))
                    {
                        myCom.Parameters.AddWithValue("@freightType", freightType);
                    }
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        while (myR.Read())
                        {
                            var template = new Template
                            {
                                Id = Convert.ToInt64(myR["Id"]),
                                Name = myR["Name"].ToString(),
                                FreightType = myR.IsDBNull(myR.GetOrdinal("FreightType")) ? null : myR["FreightType"].ToString(),
                                DataJson = myR["DataJson"].ToString()
                            };
                            templates.Add(template);
                        }
                    }
                }
                myCon.Close();
            }

            return Ok(templates);
        }

        [HttpPost]
        public ActionResult Create([FromBody] Template template)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            string query = @"
                INSERT INTO templates (Name, FreightType, DataJson)
                VALUES (@Name, @FreightType, @DataJson);
                SELECT SCOPE_IDENTITY();";

            long newId;
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@Name", template.Name ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@FreightType", template.FreightType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@DataJson", template.DataJson ?? (object)DBNull.Value);

                    newId = Convert.ToInt64(myCom.ExecuteScalar());
                }
                myCon.Close();
            }

            template.Id = newId;
            return Ok(template);
        }
    }
}