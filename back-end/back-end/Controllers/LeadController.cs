// Controllers/LeadController.cs
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using back_end.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeadController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;
        private readonly HttpClient _httpClient;

        public LeadController(IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpGet]
        public ActionResult GetLeads()
        {
            string query = @"
                SELECT l.*, 
                       e.SysID AS assigned_id, e.fname, e.lname, e.email AS assigned_email, e.position AS assigned_position, e.department AS assigned_department, e.status AS assigned_status
                FROM leads l
                LEFT JOIN [dbo].[emp_reg] e ON l.assigned_to = e.SysID
                ORDER BY l.id DESC";

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
                var lead = new Lead
                {
                    Id = Convert.ToInt64(row["id"]),
                    Name = row["name"].ToString(),
                    Status = row["status"].ToString(),
                    Company = row["company"].ToString(),
                    Title = row["title"] != DBNull.Value ? row["title"].ToString() : null,
                    Email = row["email"].ToString(),
                    Phone = row["phone"] != DBNull.Value ? row["phone"].ToString() : null,
                    LastInteraction = row["last_interaction"] != DBNull.Value ? (DateTime?)Convert.ToDateTime(row["last_interaction"]) : null,
                    ActiveSequences = row["active_sequences"] != DBNull.Value ? row["active_sequences"].ToString() : null,
                    Notes = row["notes"] != DBNull.Value ? row["notes"].ToString() : null,
                    Priority = row["priority"].ToString(),
                    Score = Convert.ToInt32(row["score"]),
                    ApprovalStatus = row["approval_status"].ToString(),
                    AssignedTo = row["assigned_to"] != DBNull.Value ? (long?)Convert.ToInt64(row["assigned_to"]) : null,
                    CreatedAt = Convert.ToDateTime(row["created_at"]),
                    UpdatedAt = Convert.ToDateTime(row["updated_at"]),
                    Source = row["source"] != DBNull.Value ? row["source"].ToString() : "Manual"
                };
                leads.Add(lead);
            }

            return Ok(leads);
        }

        [HttpGet("{id}")]
        public ActionResult GetLeadById(long id)
        {
            string query = @"
                SELECT l.*, 
                       e.SysID AS assigned_id, e.fname, e.lname, e.email AS assigned_email, e.position AS assigned_position, e.department AS assigned_department, e.status AS assigned_status
                FROM leads l
                LEFT JOIN [dbo].[emp_reg] e ON l.assigned_to = e.SysID
                WHERE l.id = @id";

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

            DataRow row = table.Rows[0];
            var lead = new Lead
            {
                Id = Convert.ToInt64(row["id"]),
                Name = row["name"].ToString(),
                Status = row["status"].ToString(),
                Company = row["company"].ToString(),
                Title = row["title"] != DBNull.Value ? row["title"].ToString() : null,
                Email = row["email"].ToString(),
                Phone = row["phone"] != DBNull.Value ? row["phone"].ToString() : null,
                LastInteraction = row["last_interaction"] != DBNull.Value ? (DateTime?)Convert.ToDateTime(row["last_interaction"]) : null,
                ActiveSequences = row["active_sequences"] != DBNull.Value ? row["active_sequences"].ToString() : null,
                Notes = row["notes"] != DBNull.Value ? row["notes"].ToString() : null,
                Priority = row["priority"].ToString(),
                Score = Convert.ToInt32(row["score"]),
                ApprovalStatus = row["approval_status"].ToString(),
                AssignedTo = row["assigned_to"] != DBNull.Value ? (long?)Convert.ToInt64(row["assigned_to"]) : null,
                CreatedAt = Convert.ToDateTime(row["created_at"]),
                UpdatedAt = Convert.ToDateTime(row["updated_at"]),
                Source = row["source"] != DBNull.Value ? row["source"].ToString() : "Manual"
            };

            return Ok(lead);
        }

        [HttpPost]
        public ActionResult CreateLead([FromBody] Lead lead)
        {
            string query = @"
                INSERT INTO leads 
                (name, status, company, title, email, phone, last_interaction, active_sequences, notes, priority, score, approval_status, assigned_to, source, created_at, updated_at)
                VALUES 
                (@name, @status, @company, @title, @email, @phone, @last_interaction, @active_sequences, @notes, @priority, @score, @approval_status, @assigned_to, @source, GETDATE(), GETDATE());
                SELECT SCOPE_IDENTITY();";

            long newId;
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@name", lead.Name ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@status", lead.Status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@company", lead.Company ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@title", lead.Title ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@email", lead.Email ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@phone", lead.Phone ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@last_interaction", lead.LastInteraction ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@active_sequences", lead.ActiveSequences ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@notes", lead.Notes ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@priority", lead.Priority ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@score", lead.Score);
                    myCom.Parameters.AddWithValue("@approval_status", lead.ApprovalStatus ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@assigned_to", lead.AssignedTo ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@source", lead.Source ?? "Manual");

                    newId = Convert.ToInt64(myCom.ExecuteScalar());
                }
                myCon.Close();
            }

            lead.Id = newId;
            return Ok(lead);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateLead(long id, [FromBody] Lead lead)
        {
            string query = @"
                UPDATE leads SET
                    name = @name,
                    status = @status,
                    company = @company,
                    title = @title,
                    email = @email,
                    phone = @phone,
                    last_interaction = @last_interaction,
                    active_sequences = @active_sequences,
                    notes = @notes,
                    priority = @priority,
                    score = @score,
                    approval_status = @approval_status,
                    assigned_to = @assigned_to,
                    source = @source,
                    updated_at = GETDATE()
                WHERE id = @id";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    myCom.Parameters.AddWithValue("@name", lead.Name ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@status", lead.Status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@company", lead.Company ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@title", lead.Title ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@email", lead.Email ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@phone", lead.Phone ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@last_interaction", lead.LastInteraction ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@active_sequences", lead.ActiveSequences ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@notes", lead.Notes ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@priority", lead.Priority ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@score", lead.Score);
                    myCom.Parameters.AddWithValue("@approval_status", lead.ApprovalStatus ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@assigned_to", lead.AssignedTo ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@source", lead.Source ?? "Manual");

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

        [HttpPatch("{id}/approve")]
        public IActionResult ApproveLead(long id)
        {
            string query = "UPDATE leads SET approval_status = 'approved' WHERE id = @id";
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

            return Ok("Lead approved successfully.");
        }

        [HttpPatch("{id}/reject")]
        public IActionResult RejectLead(long id)
        {
            string query = "UPDATE leads SET approval_status = 'rejected' WHERE id = @id";
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

            return Ok("Lead rejected successfully.");
        }

        [HttpPatch("{id}/assign")]
        public IActionResult AssignLead(long id, [FromBody] BulkAssignRequest request)
        {
            string query = "UPDATE leads SET assigned_to = @assigned_to WHERE id = @id";
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);
                    myCom.Parameters.AddWithValue("@assigned_to", request.EmployeeId);
                    int rowsAffected = myCom.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound("Lead not found.");
                }
                myCon.Close();
            }

            return Ok("Lead assigned successfully.");
        }

        [HttpPatch("bulk/approve")]
        public IActionResult BulkApproveLeads([FromBody] BulkActionRequest request)
        {
            if (request.LeadIds == null || request.LeadIds.Count == 0)
                return BadRequest("No lead IDs provided.");

            string ids = string.Join(",", request.LeadIds);
            string query = $"UPDATE leads SET approval_status = 'approved' WHERE id IN ({ids})";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Leads approved successfully.");
        }

        [HttpPatch("bulk/reject")]
        public IActionResult BulkRejectLeads([FromBody] BulkRejectRequest request)
        {
            if (request.LeadIds == null || request.LeadIds.Count == 0)
                return BadRequest("No lead IDs provided.");

            string ids = string.Join(",", request.LeadIds);
            string query = $"UPDATE leads SET approval_status = 'rejected' WHERE id IN ({ids})";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Leads rejected successfully.");
        }

        [HttpPatch("bulk/assign")]
        public IActionResult BulkAssignLeads([FromBody] BulkAssignRequest request)
        {
            if (request.LeadIds == null || request.LeadIds.Count == 0)
                return BadRequest("No lead IDs provided.");

            string ids = string.Join(",", request.LeadIds);
            string query = $"UPDATE leads SET assigned_to = @assigned_to WHERE id IN ({ids})";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@assigned_to", request.EmployeeId);
                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Leads assigned successfully.");
        }

        [HttpPost("{id}/convert")]
        public IActionResult ConvertLeadToContact(long id)
        {
            string query = "UPDATE leads SET status = 'converted' WHERE id = @id";

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

            return Ok("Lead converted to contact successfully.");
        }

        [HttpPost("import")]
        public IActionResult ImportLeadsFromExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            return Ok("Leads imported successfully (placeholder).");
        }

        [HttpGet("facebook-leads")]
        public async Task<ActionResult> ImportFacebookLeads()
        {
            var facebookConfig = _configuration.GetSection("Facebook");
            var appId = facebookConfig["AppId"];
            var appSecret = facebookConfig["AppSecret"];
            var leadFormId = facebookConfig["LeadFormId"];
            var pageAccessToken = facebookConfig["PageAccessToken"];

            if (string.IsNullOrEmpty(leadFormId) || string.IsNullOrEmpty(pageAccessToken))
            {
                return BadRequest("Facebook configuration is missing. Please add AppId, AppSecret, LeadFormId, and PageAccessToken to appsettings.json under 'Facebook' section.");
            }

            var url = $"https://graph.facebook.com/v18.0/{leadFormId}/leads?access_token={pageAccessToken}&limit=100";
            try
            {
                var response = await _httpClient.GetStringAsync(url);
                var json = JObject.Parse(response);
                var data = json["data"] as JArray;

                if (data == null || data.Count == 0)
                {
                    return Ok(new List<Lead>());
                }

                var createdLeads = new List<Lead>();
                foreach (var item in data)
                {
                    var fbLead = item.ToObject<JObject>();
                    var name = fbLead["full_name"]?.ToString();
                    var email = fbLead["email"]?.ToString();
                    var phone = fbLead["phone_number"]?.ToString();
                    // Map other fields as available; adjust based on your lead form fields

                    var lead = new Lead
                    {
                        Name = name,
                        Email = email,
                        Phone = phone,
                        Status = "new",
                        Company = null, // Not typically in FB leads
                        Title = null,
                        Priority = "medium",
                        Score = 0,
                        ApprovalStatus = "pending",
                        Source = "Facebook",
                        // Other fields default
                    };

                    // Use the existing CreateLead logic, but since it's internal, call the method
                    var createdLead = await CreateLeadInternal(lead);
                    if (createdLead != null)
                    {
                        createdLeads.Add(createdLead);
                    }
                }

                return Ok(createdLeads);
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(500, $"Error fetching Facebook leads: {ex.Message}");
            }
            catch (JsonException ex)
            {
                return StatusCode(500, $"Error parsing Facebook response: {ex.Message}");
            }
        }

        private async Task<Lead?> CreateLeadInternal(Lead lead)
        {
            // Reuse the create logic from CreateLead, but return the lead
            string query = @"
                INSERT INTO leads 
                (name, status, company, title, email, phone, last_interaction, active_sequences, notes, priority, score, approval_status, assigned_to, source, created_at, updated_at)
                VALUES 
                (@name, @status, @company, @title, @email, @phone, @last_interaction, @active_sequences, @notes, @priority, @score, @approval_status, @assigned_to, @source, GETDATE(), GETDATE());
                SELECT SCOPE_IDENTITY();";

            long newId;
            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                await myCon.OpenAsync();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@name", lead.Name ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@status", lead.Status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@company", lead.Company ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@title", lead.Title ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@email", lead.Email ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@phone", lead.Phone ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@last_interaction", lead.LastInteraction ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@active_sequences", lead.ActiveSequences ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@notes", lead.Notes ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@priority", lead.Priority ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@score", lead.Score);
                    myCom.Parameters.AddWithValue("@approval_status", lead.ApprovalStatus ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@assigned_to", lead.AssignedTo ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@source", lead.Source ?? "Manual");

                    newId = Convert.ToInt64(await myCom.ExecuteScalarAsync());
                }
                await myCon.CloseAsync();
            }

            lead.Id = newId;
            return lead;
        }
    }

    // Supporting models (keep if used elsewhere; otherwise remove)
    public class BulkActionRequest
    {
        public List<long> LeadIds { get; set; }
    }

    public class BulkRejectRequest : BulkActionRequest
    {
        // Add rejection reason if needed
    }

    public class BulkAssignRequest
    {
        public List<long> LeadIds { get; set; }
        public long EmployeeId { get; set; }
    }
}