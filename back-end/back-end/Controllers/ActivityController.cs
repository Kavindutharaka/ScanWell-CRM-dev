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
        public ActionResult getActivities([FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] string search = "")
        {
            int offset = (page - 1) * pageSize;

            string searchFilter = "";
            if (!string.IsNullOrWhiteSpace(search))
            {
                searchFilter = @" WHERE (a.[activity_name] LIKE @search
                    OR a.[activity_type] LIKE @search
                    OR a.[status] LIKE @search
                    OR a.[related_account] LIKE @search
                    OR e.[fname] LIKE @search
                    OR e.[lname] LIKE @search) ";
            }

            string baseFrom = @"FROM [dbo].[activity] AS a
                LEFT JOIN [dbo].[emp_reg] AS e ON a.[owner] = e.[SysID]";

            string countQuery = $"SELECT COUNT(*) {baseFrom}{searchFilter};";
            string dataQuery = $@"SELECT
                a.[id], a.[activity_name], a.[activity_type],
                e.[fname] + ' ' + e.[lname] AS [owner_name],
                a.[start_time], a.[end_time], a.[status], a.[related_account]
                {baseFrom}{searchFilter}
                ORDER BY a.[id] DESC
                OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;";

            try
            {
                int totalCount = 0;
                DataTable table = new DataTable();

                using (var con = new SqlConnection(_dbConnectionString))
                {
                    con.Open();

                    using (var cmd = new SqlCommand(countQuery, con))
                    {
                        if (!string.IsNullOrWhiteSpace(search))
                            cmd.Parameters.AddWithValue("@search", $"%{search}%");
                        totalCount = (int)cmd.ExecuteScalar();
                    }

                    using (var cmd = new SqlCommand(dataQuery, con))
                    {
                        if (!string.IsNullOrWhiteSpace(search))
                            cmd.Parameters.AddWithValue("@search", $"%{search}%");
                        cmd.Parameters.AddWithValue("@offset", offset);
                        cmd.Parameters.AddWithValue("@pageSize", pageSize);

                        using (var reader = cmd.ExecuteReader())
                        {
                            table.Load(reader);
                        }
                    }
                }

                return Ok(new
                {
                    data = table,
                    totalCount = totalCount,
                    page = page,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpGet("{id}")]
        public ActionResult getActivitiesById(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] string search = "")
        {
            int offset = (page - 1) * pageSize;

            string searchFilter = "";
            if (!string.IsNullOrWhiteSpace(search))
            {
                searchFilter = @" AND (a.[activity_name] LIKE @search
                    OR a.[activity_type] LIKE @search
                    OR a.[status] LIKE @search
                    OR a.[related_account] LIKE @search) ";
            }

            string baseFrom = @"FROM [dbo].[activity] AS a
                LEFT JOIN [dbo].[emp_reg] AS e ON a.[owner] = e.[SysID]
                WHERE a.[owner] = @id";

            string countQuery = $"SELECT COUNT(*) {baseFrom}{searchFilter};";
            string dataQuery = $@"SELECT
                a.[id], a.[activity_name], a.[activity_type],
                e.[fname] + ' ' + e.[lname] AS [owner_name],
                a.[start_time], a.[end_time], a.[status], a.[related_account]
                {baseFrom}{searchFilter}
                ORDER BY a.[id] DESC
                OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;";

            try
            {
                int totalCount = 0;
                DataTable table = new DataTable();

                using (var con = new SqlConnection(_dbConnectionString))
                {
                    con.Open();

                    using (var cmd = new SqlCommand(countQuery, con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        if (!string.IsNullOrWhiteSpace(search))
                            cmd.Parameters.AddWithValue("@search", $"%{search}%");
                        totalCount = (int)cmd.ExecuteScalar();
                    }

                    using (var cmd = new SqlCommand(dataQuery, con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        if (!string.IsNullOrWhiteSpace(search))
                            cmd.Parameters.AddWithValue("@search", $"%{search}%");
                        cmd.Parameters.AddWithValue("@offset", offset);
                        cmd.Parameters.AddWithValue("@pageSize", pageSize);

                        using (var reader = cmd.ExecuteReader())
                        {
                            table.Load(reader);
                        }
                    }
                }

                return Ok(new
                {
                    data = table,
                    totalCount = totalCount,
                    page = page,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
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