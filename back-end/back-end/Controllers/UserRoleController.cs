// Controllers/UserRoleController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using back_end.Models;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserRoleController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        string dbcon;
        DataTable tb;
        SqlConnection myCon;
        SqlCommand myCom;
        SqlDataReader myR;

        public UserRoleController(IConfiguration configuration)
        {
            _configuration = configuration;
            dbcon = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(dbcon);
        }

        // GET: api/userrole/user-roles
        [HttpGet("user-roles")]
        public ActionResult GetAll()
        {
            string query = @"
        SELECT 
            ur.*,
            ISNULL(e.fname + ' ' + e.lname, 'Unknown Employee') AS EmployeeName,
            ISNULL(e.SysID, '') AS EmployeeCode
        FROM [dbo].[user_roles] ur
        LEFT JOIN [dbo].[emp_reg] e ON ur.EmployeeId = CAST(e.SysID AS NVARCHAR(50))
        ORDER BY ur.Id DESC";

            var tb = new DataTable();

            using (myCon)
            {
                myCon.Open();
                using (var myCom = new SqlCommand(query, myCon))
                {
                    var myR = myCom.ExecuteReader();
                    tb.Load(myR);
                }
            }

            // Hide password from response
            foreach (DataRow row in tb.Rows)
                row["Password"] = "";

            return Ok(tb);
        }

        [HttpGet("employee-details/{id}")]
        public ActionResult GetUserByRoleId(int id)
        {
            string query = @"EXEC [dbo].[sp_getEmployeesByRoleId] @RoleId = @RoleId;";

            DataTable tb = new DataTable();

            using (myCon)
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@RoleId", id);

                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        tb.Load(myR);
                    }
                }
            }

            return Ok(tb);
        }

        // GET: api/userrole/user-roles/5
        [HttpGet("user-roles/{id}")]
        public ActionResult GetById(int id)
        {
            string query = @"
        SELECT 
            ur.*,
            ISNULL(e.fname + ' ' + e.lname, 'Unknown Employee') AS EmployeeName,
            ISNULL(e.SysID, '') AS EmployeeCode
        FROM [dbo].[user_roles] ur
        LEFT JOIN [dbo].[emp_reg] e ON ur.EmployeeId = CAST(e.SysID AS NVARCHAR(50))
        WHERE ur.Id = @id";

            var tb = new DataTable();

            using (myCon)
            {
                myCon.Open();
                using (var myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    var myR = myCom.ExecuteReader();
                    tb.Load(myR);
                }
            }

            if (tb.Rows.Count == 0) return NotFound("User role not found.");
            tb.Rows[0]["Password"] = "";
            return Ok(tb);
        }

        // POST: api/userrole/user-roles
        [HttpPost("user-roles")]
        public IActionResult Create([FromBody] UserRole role)
        {
            if (string.IsNullOrWhiteSpace(role.Password))
                return BadRequest(new { message = "Password is required." });
            if (string.IsNullOrWhiteSpace(role.Username))
                return BadRequest(new { message = "Username is required." });

            try
            {
                using (var con = new SqlConnection(dbcon))
                {
                    con.Open();

                    // Reject duplicate username up front so the client gets a clear message
                    // instead of a generic 500 from a unique-index / constraint violation.
                    using (var checkCmd = new SqlCommand(
                        "SELECT COUNT(*) FROM [dbo].[user_roles] WHERE Username = @Username;", con))
                    {
                        checkCmd.Parameters.AddWithValue("@Username", role.Username);
                        int existing = Convert.ToInt32(checkCmd.ExecuteScalar());
                        if (existing > 0)
                        {
                            return Conflict(new
                            {
                                message = $"Username '{role.Username}' already exists. Please choose a different username."
                            });
                        }
                    }

                    string query = @"
                        INSERT INTO [dbo].[user_roles] (
                            EmployeeId, Username, Password, IsAdmin, IsActive,
                            RateManageView, RateManageAdd, RateManageEdit,
                            UsefulLinksView, UsefulLinksAdd, UsefulLinksEdit,
                            SalesPlanView, SalesPlanAdd, SalesPlanEdit,
                            QuotesView, QuotesAdd, QuotesEdit,
                            RfqView, RfqAdd, RfqEdit,
                            ContactView, ContactAdd, ContactEdit,
                            AccountView, AccountAdd, AccountEdit,
                            SystemManagementView, SystemManagementAdd, SystemManagementEdit
                        ) VALUES (
                            @EmployeeId, @Username, @Password, @IsAdmin, @IsActive,
                            @RateManageView, @RateManageAdd, @RateManageEdit,
                            @UsefulLinksView, @UsefulLinksAdd, @UsefulLinksEdit,
                            @SalesPlanView, @SalesPlanAdd, @SalesPlanEdit,
                            @QuotesView, @QuotesAdd, @QuotesEdit,
                            @RfqView, @RfqAdd, @RfqEdit,
                            @ContactView, @ContactAdd, @ContactEdit,
                            @AccountView, @AccountAdd, @AccountEdit,
                            @SystemManagementView, @SystemManagementAdd, @SystemManagementEdit
                        )";

                    using (var insertCmd = new SqlCommand(query, con))
                    {
                        AddAllParameters(insertCmd, role);
                        insertCmd.ExecuteNonQuery();
                    }
                }

                return Ok(new { message = "User role created successfully." });
            }
            catch (SqlException ex)
            {
                // Catch any DB-level uniqueness or constraint error as a last-resort guard
                // so the client still sees something readable instead of a raw 500.
                Console.Error.WriteLine($"[UserRole.Create] SQL error: {ex.Message}");
                if (ex.Number == 2627 || ex.Number == 2601) // unique constraint violations
                {
                    return Conflict(new { message = $"Username '{role.Username}' already exists." });
                }
                return StatusCode(500, new { message = "Database error while creating user role." });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[UserRole.Create] Error: {ex.Message}");
                return StatusCode(500, new { message = "Failed to create user role." });
            }
        }

        // PUT: api/userrole/user-roles/5
        [HttpPut("user-roles/{id}")]
        public IActionResult Update(int id, [FromBody] UserRole role)
        {
            if (string.IsNullOrWhiteSpace(role.Username))
                return BadRequest(new { message = "Username is required." });

            // Block username collisions with OTHER users (excluding this user's own row).
            try
            {
                using (var con = new SqlConnection(dbcon))
                {
                    con.Open();
                    using (var checkCmd = new SqlCommand(
                        "SELECT COUNT(*) FROM [dbo].[user_roles] WHERE Username = @Username AND Id <> @Id;", con))
                    {
                        checkCmd.Parameters.AddWithValue("@Username", role.Username);
                        checkCmd.Parameters.AddWithValue("@Id", id);
                        int existing = Convert.ToInt32(checkCmd.ExecuteScalar());
                        if (existing > 0)
                        {
                            return Conflict(new
                            {
                                message = $"Username '{role.Username}' is already used by another user."
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[UserRole.Update] Username check failed: {ex.Message}");
                return StatusCode(500, new { message = "Database error while validating username." });
            }

            var updateFields = new List<string> { "UpdatedAt = GETDATE()" };
            var cmd = new SqlCommand();
            cmd.Parameters.AddWithValue("@Id", id);

            // Only update password if provided
            if (!string.IsNullOrWhiteSpace(role.Password))
            {
                updateFields.Add("Password = @Password");
                cmd.Parameters.AddWithValue("@Password", role.Password);
            }

            updateFields.Add("EmployeeId = @EmployeeId");
            updateFields.Add("Username = @Username");
            updateFields.Add("IsAdmin = @IsAdmin");
            updateFields.Add("IsActive = @IsActive");

            cmd.Parameters.AddWithValue("@EmployeeId", role.EmployeeId);
            cmd.Parameters.AddWithValue("@Username", role.Username);
            cmd.Parameters.AddWithValue("@IsAdmin", role.IsAdmin);
            cmd.Parameters.AddWithValue("@IsActive", role.IsActive);

            // Add all permissions
            AddPermissionParams(cmd, updateFields, "RateManage", role);
            AddPermissionParams(cmd, updateFields, "UsefulLinks", role);
            AddPermissionParams(cmd, updateFields, "SalesPlan", role);
            AddPermissionParams(cmd, updateFields, "Quotes", role);
            AddPermissionParams(cmd, updateFields, "Rfq", role);
            AddPermissionParams(cmd, updateFields, "Contact", role);
            AddPermissionParams(cmd, updateFields, "Account", role);
            AddPermissionParams(cmd, updateFields, "SystemManagement", role);

            string query = $"UPDATE [dbo].[user_roles] SET {string.Join(", ", updateFields)} WHERE Id = @Id";

            try
            {
                using (myCon)
                {
                    myCon.Open();
                    cmd.CommandText = query;
                    cmd.Connection = myCon;

                    int rows = cmd.ExecuteNonQuery();
                    if (rows == 0) return NotFound(new { message = "User not found." });
                }
                return Ok(new { message = "User role updated successfully." });
            }
            catch (SqlException ex)
            {
                Console.Error.WriteLine($"[UserRole.Update] SQL error: {ex.Message}");
                if (ex.Number == 2627 || ex.Number == 2601)
                {
                    return Conflict(new { message = $"Username '{role.Username}' already exists." });
                }
                return StatusCode(500, new { message = "Database error while updating user role." });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[UserRole.Update] Error: {ex.Message}");
                return StatusCode(500, new { message = "Failed to update user role." });
            }
        }

        private void AddAllParameters(SqlCommand cmd, UserRole r)
        {
            cmd.Parameters.AddWithValue("@EmployeeId", r.EmployeeId);
            cmd.Parameters.AddWithValue("@Username", r.Username);
            cmd.Parameters.AddWithValue("@Password", r.Password);
            cmd.Parameters.AddWithValue("@IsAdmin", r.IsAdmin);
            cmd.Parameters.AddWithValue("@IsActive", r.IsActive);

            // Permissions
            cmd.Parameters.AddWithValue("@RateManageView", r.RateManageView);
            cmd.Parameters.AddWithValue("@RateManageAdd", r.RateManageAdd);
            cmd.Parameters.AddWithValue("@RateManageEdit", r.RateManageEdit);

            cmd.Parameters.AddWithValue("@UsefulLinksView", r.UsefulLinksView);
            cmd.Parameters.AddWithValue("@UsefulLinksAdd", r.UsefulLinksAdd);
            cmd.Parameters.AddWithValue("@UsefulLinksEdit", r.UsefulLinksEdit);

            cmd.Parameters.AddWithValue("@SalesPlanView", r.SalesPlanView);
            cmd.Parameters.AddWithValue("@SalesPlanAdd", r.SalesPlanAdd);
            cmd.Parameters.AddWithValue("@SalesPlanEdit", r.SalesPlanEdit);

            cmd.Parameters.AddWithValue("@QuotesView", r.QuotesView);
            cmd.Parameters.AddWithValue("@QuotesAdd", r.QuotesAdd);
            cmd.Parameters.AddWithValue("@QuotesEdit", r.QuotesEdit);

            cmd.Parameters.AddWithValue("@RfqView", r.RfqView);
            cmd.Parameters.AddWithValue("@RfqAdd", r.RfqAdd);
            cmd.Parameters.AddWithValue("@RfqEdit", r.RfqEdit);

            cmd.Parameters.AddWithValue("@ContactView", r.ContactView);
            cmd.Parameters.AddWithValue("@ContactAdd", r.ContactAdd);
            cmd.Parameters.AddWithValue("@ContactEdit", r.ContactEdit);

            cmd.Parameters.AddWithValue("@AccountView", r.AccountView);
            cmd.Parameters.AddWithValue("@AccountAdd", r.AccountAdd);
            cmd.Parameters.AddWithValue("@AccountEdit", r.AccountEdit);

            cmd.Parameters.AddWithValue("@SystemManagementView", r.SystemManagementView);
            cmd.Parameters.AddWithValue("@SystemManagementAdd", r.SystemManagementAdd);
            cmd.Parameters.AddWithValue("@SystemManagementEdit", r.SystemManagementEdit);
        }

        private void AddPermissionParams(SqlCommand cmd, List<string> fields, string prefix, UserRole r)
        {
            var view = (bool)typeof(UserRole).GetProperty(prefix + "View")!.GetValue(r)!;
            var add = (bool)typeof(UserRole).GetProperty(prefix + "Add")!.GetValue(r)!;
            var edit = (bool)typeof(UserRole).GetProperty(prefix + "Edit")!.GetValue(r)!;

            cmd.Parameters.AddWithValue($"@{prefix}View", view);
            cmd.Parameters.AddWithValue($"@{prefix}Add", add);
            cmd.Parameters.AddWithValue($"@{prefix}Edit", edit);

            fields.Add($"{prefix}View = @{prefix}View");
            fields.Add($"{prefix}Add = @{prefix}Add");
            fields.Add($"{prefix}Edit = @{prefix}Edit");
        }
    }
}