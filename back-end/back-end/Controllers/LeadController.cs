using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeadController : ControllerBase
    {
        private readonly string _dbConnectionString;

        public LeadController(IConfiguration configuration)
        {
            _dbConnectionString = configuration.GetSection("DBCon").Value;
        }

        [HttpGet]
        public ActionResult GetLeads()
        {
            string query = @"SELECT * FROM leads ORDER BY id DESC";

            DataTable table = new DataTable();
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        table.Load(myR);
                    }
                }
                myCon.Close();
            }

            var leads = new List<Lead>();
            foreach (DataRow row in table.Rows)
            {
                leads.Add(MapRowToLead(row));
            }

            return Ok(leads);
        }

        [HttpGet("{id}")]
        public ActionResult GetLeadById(long id)
        {
            string query = @"SELECT * FROM leads WHERE id = @id";

            DataTable table = new DataTable();
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    using (SqlDataReader myR = myCom.ExecuteReader())
                    {
                        table.Load(myR);
                    }
                }
                myCon.Close();
            }

            if (table.Rows.Count == 0)
                return NotFound("Lead not found.");

            return Ok(MapRowToLead(table.Rows[0]));
        }

        [HttpPut("{id}")]
        public IActionResult UpdateLead(long id, [FromBody] Lead lead)
        {
            string query = @"
                UPDATE leads SET
                    created_time = @created_time,
                    full_name = @full_name,
                    email = @email,
                    phone_number = @phone_number,
                    ad_name = @ad_name,
                    form_name = @form_name
                WHERE id = @id";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    myCom.Parameters.AddWithValue("@created_time", lead.CreatedTime ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@full_name", lead.FullName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@email", lead.Email ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@phone_number", lead.PhoneNumber ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@ad_name", lead.AdName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@form_name", lead.FormName ?? (object)DBNull.Value);

                    int rowsAffected = myCom.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound("Lead not found.");
                }
                myCon.Close();
            }

            return Ok("Lead updated successfully.");
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteLead(long id)
        {
            string query = "DELETE FROM leads WHERE id = @id";
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    int rowsAffected = myCom.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound("Lead not found.");
                }
                myCon.Close();
            }

            return Ok("Lead deleted successfully.");
        }

        [HttpPost("bulk-create")]
        public ActionResult BulkCreateLeads([FromBody] List<Lead> leads)
        {
            if (leads == null || leads.Count == 0)
                return BadRequest("No leads provided.");

            string query = @"
                INSERT INTO leads
                (created_time, full_name, email, phone_number, ad_name, form_name, imported_at)
                VALUES
                (@created_time, @full_name, @email, @phone_number, @ad_name, @form_name, GETDATE())";

            int insertedCount = 0;
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                foreach (var lead in leads)
                {
                    using (SqlCommand myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@created_time", lead.CreatedTime ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@full_name", lead.FullName ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@email", lead.Email ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@phone_number", lead.PhoneNumber ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@ad_name", lead.AdName ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@form_name", lead.FormName ?? (object)DBNull.Value);

                        myCom.ExecuteNonQuery();
                        insertedCount++;
                    }
                }
                myCon.Close();
            }

            return Ok(new { message = $"{insertedCount} lead(s) imported successfully.", count = insertedCount });
        }

        [HttpPost("bulk-delete")]
        public IActionResult BulkDeleteLeads([FromBody] BulkDeleteRequest request)
        {
            if (request.Ids == null || request.Ids.Count == 0)
                return BadRequest("No lead IDs provided.");

            // Use parameterized query for safety
            var paramNames = new List<string>();
            for (int i = 0; i < request.Ids.Count; i++)
            {
                paramNames.Add($"@id{i}");
            }
            string query = $"DELETE FROM leads WHERE id IN ({string.Join(",", paramNames)})";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    for (int i = 0; i < request.Ids.Count; i++)
                    {
                        myCom.Parameters.AddWithValue($"@id{i}", request.Ids[i]);
                    }
                    int rowsAffected = myCom.ExecuteNonQuery();
                    return Ok(new { message = $"{rowsAffected} lead(s) deleted successfully.", count = rowsAffected });
                }
            }
        }

        private Lead MapRowToLead(DataRow row)
        {
            return new Lead
            {
                Id = Convert.ToInt64(row["id"]),
                CreatedTime = row["created_time"] != DBNull.Value ? (DateTime?)Convert.ToDateTime(row["created_time"]) : null,
                FullName = row["full_name"] != DBNull.Value ? row["full_name"].ToString() : null,
                Email = row["email"] != DBNull.Value ? row["email"].ToString() : null,
                PhoneNumber = row["phone_number"] != DBNull.Value ? row["phone_number"].ToString() : null,
                AdName = row["ad_name"] != DBNull.Value ? row["ad_name"].ToString() : null,
                FormName = row["form_name"] != DBNull.Value ? row["form_name"].ToString() : null,
                ImportedAt = Convert.ToDateTime(row["imported_at"])
            };
        }
    }

    public class BulkDeleteRequest
    {
        public List<long> Ids { get; set; }
    }
}
