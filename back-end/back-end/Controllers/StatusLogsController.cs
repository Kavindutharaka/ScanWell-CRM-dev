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
    public class StatusLogController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;

        public StatusLogController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
        }

        [HttpGet]
        public ActionResult getActivities()
        {
            string query = "select * from [dbo].[status_logs];";
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
        public ActionResult CreateStatusLog(StatusLogs statusLog)
        {
            string query = @"
                INSERT INTO [dbo].[status_logs] (new_status, note, activity_id)
                VALUES (@newStatus, @note, @activityId);
            ";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@newStatus", statusLog.new_status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@note", statusLog.note ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@activityId", statusLog.activity_id);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Status log added successfully.");
        }

        [HttpGet("{id}")]
        public IActionResult GetStatusById(long id)
        {
            string query = @"SELECT sysID,new_status,note,created_at FROM [dbo].[status_logs] WHERE activity_id = @sysID";
            DataTable table = new DataTable();
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand cmd = new SqlCommand(query, myCon))
                {
                    cmd.Parameters.AddWithValue("@sysID", id);
                    using (SqlDataReader myR = cmd.ExecuteReader())
                    {
                        table.Load(myR);
                    }
                }
            }
            return Ok(table);
        }


    }
}