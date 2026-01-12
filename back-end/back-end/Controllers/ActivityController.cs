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
            string query = @"
        SELECT 
            a.[id],
            a.[activity_name],
            a.[activity_type],
            e.[fname] + ' ' + e.[lname] AS [owner_name],
            a.[start_time],
            a.[end_time],
            a.[status],
            a.[related_account]
        FROM [dbo].[activity] AS a
        LEFT JOIN [dbo].[emp_reg] AS e
            ON a.[owner] = e.[SysID]
        ORDER BY a.[id] DESC;";

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

        [HttpGet("owner/{id}")]
        public ActionResult GetActivityOwner(long id)
        {
            string query = @"SELECT fname + ' ' + lname AS fullName 
                     FROM [phvtechc_crm].[dbo].[emp_reg] 
                     WHERE SysID = @id;";

            string fullName = null;

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    using (SqlDataReader reader = myCom.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            fullName = reader["fullName"].ToString();
                        }
                    }
                }
            }

            if (fullName == null)
                return NotFound("Employee not found");

            return Ok(new { fullName });
        }



        [HttpPost]
        public ActionResult createActivity(Activitys activity)
        {
            string query = @"
                INSERT INTO [dbo].[activity] 
                    (activity_name, activity_type, owner, start_time, end_time, status, related_account) 
                VALUES 
                    (@activityName, @activityType, @owner, @startTime, @endTime, @status, @relatedItem);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            int newActivityId;

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@activityName", activity.activityName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@activityType", activity.activityType ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@owner", activity.owner ?? (object)DBNull.Value);
                    
                    // ═══════════════════════════════════════════════════════════════
                    // DATETIME FIX: Prevent timezone conversion by using Unspecified
                    // ═══════════════════════════════════════════════════════════════
                    if (activity.startTime.HasValue)
                    {
                        // Remove any timezone info and store as-is
                        var localStart = DateTime.SpecifyKind(activity.startTime.Value, DateTimeKind.Unspecified);
                        myCom.Parameters.Add("@startTime", SqlDbType.DateTime2).Value = localStart;
                    }
                    else
                    {
                        myCom.Parameters.AddWithValue("@startTime", DBNull.Value);
                    }
                    
                    if (activity.endTime.HasValue)
                    {
                        // Remove any timezone info and store as-is
                        var localEnd = DateTime.SpecifyKind(activity.endTime.Value, DateTimeKind.Unspecified);
                        myCom.Parameters.Add("@endTime", SqlDbType.DateTime2).Value = localEnd;
                    }
                    else
                    {
                        myCom.Parameters.AddWithValue("@endTime", DBNull.Value);
                    }
                    // ═══════════════════════════════════════════════════════════════
                    
                    myCom.Parameters.AddWithValue("@status", activity.status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@relatedItem", activity.relatedAccount ?? (object)DBNull.Value);

                    // Execute the insert and get the new ID
                    newActivityId = (int)myCom.ExecuteScalar();
                }
            }

            // Return both ID and message
            return Ok(new
            {
                message = "Activity added successfully.",
                activityId = newActivityId
            });
        }


        [HttpPut]
        public ActionResult updateActivity(Activitys activity)
        {
            string query = @"update [dbo].[activity] 
                             set activity_name = @activityName, activity_type = @activityType, owner = @owner, 
                                 start_time = @startTime, end_time = @endTime, status = @status, related_account = @relatedItem 
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
                    
                    // ═══════════════════════════════════════════════════════════════
                    // DATETIME FIX: Prevent timezone conversion by using Unspecified
                    // ═══════════════════════════════════════════════════════════════
                    if (activity.startTime.HasValue)
                    {
                        // Remove any timezone info and store as-is
                        var localStart = DateTime.SpecifyKind(activity.startTime.Value, DateTimeKind.Unspecified);
                        myCom.Parameters.Add("@startTime", SqlDbType.DateTime2).Value = localStart;
                    }
                    else
                    {
                        myCom.Parameters.AddWithValue("@startTime", DBNull.Value);
                    }
                    
                    if (activity.endTime.HasValue)
                    {
                        // Remove any timezone info and store as-is
                        var localEnd = DateTime.SpecifyKind(activity.endTime.Value, DateTimeKind.Unspecified);
                        myCom.Parameters.Add("@endTime", SqlDbType.DateTime2).Value = localEnd;
                    }
                    else
                    {
                        myCom.Parameters.AddWithValue("@endTime", DBNull.Value);
                    }
                    // ═══════════════════════════════════════════════════════════════
                    
                    myCom.Parameters.AddWithValue("@status", activity.status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@relatedItem", activity.relatedAccount ?? (object)DBNull.Value);
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