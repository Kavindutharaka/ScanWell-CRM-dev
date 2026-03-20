using System;
using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using back_end.Models;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesTargetController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;

        public SalesTargetController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
        }

        // ====================================================================
        // FINANCIAL YEAR CONFIG
        // ====================================================================

        // GET: api/SalesTarget/config
        [HttpGet, Route("config")]
        public ActionResult GetConfig()
        {
            try
            {
                using (var con = new SqlConnection(_dbConnectionString))
                {
                    con.Open();
                    string query = "SELECT TOP 1 financial_year_start, updated_at, updated_by FROM [dbo].[sales_target_config] ORDER BY id;";
                    using (var cmd = new SqlCommand(query, con))
                    {
                        using (var reader = cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                return Ok(new
                                {
                                    financialYearStart = Convert.ToInt32(reader["financial_year_start"]),
                                    updatedAt = reader["updated_at"] == DBNull.Value ? null : reader["updated_at"].ToString(),
                                    updatedBy = reader["updated_by"] == DBNull.Value ? null : reader["updated_by"].ToString()
                                });
                            }
                        }
                    }
                }
                // No config row exists — return default
                return Ok(new { financialYearStart = 1, updatedAt = (string)null, updatedBy = (string)null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching config: {ex.Message}");
            }
        }

        // PUT: api/SalesTarget/config
        [HttpPut, Route("config")]
        public ActionResult UpdateConfig([FromBody] SalesTargetConfig config)
        {
            try
            {
                if (config.FinancialYearStart != 1 && config.FinancialYearStart != 4)
                    return BadRequest("Financial year start must be 1 (January) or 4 (April).");

                using (var con = new SqlConnection(_dbConnectionString))
                {
                    con.Open();
                    // Upsert: update if exists, insert if not
                    string query = @"
                        IF EXISTS (SELECT 1 FROM [dbo].[sales_target_config])
                            UPDATE [dbo].[sales_target_config]
                            SET financial_year_start = @fyStart, updated_at = GETDATE(), updated_by = @updatedBy
                            WHERE id = (SELECT TOP 1 id FROM [dbo].[sales_target_config]);
                        ELSE
                            INSERT INTO [dbo].[sales_target_config] (financial_year_start, updated_at, updated_by)
                            VALUES (@fyStart, GETDATE(), @updatedBy);";

                    using (var cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@fyStart", config.FinancialYearStart);
                        cmd.Parameters.AddWithValue("@updatedBy", string.IsNullOrEmpty(config.UpdatedBy) ? (object)DBNull.Value : config.UpdatedBy);
                        cmd.ExecuteNonQuery();
                    }
                }
                return Ok(new { message = "Financial year configuration saved." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error saving config: {ex.Message}");
            }
        }

        // ====================================================================
        // EMPLOYEE SALES TARGETS
        // ====================================================================

        // GET: api/SalesTarget/targets?year=2026
        [HttpGet, Route("targets")]
        public ActionResult GetAllTargets([FromQuery] int year)
        {
            try
            {
                string query = @"
                    SELECT t.id, t.employee_id, t.year,
                           t.jan_target, t.feb_target, t.mar_target, t.apr_target,
                           t.may_target, t.jun_target, t.jul_target, t.aug_target,
                           t.sep_target, t.oct_target, t.nov_target, t.dec_target,
                           t.annual_target, t.updated_at, t.updated_by,
                           e.fname, e.lname, e.position, e.department
                    FROM [dbo].[employee_sales_targets] t
                    LEFT JOIN [dbo].[emp_reg] e ON t.employee_id = CAST(e.SysID AS NVARCHAR(50))
                    WHERE t.year = @year
                    ORDER BY e.fname, e.lname;";

                DataTable tb = new DataTable();
                using (var con = new SqlConnection(_dbConnectionString))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@year", year);
                        using (var reader = cmd.ExecuteReader())
                        {
                            tb.Load(reader);
                        }
                    }
                }
                return Ok(tb);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching targets: {ex.Message}");
            }
        }

        // GET: api/SalesTarget/targets/{employeeId}?year=2026
        [HttpGet, Route("targets/{employeeId}")]
        public ActionResult GetEmployeeTarget(string employeeId, [FromQuery] int year)
        {
            try
            {
                string query = @"
                    SELECT t.*, e.fname, e.lname, e.position, e.department
                    FROM [dbo].[employee_sales_targets] t
                    LEFT JOIN [dbo].[emp_reg] e ON t.employee_id = CAST(e.SysID AS NVARCHAR(50))
                    WHERE t.employee_id = @empId AND t.year = @year;";

                DataTable tb = new DataTable();
                using (var con = new SqlConnection(_dbConnectionString))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@empId", employeeId);
                        cmd.Parameters.AddWithValue("@year", year);
                        using (var reader = cmd.ExecuteReader())
                        {
                            tb.Load(reader);
                        }
                    }
                }
                return Ok(tb);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching employee target: {ex.Message}");
            }
        }

        // POST: api/SalesTarget/targets (Upsert)
        [HttpPost, Route("targets")]
        public ActionResult SaveTarget([FromBody] EmployeeSalesTarget target)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(target.EmployeeId))
                    return BadRequest("Employee ID is required.");

                if (target.Year < 2000 || target.Year > 2100)
                    return BadRequest("Invalid year.");

                using (var con = new SqlConnection(_dbConnectionString))
                {
                    con.Open();
                    string query = @"
                        IF EXISTS (SELECT 1 FROM [dbo].[employee_sales_targets] WHERE employee_id = @empId AND year = @year)
                            UPDATE [dbo].[employee_sales_targets]
                            SET jan_target = @jan, feb_target = @feb, mar_target = @mar,
                                apr_target = @apr, may_target = @may, jun_target = @jun,
                                jul_target = @jul, aug_target = @aug, sep_target = @sep,
                                oct_target = @oct, nov_target = @nov, dec_target = @dec,
                                annual_target = @annual, updated_at = GETDATE(), updated_by = @updatedBy
                            WHERE employee_id = @empId AND year = @year;
                        ELSE
                            INSERT INTO [dbo].[employee_sales_targets]
                            (employee_id, year, jan_target, feb_target, mar_target, apr_target,
                             may_target, jun_target, jul_target, aug_target, sep_target,
                             oct_target, nov_target, dec_target, annual_target, created_at, updated_at, updated_by)
                            VALUES
                            (@empId, @year, @jan, @feb, @mar, @apr, @may, @jun,
                             @jul, @aug, @sep, @oct, @nov, @dec, @annual, GETDATE(), GETDATE(), @updatedBy);";

                    using (var cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@empId", target.EmployeeId);
                        cmd.Parameters.AddWithValue("@year", target.Year);
                        cmd.Parameters.AddWithValue("@jan", target.JanTarget);
                        cmd.Parameters.AddWithValue("@feb", target.FebTarget);
                        cmd.Parameters.AddWithValue("@mar", target.MarTarget);
                        cmd.Parameters.AddWithValue("@apr", target.AprTarget);
                        cmd.Parameters.AddWithValue("@may", target.MayTarget);
                        cmd.Parameters.AddWithValue("@jun", target.JunTarget);
                        cmd.Parameters.AddWithValue("@jul", target.JulTarget);
                        cmd.Parameters.AddWithValue("@aug", target.AugTarget);
                        cmd.Parameters.AddWithValue("@sep", target.SepTarget);
                        cmd.Parameters.AddWithValue("@oct", target.OctTarget);
                        cmd.Parameters.AddWithValue("@nov", target.NovTarget);
                        cmd.Parameters.AddWithValue("@dec", target.DecTarget);
                        cmd.Parameters.AddWithValue("@annual", target.AnnualTarget);
                        cmd.Parameters.AddWithValue("@updatedBy", string.IsNullOrEmpty(target.UpdatedBy) ? (object)DBNull.Value : target.UpdatedBy);

                        cmd.ExecuteNonQuery();
                    }
                }
                return Ok(new { message = "Sales target saved successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error saving target: {ex.Message}");
            }
        }

        // DELETE: api/SalesTarget/targets/{id}
        [HttpDelete, Route("targets/{id}")]
        public ActionResult DeleteTarget(int id)
        {
            try
            {
                using (var con = new SqlConnection(_dbConnectionString))
                {
                    con.Open();
                    string query = "DELETE FROM [dbo].[employee_sales_targets] WHERE id = @id;";
                    using (var cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound("Target not found.");
                    }
                }
                return Ok(new { message = "Target deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error deleting target: {ex.Message}");
            }
        }
    }
}
