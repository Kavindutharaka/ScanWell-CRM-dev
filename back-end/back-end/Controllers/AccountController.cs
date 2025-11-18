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
            string query = @"select * from [dbo].[account_reg] order by SysID desc;";
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
            (accountName, domain, industry, description, numberOfEmployees, headquartersLocation, contacts, deals)
            VALUES 
            (@accountName, @domain, @industry, @description, @numberOfEmployees, @headquartersLocation, @contacts, @deals)";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@accountName", account.accountName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@domain", account.domain ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@industry", account.industry ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@description", account.description ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@numberOfEmployees", account.numberOfEmployees ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@headquartersLocation", account.headquartersLocation ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@contacts", account.contacts ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@deals", account.deals ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Account added successfully.");
        }

        [HttpPut, Route("account")]
        public IActionResult UpdateAccount([FromBody] Account account)
        {
            if (string.IsNullOrEmpty(account.sysID))
                return BadRequest("Account ID is required for update.");

            string query = @"
            UPDATE [dbo].[account_reg] SET
                accountName = @accountName,
                domain = @domain,
                industry = @industry,
                description = @description,
                numberOfEmployees = @numberOfEmployees,
                headquartersLocation = @headquartersLocation,
                contacts = @contacts,
                deals = @deals
            WHERE SysID = @id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", account.sysID);
                    myCom.Parameters.AddWithValue("@accountName", account.accountName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@domain", account.domain ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@industry", account.industry ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@description", account.description ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@numberOfEmployees", account.numberOfEmployees ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@headquartersLocation", account.headquartersLocation ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@contacts", account.contacts ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@deals", account.deals ?? (object)DBNull.Value);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Account not found.");
                }
                myCon.Close();
            }

            return Ok("Account updated successfully.");
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