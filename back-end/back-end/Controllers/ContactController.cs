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
    public class ContactController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        string dbcon;
        DataTable tb;
        SqlConnection myCon;
        SqlCommand myCom;
        SqlDataReader myR;

        public ContactController(IConfiguration configuration)
        {
            _configuration = configuration;
            dbcon = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(dbcon);
        }

        [HttpGet, Route("contact")]
        public ActionResult getContact()
        {
            string query = @"select * from [dbo].[contact_reg] order by SysID desc;";
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

        [HttpGet, Route("contact/{id}")]
        public ActionResult getContactById(string id)
        {
            string query = @"select * from [dbo].[contact_reg] where SysID = @id;";
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
                return NotFound("Contact not found.");
            }
            return new OkObjectResult(tb);
        }

        [HttpPost, Route("contact")]
        public IActionResult CreateContact([FromBody] Contact contact)
        {
            string query = @"
            INSERT INTO [dbo].[contact_reg] 
            (name, email, phone, title, company, deals, deal_value, type, priority, comments)
            VALUES 
            (@name, @email, @phone, @title, @company, @deals, @deal_value, @type, @priority, @comments)";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@name", contact.name ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@email", contact.email ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@phone", contact.phone ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@title", contact.title ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@company", contact.company ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@deals", contact.deals ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@deal_value", contact.deal_value ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@type", contact.type ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@priority", contact.priority ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@comments", contact.comments ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Contact added successfully.");
        }

        [HttpPut, Route("contact")]
        public IActionResult UpdateContact([FromBody] Contact contact)
        {
            if (string.IsNullOrEmpty(contact.sysID))
                return BadRequest("Contact ID is required for update.");

            string query = @"
            UPDATE [dbo].[contact_reg] SET
                name = @name,
                email = @email,
                phone = @phone,
                title = @title,
                company = @company,
                deals = @deals,
                deal_value = @deal_value,
                type = @type,
                priority = @priority,
                comments = @comments
            WHERE SysID = @id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", contact.sysID);
                    myCom.Parameters.AddWithValue("@name", contact.name ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@email", contact.email ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@phone", contact.phone ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@title", contact.title ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@company", contact.company ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@deals", contact.deals ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@deal_value", contact.deal_value ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@type", contact.type ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@priority", contact.priority ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@comments", contact.comments ?? (object)DBNull.Value);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Contact not found.");
                }
                myCon.Close();
            }

            return Ok("Contact updated successfully.");
        }

        [HttpDelete, Route("contact/{id}")]
        public IActionResult DeleteContact(string id)
        {
            string query = @"DELETE FROM [dbo].[contact_reg] WHERE SysID = @id";

            using (myCon)
            {
                myCon.Open();
                using (myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);

                    int rowsAffected = myCom.ExecuteNonQuery();

                    if (rowsAffected == 0)
                        return NotFound("Contact not found.");
                }
                myCon.Close();
            }

            return Ok("Contact deleted successfully.");
        }
    }
}