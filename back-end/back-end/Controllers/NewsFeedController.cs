using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace back_end.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewsFeedController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        string dbcon;
        DataTable tb;
        SqlConnection myCon;
        SqlCommand myCom;
        SqlDataReader myR;

        public NewsFeedController(IConfiguration configuration, IWebHostEnvironment env)
        {
            _configuration = configuration;
            _env = env;
            dbcon = _configuration.GetSection("DBCon").Value;
            myCon = new SqlConnection(dbcon);
        }

        // GET: api/NewsFeed/images
        [HttpGet, Route("images")]
        public ActionResult GetImages()
        {
            try
            {
                string query = @"
                    SELECT SysID, image_url, caption, uploaded_by, created_at
                    FROM [dbo].[news_feed]
                    WHERE is_active = 1
                    ORDER BY created_at DESC;";

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
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching news feed: {ex.Message}");
            }
        }

        // POST: api/NewsFeed/upload
        [HttpPost, Route("upload")]
        public IActionResult UploadImage([FromForm] IFormFile imageFile, [FromForm] string caption, [FromForm] string uploadedBy)
        {
            try
            {
                // Validate file
                if (imageFile == null || imageFile.Length == 0)
                    return BadRequest("Image file is required.");

                // Validate file size (max 10MB)
                if (imageFile.Length > 10 * 1024 * 1024)
                    return BadRequest("File size must be less than 10MB.");

                // Validate file extension
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                    return BadRequest("Only image files (jpg, png, gif, webp) are allowed.");

                // Validate uploadedBy
                if (string.IsNullOrWhiteSpace(uploadedBy))
                    return BadRequest("Uploaded by is required.");

                // Save file to wwwroot/newsfeed/
                var uploadsFolderPath = Path.Combine(_env.WebRootPath, "newsfeed");
                if (!Directory.Exists(uploadsFolderPath))
                {
                    Directory.CreateDirectory(uploadsFolderPath);
                }

                var fileName = Guid.NewGuid().ToString() + extension;
                var filePath = Path.Combine(uploadsFolderPath, fileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    imageFile.CopyTo(fileStream);
                }

                var imageUrl = $"/newsfeed/{fileName}";

                // Insert into database
                string query = @"
                    INSERT INTO [dbo].[news_feed]
                    (image_url, caption, uploaded_by, created_at, is_active)
                    VALUES
                    (@imageUrl, @caption, @uploadedBy, GETDATE(), 1);
                    SELECT SCOPE_IDENTITY();";

                using (myCon)
                {
                    myCon.Open();
                    using (myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@imageUrl", imageUrl);
                        myCom.Parameters.AddWithValue("@caption", string.IsNullOrEmpty(caption) ? (object)DBNull.Value : caption);
                        myCom.Parameters.AddWithValue("@uploadedBy", uploadedBy);

                        var newId = myCom.ExecuteScalar();
                        myCon.Close();

                        return Ok(new
                        {
                            message = "Image uploaded successfully.",
                            sysId = newId,
                            imageUrl = imageUrl
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error uploading image: {ex.Message}");
            }
        }

        // DELETE: api/NewsFeed/images/{id}
        [HttpDelete, Route("images/{id}")]
        public IActionResult DeleteImage(int id)
        {
            try
            {
                // Soft delete - set is_active = 0
                string query = @"UPDATE [dbo].[news_feed] SET is_active = 0 WHERE SysID = @id";

                using (myCon)
                {
                    myCon.Open();
                    using (myCom = new SqlCommand(query, myCon))
                    {
                        myCom.Parameters.AddWithValue("@id", id);

                        int rowsAffected = myCom.ExecuteNonQuery();

                        if (rowsAffected == 0)
                            return NotFound("Image not found.");
                    }
                    myCon.Close();
                }

                return Ok("Image deleted successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error deleting image: {ex.Message}");
            }
        }
    }
}
