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
    public class ActivityController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;

        public ActivityController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
        }

        [HttpGet]
        public ActionResult getActivities()
        {
            string query = "select * from [dbo].[activity];";
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
        public ActionResult createActivity(Activitys activity)
        {
            string query = @"insert into [dbo].[activity] (activity_name, activity_type, owner, start_time, end_time, status, related_item) 
                             values (@activityName, @activityType, @owner, @startTime, @endTime, @status, @relatedItem);";
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@activityName", activity.activityName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@activityType", activity.activityType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@owner", activity.owner ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@startTime", activity.startTime ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@endTime", activity.endTime ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@status", activity.status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@relatedItem", activity.relatedItem ?? (object)DBNull.Value);
                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }
            return Ok("Activity added successfully.");
        }

        [HttpPut]
        public ActionResult updateActivity(Activitys activity)
        {
            string query = @"update [dbo].[activity] 
                             set activity_name = @activityName, activity_type = @activityType, owner = @owner, 
                                 start_time = @startTime, end_time = @endTime, status = @status, related_item = @relatedItem 
                             where id = @id;";
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", activity.id);
                    myCom.Parameters.AddWithValue("@activityName", activity.activityName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@activityType", activity.activityType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@owner", activity.owner ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@startTime", activity.startTime ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@endTime", activity.endTime ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@status", activity.status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@relatedItem", activity.relatedItem ?? (object)DBNull.Value);
                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }
            return Ok("Activity updated successfully.");
        }

        [HttpDelete("{id}")]
        public ActionResult deleteActivity(long id)
        {
            string query = @"delete from [dbo].[activity] where id = @id;";
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    int rowsAffected = myCom.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound("Activity not found.");
                }
                myCon.Close();
            }
            return Ok("Activity deleted successfully.");
        }
    }
}