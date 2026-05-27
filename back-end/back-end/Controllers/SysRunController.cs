using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json.Linq;
using back_end.Models;

namespace back_end.Controllers
{
    /// <summary>
    /// Developer-only debug audit log. Captures every API call performed by users.
    /// Hidden from sidebar — accessed at /sys-run by admins only.
    /// Frontend axios interceptor calls POST /api/SysRun/log in fire-and-forget batches.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class SysRunController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbcon;
        private static DateTime _lastCleanup = DateTime.MinValue;
        private const int RETENTION_DAYS = 30;

        public SysRunController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbcon = _configuration.GetSection("DBCon").Value;
        }

        // ============================================================
        // POST /api/SysRun/log
        // Accepts a batch of events. Fire-and-forget from the frontend.
        // Reads the body manually as a JObject so we never trigger the
        // [ApiController] auto-400 validation. Swallows ALL errors — logging
        // must never break the app or surface as an HTTP error to the client.
        // [AllowAnonymous] because we want logging to still work during edge
        // cases (e.g. token expired mid-session) — the frontend includes the
        // user info in the payload anyway.
        // ============================================================
        [AllowAnonymous]
        [HttpPost("log")]
        public async Task<IActionResult> LogBatch()
        {
            int inserted = 0;
            try
            {
                // Read the raw body — bypasses model binding entirely.
                string body;
                Request.EnableBuffering();
                using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
                {
                    body = await reader.ReadToEndAsync();
                }

                if (string.IsNullOrWhiteSpace(body))
                    return Ok(new { inserted = 0, reason = "empty body" });

                JArray eventsArray = null;
                try
                {
                    var root = JObject.Parse(body);
                    eventsArray = root["events"] as JArray;
                }
                catch (Exception parseEx)
                {
                    // Body wasn't valid JSON or wasn't shaped as expected — log to server console and ack.
                    Console.Error.WriteLine($"[SysRun.LogBatch] parse error: {parseEx.Message}");
                    return Ok(new { inserted = 0, reason = "invalid json" });
                }

                if (eventsArray == null || eventsArray.Count == 0)
                    return Ok(new { inserted = 0, reason = "no events" });

                string ip = HttpContext?.Connection?.RemoteIpAddress?.ToString();

                using (var con = new SqlConnection(_dbcon))
                {
                    con.Open();
                    foreach (var token in eventsArray)
                    {
                        if (token is not JObject ev) continue;
                        try
                        {
                            string query = @"
                                INSERT INTO [dbo].[sys_event_log]
                                    (user_id, user_name, module, action, http_method, url,
                                     request_payload, response_status, response_payload,
                                     error_message, duration_ms, ip_address, user_agent, created_at)
                                VALUES
                                    (@user_id, @user_name, @module, @action, @http_method, @url,
                                     @request_payload, @response_status, @response_payload,
                                     @error_message, @duration_ms, @ip_address, @user_agent, @created_at);";

                            using (var cmd = new SqlCommand(query, con))
                            {
                                cmd.Parameters.AddWithValue("@user_id",          GetInt(ev, "userId"));
                                cmd.Parameters.AddWithValue("@user_name",        GetTruncatedString(ev, "userName", 200));
                                cmd.Parameters.AddWithValue("@module",           GetTruncatedString(ev, "module", 100));
                                cmd.Parameters.AddWithValue("@action",           GetTruncatedString(ev, "action", 200));
                                cmd.Parameters.AddWithValue("@http_method",      GetTruncatedString(ev, "httpMethod", 10));
                                cmd.Parameters.AddWithValue("@url",              GetTruncatedString(ev, "url", 500));
                                cmd.Parameters.AddWithValue("@request_payload",  GetTruncatedString(ev, "requestPayload", 65536));
                                cmd.Parameters.AddWithValue("@response_status",  GetInt(ev, "responseStatus"));
                                cmd.Parameters.AddWithValue("@response_payload", GetTruncatedString(ev, "responsePayload", 65536));
                                cmd.Parameters.AddWithValue("@error_message",    GetTruncatedString(ev, "errorMessage", 65536));
                                cmd.Parameters.AddWithValue("@duration_ms",      GetInt(ev, "durationMs"));
                                cmd.Parameters.AddWithValue("@ip_address",       (object)Truncate(ip, 50) ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@user_agent",       GetTruncatedString(ev, "userAgent", 500));
                                cmd.Parameters.AddWithValue("@created_at",       GetDateTime(ev, "createdAt") ?? (object)DateTime.UtcNow);
                                cmd.ExecuteNonQuery();
                                inserted++;
                            }
                        }
                        catch (Exception rowEx)
                        {
                            // Per-event failure — log and continue.
                            Console.Error.WriteLine($"[SysRun.LogBatch] row insert failed: {rowEx.Message}");
                        }
                    }
                }

                TryCleanupOld();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[SysRun.LogBatch] unhandled: {ex.Message}");
                // Never propagate — return 200 so the frontend doesn't see noise.
            }

            return Ok(new { inserted });
        }

        // ===== Small JObject helpers — convert JSON tokens into SQL-safe values =====
        private static object GetInt(JObject obj, string key)
        {
            var t = obj[key];
            if (t == null || t.Type == JTokenType.Null) return DBNull.Value;
            try { return (int)t; } catch { return DBNull.Value; }
        }
        private static object GetTruncatedString(JObject obj, string key, int max)
        {
            var t = obj[key];
            if (t == null || t.Type == JTokenType.Null) return DBNull.Value;
            var s = t.Type == JTokenType.String ? (string)t : t.ToString();
            return Truncate(s, max) ?? (object)DBNull.Value;
        }
        private static object GetDateTime(JObject obj, string key)
        {
            var t = obj[key];
            if (t == null || t.Type == JTokenType.Null) return null;
            try
            {
                if (t.Type == JTokenType.Date) return (DateTime)t;
                if (t.Type == JTokenType.String && DateTime.TryParse((string)t, out var dt))
                    return dt.ToUniversalTime();
            }
            catch { }
            return null;
        }

        // ============================================================
        // GET /api/SysRun/events
        // Query the log with filters. Admin-only consumption.
        // ============================================================
        [HttpGet("events")]
        public IActionResult Events(
            [FromQuery] string? dateFrom,
            [FromQuery] string? dateTo,
            [FromQuery] int? userId,
            [FromQuery] string? module,
            [FromQuery] string? method,
            [FromQuery] string? status,   // 'success' | 'error' | 'all'
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 100)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 500) pageSize = 100;

            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var df))
            {
                conditions.Add("created_at >= @dateFrom");
                parameters.Add(new SqlParameter("@dateFrom", df.ToUniversalTime()));
            }
            if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var dt))
            {
                conditions.Add("created_at <= @dateTo");
                parameters.Add(new SqlParameter("@dateTo", dt.ToUniversalTime()));
            }
            if (userId.HasValue)
            {
                conditions.Add("user_id = @userId");
                parameters.Add(new SqlParameter("@userId", userId.Value));
            }
            if (!string.IsNullOrEmpty(module) && module != "all")
            {
                conditions.Add("module = @module");
                parameters.Add(new SqlParameter("@module", module));
            }
            if (!string.IsNullOrEmpty(method) && method != "all")
            {
                conditions.Add("http_method = @method");
                parameters.Add(new SqlParameter("@method", method));
            }
            if (status == "error")
            {
                conditions.Add("(response_status >= 400 OR error_message IS NOT NULL)");
            }
            else if (status == "success")
            {
                conditions.Add("(response_status < 400 AND error_message IS NULL)");
            }
            if (!string.IsNullOrEmpty(search))
            {
                conditions.Add("(url LIKE @search OR action LIKE @search OR request_payload LIKE @search OR response_payload LIKE @search OR user_name LIKE @search)");
                parameters.Add(new SqlParameter("@search", "%" + search + "%"));
            }

            string whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";
            int offset = (page - 1) * pageSize;

            string countQuery = $"SELECT COUNT(*) FROM [dbo].[sys_event_log] {whereClause};";
            // List query excludes the heavy payload + user-agent columns. Those are loaded
            // lazily via /events/{id} when a row is expanded — keeps the list response
            // tiny and the table fast even with thousands of rows.
            string dataQuery = $@"
                SELECT id, user_id, user_name, module, action, http_method, url,
                       response_status, error_message, duration_ms, ip_address, created_at,
                       CASE WHEN request_payload  IS NULL THEN 0 ELSE 1 END AS has_request,
                       CASE WHEN response_payload IS NULL THEN 0 ELSE 1 END AS has_response
                FROM [dbo].[sys_event_log]
                {whereClause}
                ORDER BY created_at DESC, id DESC
                OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;";

            int totalCount = 0;
            var tb = new DataTable();
            try
            {
                using (var con = new SqlConnection(_dbcon))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(countQuery, con))
                    {
                        foreach (var p in parameters) cmd.Parameters.Add(CloneParam(p));
                        totalCount = (int)cmd.ExecuteScalar();
                    }
                    using (var cmd = new SqlCommand(dataQuery, con))
                    {
                        foreach (var p in parameters) cmd.Parameters.Add(CloneParam(p));
                        cmd.Parameters.AddWithValue("@offset", offset);
                        cmd.Parameters.AddWithValue("@pageSize", pageSize);
                        using (var reader = cmd.ExecuteReader()) tb.Load(reader);
                    }
                }

                // Opportunistic cleanup.
                TryCleanupOld();

                var rows = new List<Dictionary<string, object>>();
                foreach (DataRow row in tb.Rows)
                {
                    var dict = new Dictionary<string, object>();
                    foreach (DataColumn col in tb.Columns)
                        dict[col.ColumnName] = row[col] == DBNull.Value ? null : row[col];
                    rows.Add(dict);
                }

                return Ok(new {
                    data = rows,
                    totalCount,
                    page,
                    pageSize,
                    retentionDays = RETENTION_DAYS
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to load events", details = ex.Message });
            }
        }

        // ============================================================
        // GET /api/SysRun/events/{id}
        // Returns a single event with its full request/response payloads.
        // Used by the UI when a row is expanded — keeps the list query light.
        // ============================================================
        [HttpGet("events/{id:long}")]
        public IActionResult EventDetail(long id)
        {
            try
            {
                using (var con = new SqlConnection(_dbcon))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(@"
                        SELECT request_payload, response_payload, error_message, user_agent
                        FROM [dbo].[sys_event_log]
                        WHERE id = @id;", con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        using (var reader = cmd.ExecuteReader())
                        {
                            if (!reader.Read()) return NotFound(new { message = "Event not found" });
                            return Ok(new
                            {
                                request_payload  = reader["request_payload"]  == DBNull.Value ? null : reader["request_payload"].ToString(),
                                response_payload = reader["response_payload"] == DBNull.Value ? null : reader["response_payload"].ToString(),
                                error_message    = reader["error_message"]    == DBNull.Value ? null : reader["error_message"].ToString(),
                                user_agent       = reader["user_agent"]       == DBNull.Value ? null : reader["user_agent"].ToString()
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to load event", details = ex.Message });
            }
        }

        // ============================================================
        // GET /api/SysRun/filters/users
        // Distinct user list that appears in the log.
        // ============================================================
        [HttpGet("filters/users")]
        public IActionResult FilterUsers()
        {
            var rows = new List<object>();
            try
            {
                using (var con = new SqlConnection(_dbcon))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(@"
                        SELECT DISTINCT user_id, user_name
                        FROM [dbo].[sys_event_log]
                        WHERE user_id IS NOT NULL
                        ORDER BY user_name;", con))
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            rows.Add(new {
                                userId = reader["user_id"] == DBNull.Value ? null : (int?)Convert.ToInt32(reader["user_id"]),
                                userName = reader["user_name"] == DBNull.Value ? null : reader["user_name"].ToString()
                            });
                        }
                    }
                }
            }
            catch { /* return empty list on error */ }
            return Ok(rows);
        }

        // ============================================================
        // GET /api/SysRun/filters/modules
        // Distinct module list that appears in the log.
        // ============================================================
        [HttpGet("filters/modules")]
        public IActionResult FilterModules()
        {
            var rows = new List<string>();
            try
            {
                using (var con = new SqlConnection(_dbcon))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(@"
                        SELECT DISTINCT module
                        FROM [dbo].[sys_event_log]
                        WHERE module IS NOT NULL AND module <> ''
                        ORDER BY module;", con))
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read()) rows.Add(reader["module"].ToString());
                    }
                }
            }
            catch { }
            return Ok(rows);
        }

        // ============================================================
        // Helpers
        // ============================================================
        private static string Truncate(string s, int max)
        {
            if (string.IsNullOrEmpty(s)) return s;
            return s.Length <= max ? s : s.Substring(0, max);
        }

        private static SqlParameter CloneParam(SqlParameter p)
        {
            return new SqlParameter(p.ParameterName, p.Value ?? DBNull.Value);
        }

        // Runs only once every 6 hours per app process. Deletes rows older than retention.
        private void TryCleanupOld()
        {
            if ((DateTime.UtcNow - _lastCleanup).TotalHours < 6) return;
            _lastCleanup = DateTime.UtcNow;
            try
            {
                using (var con = new SqlConnection(_dbcon))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(
                        "DELETE FROM [dbo].[sys_event_log] WHERE created_at < DATEADD(day, @days, SYSUTCDATETIME());", con))
                    {
                        cmd.Parameters.AddWithValue("@days", -RETENTION_DAYS);
                        cmd.ExecuteNonQuery();
                    }
                }
            }
            catch { }
        }
    }
}
