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
        public ActionResult getActivities([FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] string search = "", [FromQuery] string activityType = "all", [FromQuery] string status = "all")
        {
            int offset = (page - 1) * pageSize;

            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrWhiteSpace(search))
            {
                conditions.Add(@"(a.[activity_name] LIKE @search
                    OR a.[activity_type] LIKE @search
                    OR a.[status] LIKE @search
                    OR a.[related_account] LIKE @search
                    OR e.[fname] LIKE @search
                    OR e.[lname] LIKE @search)");
                parameters.Add(new SqlParameter("@search", $"%{search}%"));
            }

            if (!string.IsNullOrEmpty(activityType) && activityType != "all")
            {
                var values = activityType.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (values.Length == 1)
                {
                    conditions.Add("a.[activity_type] = @activityType");
                    parameters.Add(new SqlParameter("@activityType", values[0].Trim()));
                }
                else
                {
                    var paramNames = new List<string>();
                    for (int i = 0; i < values.Length; i++)
                    {
                        paramNames.Add($"@at{i}");
                        parameters.Add(new SqlParameter($"@at{i}", values[i].Trim()));
                    }
                    conditions.Add($"a.[activity_type] IN ({string.Join(",", paramNames)})");
                }
            }

            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                var values = status.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (values.Length == 1)
                {
                    conditions.Add("a.[status] = @status");
                    parameters.Add(new SqlParameter("@status", values[0].Trim()));
                }
                else
                {
                    var paramNames = new List<string>();
                    for (int i = 0; i < values.Length; i++)
                    {
                        paramNames.Add($"@st{i}");
                        parameters.Add(new SqlParameter($"@st{i}", values[i].Trim()));
                    }
                    conditions.Add($"a.[status] IN ({string.Join(",", paramNames)})");
                }
            }

            string baseFrom = @"FROM [dbo].[activity] AS a
                LEFT JOIN [dbo].[emp_reg] AS e ON a.[owner] = e.[SysID]";
            string whereClause = conditions.Count > 0 ? " WHERE " + string.Join(" AND ", conditions) : "";

            string countQuery = $"SELECT COUNT(*) {baseFrom}{whereClause};";
            string dataQuery = $@"SELECT
                a.[id], a.[activity_name], a.[activity_type],
                e.[fname] + ' ' + e.[lname] AS [owner_name],
                a.[start_time], a.[end_time], a.[status], a.[related_account]
                {baseFrom}{whereClause}
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
                        foreach (var p in parameters) cmd.Parameters.Add(new SqlParameter(p.ParameterName, p.Value));
                        totalCount = (int)cmd.ExecuteScalar();
                    }

                    using (var cmd = new SqlCommand(dataQuery, con))
                    {
                        foreach (var p in parameters) cmd.Parameters.Add(new SqlParameter(p.ParameterName, p.Value));
                        cmd.Parameters.AddWithValue("@offset", offset);
                        cmd.Parameters.AddWithValue("@pageSize", pageSize);

                        using (var reader = cmd.ExecuteReader())
                        {
                            table.Load(reader);
                        }
                    }
                }

                // Get type counts (no filter — always show full totals)
                object typeCounts;
                try { typeCounts = GetTypeCounts(); }
                catch { typeCounts = new { total = 0, siteVisit = 0, call = 0, meeting = 0, email = 0, followUp = 0, presentation = 0, other = 0 }; }

                return Ok(new
                {
                    data = table,
                    totalCount = totalCount,
                    page = page,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                    typeCounts = typeCounts
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpGet("{id}")]
        public ActionResult getActivitiesById(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] string search = "", [FromQuery] string activityType = "all", [FromQuery] string status = "all")
        {
            int offset = (page - 1) * pageSize;

            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            conditions.Add("a.[owner] = @id");
            parameters.Add(new SqlParameter("@id", id));

            if (!string.IsNullOrWhiteSpace(search))
            {
                conditions.Add(@"(a.[activity_name] LIKE @search
                    OR a.[activity_type] LIKE @search
                    OR a.[status] LIKE @search
                    OR a.[related_account] LIKE @search)");
                parameters.Add(new SqlParameter("@search", $"%{search}%"));
            }

            if (!string.IsNullOrEmpty(activityType) && activityType != "all")
            {
                var values = activityType.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (values.Length == 1)
                {
                    conditions.Add("a.[activity_type] = @activityType");
                    parameters.Add(new SqlParameter("@activityType", values[0].Trim()));
                }
                else
                {
                    var paramNames = new List<string>();
                    for (int i = 0; i < values.Length; i++)
                    {
                        paramNames.Add($"@at{i}");
                        parameters.Add(new SqlParameter($"@at{i}", values[i].Trim()));
                    }
                    conditions.Add($"a.[activity_type] IN ({string.Join(",", paramNames)})");
                }
            }

            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                var values = status.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (values.Length == 1)
                {
                    conditions.Add("a.[status] = @status");
                    parameters.Add(new SqlParameter("@status", values[0].Trim()));
                }
                else
                {
                    var paramNames = new List<string>();
                    for (int i = 0; i < values.Length; i++)
                    {
                        paramNames.Add($"@st{i}");
                        parameters.Add(new SqlParameter($"@st{i}", values[i].Trim()));
                    }
                    conditions.Add($"a.[status] IN ({string.Join(",", paramNames)})");
                }
            }

            string baseFrom = @"FROM [dbo].[activity] AS a
                LEFT JOIN [dbo].[emp_reg] AS e ON a.[owner] = e.[SysID]";
            string whereClause = " WHERE " + string.Join(" AND ", conditions);

            string countQuery = $"SELECT COUNT(*) {baseFrom}{whereClause};";
            string dataQuery = $@"SELECT
                a.[id], a.[activity_name], a.[activity_type],
                e.[fname] + ' ' + e.[lname] AS [owner_name],
                a.[start_time], a.[end_time], a.[status], a.[related_account]
                {baseFrom}{whereClause}
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
                        foreach (var p in parameters) cmd.Parameters.Add(new SqlParameter(p.ParameterName, p.Value));
                        totalCount = (int)cmd.ExecuteScalar();
                    }

                    using (var cmd = new SqlCommand(dataQuery, con))
                    {
                        foreach (var p in parameters) cmd.Parameters.Add(new SqlParameter(p.ParameterName, p.Value));
                        cmd.Parameters.AddWithValue("@offset", offset);
                        cmd.Parameters.AddWithValue("@pageSize", pageSize);

                        using (var reader = cmd.ExecuteReader())
                        {
                            table.Load(reader);
                        }
                    }
                }

                // Get type counts for this employee only
                object typeCounts;
                try { typeCounts = GetTypeCounts("a.[owner] = @ownerId", new SqlParameter("@ownerId", id)); }
                catch { typeCounts = new { total = 0, siteVisit = 0, call = 0, meeting = 0, email = 0, followUp = 0, presentation = 0, other = 0 }; }

                return Ok(new
                {
                    data = table,
                    totalCount = totalCount,
                    page = page,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                    typeCounts = typeCounts
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
                     FROM [dbo].[emp_reg]
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
                    (activity_name, activity_type, owner, start_time, end_time, status, related_account, reschedule_date)
                VALUES
                    (@activityName, @activityType, @owner, @startTime, @endTime, @status, @relatedItem, @rescheduleDate);
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
                        var localStart = DateTime.SpecifyKind(activity.startTime.Value, DateTimeKind.Unspecified);
                        myCom.Parameters.Add("@startTime", SqlDbType.DateTime2).Value = localStart;
                    }
                    else
                    {
                        myCom.Parameters.AddWithValue("@startTime", DBNull.Value);
                    }

                    if (activity.endTime.HasValue)
                    {
                        var localEnd = DateTime.SpecifyKind(activity.endTime.Value, DateTimeKind.Unspecified);
                        myCom.Parameters.Add("@endTime", SqlDbType.DateTime2).Value = localEnd;
                    }
                    else
                    {
                        myCom.Parameters.AddWithValue("@endTime", DBNull.Value);
                    }

                    if (activity.rescheduleDate.HasValue)
                    {
                        var localReschedule = DateTime.SpecifyKind(activity.rescheduleDate.Value, DateTimeKind.Unspecified);
                        myCom.Parameters.Add("@rescheduleDate", SqlDbType.DateTime2).Value = localReschedule;
                    }
                    else
                    {
                        myCom.Parameters.AddWithValue("@rescheduleDate", DBNull.Value);
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
                                 start_time = @startTime, end_time = @endTime, status = @status,
                                 related_account = @relatedItem, reschedule_date = @rescheduleDate
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
                        var localStart = DateTime.SpecifyKind(activity.startTime.Value, DateTimeKind.Unspecified);
                        myCom.Parameters.Add("@startTime", SqlDbType.DateTime2).Value = localStart;
                    }
                    else
                    {
                        myCom.Parameters.AddWithValue("@startTime", DBNull.Value);
                    }

                    if (activity.endTime.HasValue)
                    {
                        var localEnd = DateTime.SpecifyKind(activity.endTime.Value, DateTimeKind.Unspecified);
                        myCom.Parameters.Add("@endTime", SqlDbType.DateTime2).Value = localEnd;
                    }
                    else
                    {
                        myCom.Parameters.AddWithValue("@endTime", DBNull.Value);
                    }

                    if (activity.rescheduleDate.HasValue)
                    {
                        var localReschedule = DateTime.SpecifyKind(activity.rescheduleDate.Value, DateTimeKind.Unspecified);
                        myCom.Parameters.Add("@rescheduleDate", SqlDbType.DateTime2).Value = localReschedule;
                    }
                    else
                    {
                        myCom.Parameters.AddWithValue("@rescheduleDate", DBNull.Value);
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

        // ====================================================================
        // HELPER: Get activity type counts (for summary cards)
        // ====================================================================
        private object GetTypeCounts(string ownerCondition = null, SqlParameter ownerParam = null)
        {
            string whereClause = !string.IsNullOrEmpty(ownerCondition) ? $" WHERE {ownerCondition}" : "";
            string query = $@"
                SELECT
                    COUNT(*) AS total,
                    COUNT(CASE WHEN a.[activity_type] = 'site_visit' OR a.[activity_type] = 'site-visit' THEN 1 END) AS siteVisit,
                    COUNT(CASE WHEN a.[activity_type] = 'call' THEN 1 END) AS [call],
                    COUNT(CASE WHEN a.[activity_type] = 'meeting' THEN 1 END) AS meeting,
                    COUNT(CASE WHEN a.[activity_type] = 'email' THEN 1 END) AS email,
                    COUNT(CASE WHEN a.[activity_type] = 'follow-up' THEN 1 END) AS followUp,
                    COUNT(CASE WHEN a.[activity_type] = 'presentation' THEN 1 END) AS presentation,
                    COUNT(CASE WHEN a.[activity_type] NOT IN ('site_visit','site-visit','call','meeting','email','follow-up','presentation') THEN 1 END) AS other
                FROM [dbo].[activity] a
                {whereClause};";

            using (var con = new SqlConnection(_dbConnectionString))
            {
                con.Open();
                using (var cmd = new SqlCommand(query, con))
                {
                    if (ownerParam != null)
                        cmd.Parameters.Add(new SqlParameter(ownerParam.ParameterName, ownerParam.Value));

                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new
                            {
                                total = Convert.ToInt32(reader["total"]),
                                siteVisit = Convert.ToInt32(reader["siteVisit"]),
                                call = Convert.ToInt32(reader["call"]),
                                meeting = Convert.ToInt32(reader["meeting"]),
                                email = Convert.ToInt32(reader["email"]),
                                followUp = Convert.ToInt32(reader["followUp"]),
                                presentation = Convert.ToInt32(reader["presentation"]),
                                other = Convert.ToInt32(reader["other"])
                            };
                        }
                    }
                }
            }
            return new { total = 0, siteVisit = 0, call = 0, meeting = 0, email = 0, followUp = 0, presentation = 0, other = 0 };
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