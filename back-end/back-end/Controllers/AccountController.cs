using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        string dbcon;
        DataTable tb;
        SqlConnection myCon;
        SqlCommand myCom;
        SqlDataReader myR;

        public AccountController(IConfiguration configuration)
        {
            _configuration = configuration;
            dbcon = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(dbcon);
        }

        [HttpGet, Route("account")]
        public ActionResult getAccounts([FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] string search = "", [FromQuery] string accountType = "all", [FromQuery] string salesPerson = "all", [FromQuery] string location = "all")
        {
            int offset = (page - 1) * pageSize;

            var conditions = new List<string>();
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrWhiteSpace(search))
            {
                conditions.Add(@"(accountName LIKE @search
                    OR domain LIKE @search
                    OR fmsCode LIKE @search
                    OR industry LIKE @search
                    OR location LIKE @search
                    OR salesPerson LIKE @search
                    OR primaryContact LIKE @search
                    OR primaryEmail LIKE @search
                    OR accountType LIKE @search
                    OR description LIKE @search)");
                parameters.Add(new SqlParameter("@search", $"%{search}%"));
            }

            if (!string.IsNullOrEmpty(accountType) && accountType != "all")
            {
                var values = accountType.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (values.Length == 1)
                {
                    conditions.Add("accountType = @accountType");
                    parameters.Add(new SqlParameter("@accountType", values[0].Trim()));
                }
                else
                {
                    var paramNames = new List<string>();
                    for (int i = 0; i < values.Length; i++)
                    {
                        paramNames.Add($"@atp{i}");
                        parameters.Add(new SqlParameter($"@atp{i}", values[i].Trim()));
                    }
                    conditions.Add($"accountType IN ({string.Join(",", paramNames)})");
                }
            }

            if (!string.IsNullOrEmpty(salesPerson) && salesPerson != "all")
            {
                var values = salesPerson.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (values.Length == 1)
                {
                    conditions.Add("salesPerson = @salesPerson");
                    parameters.Add(new SqlParameter("@salesPerson", values[0].Trim()));
                }
                else
                {
                    var paramNames = new List<string>();
                    for (int i = 0; i < values.Length; i++)
                    {
                        paramNames.Add($"@sp{i}");
                        parameters.Add(new SqlParameter($"@sp{i}", values[i].Trim()));
                    }
                    conditions.Add($"salesPerson IN ({string.Join(",", paramNames)})");
                }
            }

            if (!string.IsNullOrEmpty(location) && location != "all")
            {
                var values = location.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (values.Length == 1)
                {
                    conditions.Add("location = @location");
                    parameters.Add(new SqlParameter("@location", values[0].Trim()));
                }
                else
                {
                    var paramNames = new List<string>();
                    for (int i = 0; i < values.Length; i++)
                    {
                        paramNames.Add($"@loc{i}");
                        parameters.Add(new SqlParameter($"@loc{i}", values[i].Trim()));
                    }
                    conditions.Add($"location IN ({string.Join(",", paramNames)})");
                }
            }

            string whereClause = conditions.Count > 0 ? " WHERE " + string.Join(" AND ", conditions) : "";
            string countQuery = $"SELECT COUNT(*) FROM [dbo].[account_reg]{whereClause};";
            string dataQuery = $@"SELECT * FROM [dbo].[account_reg]{whereClause}
                ORDER BY SysID DESC
                OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;";

            try
            {
                int totalCount = 0;
                tb = new DataTable();

                using (var con = new SqlConnection(dbcon))
                {
                    con.Open();

                    // Get total count
                    using (var cmd = new SqlCommand(countQuery, con))
                    {
                        foreach (var p in parameters) cmd.Parameters.Add(new SqlParameter(p.ParameterName, p.Value));
                        totalCount = (int)cmd.ExecuteScalar();
                    }

                    // Get paged data
                    using (var cmd = new SqlCommand(dataQuery, con))
                    {
                        foreach (var p in parameters) cmd.Parameters.Add(new SqlParameter(p.ParameterName, p.Value));
                        cmd.Parameters.AddWithValue("@offset", offset);
                        cmd.Parameters.AddWithValue("@pageSize", pageSize);

                        using (var reader = cmd.ExecuteReader())
                        {
                            tb.Load(reader);
                        }
                    }
                }

                return Ok(new
                {
                    data = tb,
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

        [HttpGet, Route("account/filter-options")]
        public ActionResult GetFilterOptions()
        {
            try
            {
                var accountTypes = new List<string>();
                var salesPersons = new List<string>();
                var locations = new List<string>();

                using (var con = new SqlConnection(dbcon))
                {
                    con.Open();

                    using (var cmd = new SqlCommand("SELECT DISTINCT accountType FROM [dbo].[account_reg] WHERE accountType IS NOT NULL AND accountType != '' ORDER BY accountType", con))
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read()) accountTypes.Add(reader.GetString(0));
                    }

                    using (var cmd = new SqlCommand("SELECT DISTINCT salesPerson FROM [dbo].[account_reg] WHERE salesPerson IS NOT NULL AND salesPerson != '' ORDER BY salesPerson", con))
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read()) salesPersons.Add(reader.GetString(0));
                    }

                    using (var cmd = new SqlCommand("SELECT DISTINCT location FROM [dbo].[account_reg] WHERE location IS NOT NULL AND location != '' ORDER BY location", con))
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read()) locations.Add(reader.GetString(0));
                    }
                }

                return Ok(new { accountTypes, salesPersons, locations });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpGet, Route("account-names")]
        public ActionResult GetAccountNames()
        {
            string query = @"SELECT [accountName] FROM [dbo].[account_reg] ORDER BY [SysID] DESC;";

            List<string> accountList = new List<string>();

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                using (myR = myCom.ExecuteReader())
                {
                    while (myR.Read())
                    {
                        accountList.Add(myR["accountName"].ToString());
                    }
                }
            }

            return new OkObjectResult(accountList);
        }

        [HttpPost, Route("account-address")]
        public ActionResult GetAccountAddressById([FromBody] dynamic body)
        {
            string accountName = body?.accountName;
            if (string.IsNullOrEmpty(accountName))
            {
                return BadRequest("accountName is required.");
            }

            string query = @"
                SELECT TOP 1 [description]
                FROM [phvtechc_crm].[dbo].[account_reg]
                WHERE accountName = @accountName;";

            string address = null;

            using (myCon)
            {
                myCon.Open();
                using (var myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@accountName", accountName);

                    using (var myR = myCom.ExecuteReader())
                    {
                        if (myR.Read())
                        {
                            address = myR["description"]?.ToString()?.Trim();
                        }
                    }
                }
            }

            if (address == null)
            {
                return NotFound();
            }

            return Ok(address);
        }

        [HttpPost, Route("account-contacts")]
        public ActionResult GetAccountContacts([FromBody] dynamic body)
        {
            string accountName = body?.accountName;
            if (string.IsNullOrEmpty(accountName))
            {
                return BadRequest("accountName is required.");
            }

            string query = @"
        SELECT TOP 1 [contactsJson]
        FROM [phvtechc_crm].[dbo].[account_reg]
        WHERE accountName = @accountName;";

            string contactsJson = null;

            using (myCon)
            {
                myCon.Open();
                using (var myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@accountName", accountName);

                    using (var myR = myCom.ExecuteReader())
                    {
                        if (myR.Read())
                        {
                            contactsJson = myR["contactsJson"]?.ToString()?.Trim();
                        }
                    }
                }
            }

            if (contactsJson == null)
            {
                return NotFound("Account not found.");
            }

            // Normalise empty/whitespace to "[]"
            if (string.IsNullOrWhiteSpace(contactsJson))
            {
                contactsJson = "[]";
            }

            // Validate that it is parseable JSON; if not, fall back to empty array
            try
            {
                JsonDocument.Parse(contactsJson);
                // Return the raw JSON string as the response body
                return Content(contactsJson, "application/json");
            }
            catch (JsonException)
            {
                return Content("[]", "application/json");
            }
        }



        [HttpGet, Route("account/{id}")]
        public ActionResult getAccountById(string id)
        {
            string query = @"select * from [dbo].[account_reg] where SysID = @id;";
            tb = new DataTable();
            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    myR = myCom.ExecuteReader();
                    tb.Load(myR);
                    myR.Close();
                    myCon.Close();
                }
            }
            if (tb.Rows.Count == 0)
            {
                return NotFound("Account not found.");
            }
            return new OkObjectResult(tb);
        }

        [HttpPost, Route("account")]
        public IActionResult CreateAccount([FromBody] Account account)
        {
            string query = @"
        INSERT INTO [dbo].[account_reg] 
        (accountName, domain, fmsCode, accountType, industry, tp, location, salesPerson,
         primaryContact, primaryEmail, primaryPosition, primaryMobile, description, contactsJson)
        VALUES 
        (@accountName, @domain, @fmsCode, @accountType, @industry, @tp, @location, @salesPerson,
         @primaryContact, @primaryEmail, @primaryPosition, @primaryMobile, @description, @contactsJson)";

            try
            {
                using (myCon)
                {
                    myCon.Open();
                    using (myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@accountName", account.accountName ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@domain", account.domain ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@fmsCode", account.fmsCode ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@accountType", account.accountType ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@industry", account.industry ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@tp", account.tp ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@location", account.location ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@salesPerson", account.salesPerson ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@primaryContact", account.primaryContact ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@primaryEmail", account.primaryEmail ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@primaryPosition", account.primaryPosition ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@primaryMobile", account.primaryMobile ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@description", account.description ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@contactsJson", account.contactsJson ?? "[]");

                        myCom.ExecuteNonQuery();
                    }
                }
                return Ok(new { message = "Account created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpPut, Route("account")]
        public IActionResult UpdateAccount([FromBody] Account account)
        {
            if (string.IsNullOrEmpty(account.sysID))
                return BadRequest("sysID is required.");

            string query = @"
        UPDATE [dbo].[account_reg] SET
            accountName = @accountName,
            domain = @domain,
            fmsCode = @fmsCode,
            accountType = @accountType,
            industry = @industry,
            tp = @tp,
            location = @location,
            salesPerson = @salesPerson,
            primaryContact = @primaryContact,
            primaryEmail = @primaryEmail,
            primaryPosition = @primaryPosition,
            primaryMobile = @primaryMobile,
            description = @description,
            contactsJson = @contactsJson
        WHERE SysID = @sysID";

            try
            {
                using (myCon)
                {
                    myCon.Open();
                    using (myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@sysID", account.sysID);
                        myCom.Parameters.AddWithValue("@accountName", account.accountName ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@domain", account.domain ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@fmsCode", account.fmsCode ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@accountType", account.accountType ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@industry", account.industry ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@tp", account.tp ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@location", account.location ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@salesPerson", account.salesPerson ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@primaryContact", account.primaryContact ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@primaryEmail", account.primaryEmail ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@primaryPosition", account.primaryPosition ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@primaryMobile", account.primaryMobile ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@description", account.description ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@contactsJson", account.contactsJson ?? "[]");

                        int rows = myCom.ExecuteNonQuery();
                        if (rows == 0) return NotFound("Account not found.");
                    }
                }
                return Ok(new { message = "Account updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpDelete, Route("account/{id}")]
        public IActionResult DeleteAccount(string id)
        {
            string query = @"DELETE FROM [dbo].[account_reg] WHERE SysID = @id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Account not found.");
                }
                myCon.Close();
            }

            return Ok("Account deleted successfully.");
        }
    }
}