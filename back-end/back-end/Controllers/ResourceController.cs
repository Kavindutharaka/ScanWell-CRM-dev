// ResourceController.cs
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using back_end.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ResourceController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        string dbcon;
        DataTable tb;
        SqlConnection myCon;
        SqlCommand myCom;
        SqlDataReader myR;

        public ResourceController(IConfiguration configuration, IWebHostEnvironment env)
        {
            _configuration = configuration;
            _env = env;
            dbcon = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(dbcon);
        }

        [HttpGet, Route("resource")]
        public ActionResult getResources()
        {
            string query = @"select * from [dbo].[resource] order by SysID desc;";
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

        [HttpGet, Route("resource/{id}")]
        public ActionResult getResourceById(string id)
        {
            string query = @"select * from [dbo].[resource] where SysID = @id;";
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
                return NotFound("Resource not found.");
            }
            return new OkObjectResult(tb);
        }

        [HttpPost, Route("resource")]
        public IActionResult CreateResource([FromForm] Resource resource)
        {
            try
            {
                // Validate required fields
                if (string.IsNullOrWhiteSpace(resource.title))
                    return BadRequest("Title is required.");
                
                if (string.IsNullOrWhiteSpace(resource.link))
                    return BadRequest("Link is required.");
                
                if (string.IsNullOrWhiteSpace(resource.description))
                    return BadRequest("Description is required.");
                
                if (string.IsNullOrWhiteSpace(resource.addedDate))
                    return BadRequest("Added date is required.");
                
                if (string.IsNullOrWhiteSpace(resource.addedBy))
                    return BadRequest("Added by is required.");

                string logoUrl = resource.logoUrl ?? string.Empty;

                // Handle file upload
                if (resource.logoFile != null && resource.logoFile.Length > 0)
                {
                    var uploadsFolderPath = Path.Combine(_env.WebRootPath, "logos");
                    if (!Directory.Exists(uploadsFolderPath))
                    {
                        Directory.CreateDirectory(uploadsFolderPath);
                    }

                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(resource.logoFile.FileName);
                    var filePath = Path.Combine(uploadsFolderPath, fileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        resource.logoFile.CopyTo(fileStream);
                    }

                    logoUrl = $"/logos/{fileName}";
                }

                // Validate that we have a logo (either file or URL)
                if (string.IsNullOrWhiteSpace(logoUrl))
                {
                    return BadRequest("Logo is required (either file upload or URL).");
                }

                string query = @"
                INSERT INTO [dbo].[resource] 
                (title, link, description, logoUrl, addedDate, addedBy)
                VALUES 
                (@title, @link, @description, @logoUrl, @addedDate, @addedBy)";

                using (myCon)
                {
                    myCon.Open();
                    using (myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@title", resource.title);
                        myCom.Parameters.AddWithValue("@link", resource.link);
                        myCom.Parameters.AddWithValue("@description", resource.description);
                        myCom.Parameters.AddWithValue("@logoUrl", logoUrl);
                        myCom.Parameters.AddWithValue("@addedDate", resource.addedDate);
                        myCom.Parameters.AddWithValue("@addedBy", resource.addedBy);

                        myCom.ExecuteNonQuery();
                    }
                    myCon.Close();
                }

                return Ok("Resource added successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error creating resource: {ex.Message}");
            }
        }

        [HttpPut, Route("resource")]
        public IActionResult UpdateResource([FromForm] Resource resource)
        {
            try
            {
                // Validate required fields
                if (string.IsNullOrEmpty(resource.sysID))
                    return BadRequest("Resource ID is required for update.");
                
                if (string.IsNullOrWhiteSpace(resource.title))
                    return BadRequest("Title is required.");
                
                if (string.IsNullOrWhiteSpace(resource.link))
                    return BadRequest("Link is required.");
                
                if (string.IsNullOrWhiteSpace(resource.description))
                    return BadRequest("Description is required.");

                string logoUrl = resource.logoUrl ?? string.Empty;

                // Handle file upload
                if (resource.logoFile != null && resource.logoFile.Length > 0)
                {
                    var uploadsFolderPath = Path.Combine(_env.WebRootPath, "logos");
                    if (!Directory.Exists(uploadsFolderPath))
                    {
                        Directory.CreateDirectory(uploadsFolderPath);
                    }

                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(resource.logoFile.FileName);
                    var filePath = Path.Combine(uploadsFolderPath, fileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        resource.logoFile.CopyTo(fileStream);
                    }

                    logoUrl = $"/logos/{fileName}";
                }

                string query = @"
                UPDATE [dbo].[resource] SET
                    title = @title,
                    link = @link,
                    description = @description,
                    logoUrl = @logoUrl,
                    addedDate = @addedDate,
                    addedBy = @addedBy
                WHERE SysID = @id";

                using (myCon)
                {
                    myCon.Open();
                    using (myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@id", resource.sysID);
                        myCom.Parameters.AddWithValue("@title", resource.title);
                        myCom.Parameters.AddWithValue("@link", resource.link);
                        myCom.Parameters.AddWithValue("@description", resource.description);
                        myCom.Parameters.AddWithValue("@logoUrl", logoUrl ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@addedDate", resource.addedDate ?? (object)DBNull.Value);
                        myCom.Parameters.AddWithValue("@addedBy", resource.addedBy ?? (object)DBNull.Value);

                        int rowsAffected = myCom.ExecuteNonQuery();

                        if (rowsAffected == 0)
                            return NotFound("Resource not found.");
                    }
                    myCon.Close();
                }

                return Ok("Resource updated successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating resource: {ex.Message}");
            }
        }

        [HttpDelete, Route("resource/{id}")]
        public IActionResult DeleteResource(string id)
        {
            try
            {
                string query = @"DELETE FROM [dbo].[resource] WHERE SysID = @id";

                using (myCon)
                {
                    myCon.Open();
                    using (myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@id", id);

                        int rowsAffected = myCom.ExecuteNonQuery();

                        if (rowsAffected == 0)
                            return NotFound("Resource not found.");
                    }
                    myCon.Close();
                }

                return Ok("Resource deleted successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error deleting resource: {ex.Message}");
            }
        }
    }
}