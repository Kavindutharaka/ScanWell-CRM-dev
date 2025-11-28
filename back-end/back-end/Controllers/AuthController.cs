using System;
using System.Collections.Generic;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        string dbcon;
        DataTable tb = new DataTable();
        SqlConnection myCon;
        SqlCommand myCom;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
            dbcon = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(dbcon);
        }

        // GET ALL USERS → /api/Auth/info
        [HttpGet("info")]
        public IActionResult GetAllActiveUsers()
        {
            string query = @"SELECT * FROM [dbo].[user_roles] WHERE IsActive = 1 ORDER BY Username";

            tb = new DataTable();

            try
            {
                using (myCon)
                {
                    myCon.Open();
                    using (myCom = new SqlCommand(query, myCon))
                    {
                        using (var reader = myCom.ExecuteReader())
                        {
                            tb.Load(reader);
                        }
                    }
                }

                if (tb.Rows.Count == 0)
                    return Ok(new object[0]);

                var users = new List<object>();
                foreach (DataRow row in tb.Rows)
                {
                    var user = new Dictionary<string, object>();
                    foreach (DataColumn col in tb.Columns)
                    {
                        user[col.ColumnName] = row[col] == DBNull.Value ? null : row[col];
                    }
                    users.Add(user);
                }

                return Ok(users);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Server error" });
            }
        }

        // GET ONE USER BY ID → /api/Auth/info/3
        // [HttpGet("info/{id:int}")]
        // public IActionResult GetUserByEmployeeId(int id)
        // {
        //     if (id <= 0)
        //         return BadRequest(new { message = "Invalid EmployeeId" });

        //     string query = @"SELECT Username, Password FROM [dbo].[user_roles] 
        //                     WHERE EmployeeId = @id AND IsActive = 1";

        //     tb = new DataTable();

        //     try
        //     {
        //         using (myCon)
        //         {
        //             myCon.Open();
        //             using (myCom = new SqlCommand(query, myCon))
        //             {
        //                 myCom.Parameters.AddWithValue("@id", id);

        //                 using (var reader = myCom.ExecuteReader())
        //                 {
        //                     tb.Load(reader);
        //                 }
        //             }
        //         }

        //         if (tb.Rows.Count == 0)
        //             return NotFound(new { message = "User not found or inactive" });

        //         var row = tb.Rows[0];

        //         return Ok(new
        //         {
        //             username = row["Username"].ToString(),
        //             password = row["Password"].ToString() // Plain text as stored
        //         });
        //     }
        //     catch (Exception)
        //     {
        //         return StatusCode(500, new { message = "Server error" });
        //     }
        // }

        // GET SINGLE USER BY ROLE ID → /api/Auth/info/3
[HttpGet("info/{id:int}")]
public IActionResult GetUserById(int id)
{
    if (id <= 0)
        return BadRequest("Invalid ID");

    string query = @"SELECT * FROM [dbo].[user_roles] WHERE Id = @id AND IsActive = 1";

    tb = new DataTable();

    try
    {
        using (myCon)
        {
            myCon.Open();
            using (myCom = new SqlCommand(query, myCon))
            {
                myCom.Parameters.AddWithValue("@id", id);

                using (var reader = myCom.ExecuteReader())
                {
                    tb.Load(reader);
                }
            }
        }

        if (tb.Rows.Count == 0)
            return NotFound("User role not found");

        var row = tb.Rows[0];
        var user = new Dictionary<string, object>();
        foreach (DataColumn col in tb.Columns)
        {
            user[col.ColumnName] = row[col] == DBNull.Value ? null : row[col];
        }

        return Ok(user);
    }
    catch (Exception)
    {
        return StatusCode(500, "Server error");
    }
}

        [HttpGet("get-user/{id:int}")]
        public IActionResult getUserDetails(int id)
        {
            string query = @"
        SELECT 
            ur.EmployeeId,
            er.SysID,
            er.fname,
            er.lname,
            er.email,
            er.tp,
            er.position,
            er.department,
            er.w_location,
            er.a_manager,
            er.note,
            er.status,
            ur.Username,
            ur.Password
        FROM phvtechc_crm.dbo.user_roles ur
        INNER JOIN phvtechc_crm.dbo.emp_reg er
            ON ur.EmployeeId = er.SysID
        WHERE ur.EmployeeId = @id;
    ";

            tb = new DataTable();

            try
            {
                using (myCon)
                {
                    myCon.Open();
                    using (myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@id", id);

                        using (var reader = myCom.ExecuteReader())
                        {
                            tb.Load(reader);
                        }
                    }
                }

                if (tb.Rows.Count == 0)
                    return NotFound(new { message = "User not found" });

                var row = tb.Rows[0];

                return Ok(row);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Server error" });
            }
        }


        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginModel login)
        {
            if (string.IsNullOrEmpty(login.username) || string.IsNullOrEmpty(login.password))
            {
                return BadRequest("Username and password are required.");
            }

            string query = @"SELECT Id, Username FROM [dbo].[user_roles] 
                             WHERE Username = @username AND Password = @password AND IsActive = 1;";

            int userRoleId = 0;
            string username = string.Empty;

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@username", login.username);
                    myCom.Parameters.AddWithValue("@password", login.password);

                    using (var reader = myCom.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            userRoleId = Convert.ToInt32(reader["Id"]);
                            username = reader["Username"].ToString();
                        }
                        else
                        {
                            return Unauthorized("Invalid username or password.");
                        }
                    }
                }
            }

            var secretKey = _configuration["Jwt:Key"];
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];
            var expireMinutes = int.Parse(_configuration["Jwt:ExpireMinutes"] ?? "120");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, username),
                new Claim("user_role_id", userRoleId.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.Now.AddMinutes(expireMinutes),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            Response.Cookies.Append("authToken", tokenString, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.Now.AddHours(8)
            });

            return Ok(new { success = true, id = userRoleId, username });
        }

        [HttpGet("me")]
        public IActionResult Me()
        {
            var token = Request.Cookies["authToken"];

            if (string.IsNullOrEmpty(token))
                return Unauthorized("No token found");

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidAudience = _configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key)
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;

                var userRoleId = jwtToken.Claims.FirstOrDefault(x => x.Type == "user_role_id")?.Value;
                var username = jwtToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Name)?.Value;

                return Ok(new
                {
                    id = int.Parse(userRoleId!),
                    username = username
                });
            }
            catch (Exception ex)
            {
                return Unauthorized($"Invalid token: {ex.Message}");
            }
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("authToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = "/"
            });

            return Ok(new { message = "Logged out successfully" });
        }
    }
}