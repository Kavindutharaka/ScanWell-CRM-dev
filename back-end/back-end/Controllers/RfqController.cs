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
    public class RfqController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;

        public RfqController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
        }

        [HttpGet]
        public ActionResult getActivities()
        {
            string query = "select sysID, rfq_number, customer, valid_date, file_name from [dbo].[rfq];";
            DataTable table = new DataTable();
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        table.Load(myR);
                    }
                }
                myCon.Close();
            }
            return Ok(table);
        }

        [HttpPost]
        public ActionResult CreateStatusLog(Rfq rfq)
        {
            string query = @"INSERT INTO [dbo].[rfq] (rfq_number, customer, valid_date, data_obj, file_name, added_by)
                     VALUES (@rfq_number, @customer, @valid_date, @data_obj, @file_name, @added_by)";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@rfq_number", rfq.rfq_number ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@customer", rfq.customer ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@valid_date", rfq.valid_date);
                    myCom.Parameters.AddWithValue("@data_obj", rfq.data_obj ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@file_name", rfq.file_name ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@added_by", rfq.added_by ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("RFQ added successfully.");
        }

        [HttpGet("{id}")]
        public IActionResult GetDataObjById(long id)
        {
            string dataObj = null;
            string query = @"SELECT data_obj FROM rfq WHERE sysID = @sysID";
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand cmd = new SqlCommand(query, myCon))
                {
                    cmd.Parameters.AddWithValue("@sysID", id);
                    var result = cmd.ExecuteScalar();
                    if (result != null && result != DBNull.Value)
                    {
                        dataObj = result.ToString();
                    }
                }
            }
            if (dataObj == null)
                return NotFound("RFQ not found");
            return Ok(dataObj);
        }
    }
}