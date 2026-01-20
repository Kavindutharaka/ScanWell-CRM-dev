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
        public ActionResult getAccounts()
        {
            string query = @"SELECT TOP 20 * FROM [dbo].[account_reg] ORDER BY SysID DESC;";
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

            // Return the contacts JSON string
            // If it's empty or null, return empty array
            if (string.IsNullOrWhiteSpace(contactsJson) || contactsJson == "[]")
            {
                return Ok("[]");
            }

            return Ok(contactsJson);
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