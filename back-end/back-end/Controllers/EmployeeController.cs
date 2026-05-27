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
    public class EmployeeController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        string dbcon;
        DataTable tb;
        SqlConnection myCon;
        SqlCommand myCom;
        SqlDataReader myR;

        public EmployeeController(IConfiguration configuration)
        {
            _configuration = configuration;
            dbcon = _configuration.GetSection("DBCon").Value;
            //myCon = new SqlConnection(dbcon);
            myCon = new SqlConnection(dbcon);
        }

        [HttpGet, Route("emp")]
        public ActionResult getEmp()
        {
            string query = @"select * from [dbo].[emp_reg] order by SysID desc;";
            tb = new DataTable();
            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myR = myCom.ExecuteReader();
                    tb.Load(myR);
                    myR.Close();
                    myCon.Close();
                }
                return new OkObjectResult(tb);
            }
        }

        [HttpPost, Route("emp")]
        public IActionResult CreateEmp([FromBody] Employee emp)
        {
            string query = @"
            INSERT INTO [dbo].[emp_reg] 
            ([fname], [lname], [email], [tp], [position], [department], [w_location], [a_manager], [note], [status])
            VALUES 
            (@fname, @lname, @email, @tp, @position, @department, @w_location, @a_manager, @note, @status)";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@fname", emp.fname ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@lname", emp.lname ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@email", emp.email ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@tp", emp.tp ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@position", emp.position ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@department", emp.department ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@w_location", emp.w_location ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@a_manager", emp.a_manager ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@note", emp.note ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@status", emp.status ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Employee added successfully.");
        }

        [HttpPut, Route("emp")]
        public IActionResult UpdateEmp([FromBody] Employee emp)
        {
            if (string.IsNullOrEmpty(emp.sysID))
                return BadRequest("Employee ID is required for update.");

            string query = @"
            UPDATE [dbo].[emp_reg] SET
                [fname] = @fname,
                [lname] = @lname,
                [email] = @email,
                [tp] = @tp,
                [position] = @position,
                [department] = @department,
                [w_location] = @w_location,
                [a_manager] = @a_manager,
                [note] = @note,
                [status] = @status
            WHERE SysID = @e_id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@e_id", emp.sysID);
                    myCom.Parameters.AddWithValue("@fname", emp.fname ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@lname", emp.lname ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@email", emp.email ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@tp", emp.tp ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@position", emp.position ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@department", emp.department ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@w_location", emp.w_location ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@a_manager", emp.a_manager ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@note", emp.note ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@status", emp.status ?? (object)DBNull.Value);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Employee not found.");
                }
                myCon.Close();
            }

            return Ok("Employee updated successfully.");
        }

        // ============================================================
        // GET /api/Employee/online-now
        // Returns employees who made any API call in the last 5 minutes.
        // Source of truth: sys_event_log (populated by the silent axios interceptor).
        // No new tables, no heartbeat — every authenticated request is already
        // logged with user_id + created_at, so we just query the recent window.
        // ============================================================
        [HttpGet("online-now")]
        public IActionResult OnlineNow()
        {
            try
            {
                var rows = new List<object>();
                using (var con = new SqlConnection(dbcon))
                {
                    con.Open();
                    string query = @"
                        SELECT TOP 50
                            sel.user_id,
                            MAX(sel.user_name)             AS user_name,
                            MAX(CAST(er.SysID AS INT))     AS emp_id,
                            MAX(er.fname)                  AS fname,
                            MAX(er.lname)                  AS lname,
                            MAX(er.profile_image)          AS profile_image,
                            MAX(sel.created_at)            AS last_seen
                        FROM [dbo].[sys_event_log] sel
                        LEFT JOIN [dbo].[user_roles] ur
                            ON sel.user_id = ur.Id
                        LEFT JOIN [dbo].[emp_reg] er
                            ON ur.EmployeeId = CAST(er.SysID AS NVARCHAR(50))
                        WHERE sel.created_at >= DATEADD(MINUTE, -5, SYSUTCDATETIME())
                          AND sel.user_id IS NOT NULL
                        GROUP BY sel.user_id
                        ORDER BY MAX(sel.created_at) DESC;";

                    using (var cmd = new SqlCommand(query, con))
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            rows.Add(new
                            {
                                userId        = reader["user_id"]       == DBNull.Value ? (int?)null : Convert.ToInt32(reader["user_id"]),
                                userName      = reader["user_name"]     == DBNull.Value ? null : reader["user_name"].ToString(),
                                empId         = reader["emp_id"]        == DBNull.Value ? (int?)null : Convert.ToInt32(reader["emp_id"]),
                                fname         = reader["fname"]         == DBNull.Value ? null : reader["fname"].ToString(),
                                lname         = reader["lname"]         == DBNull.Value ? null : reader["lname"].ToString(),
                                profile_image = reader["profile_image"] == DBNull.Value ? null : reader["profile_image"].ToString(),
                                lastSeen      = reader["last_seen"]     == DBNull.Value ? (DateTime?)null
                                                : DateTime.SpecifyKind(Convert.ToDateTime(reader["last_seen"]), DateTimeKind.Utc)
                            });
                        }
                    }
                }
                return Ok(rows);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[Employee.OnlineNow] {ex.Message}");
                return StatusCode(500, new { message = "Failed to load online users" });
            }
        }

    }
}