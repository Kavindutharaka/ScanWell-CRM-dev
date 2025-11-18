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
    public class ProjectController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;

        public ProjectController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
        }

        [HttpGet]
        public ActionResult getProjects()
        {
            string query = "select * from [dbo].[projects];";

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
            return Ok(table);
        }

        [HttpPost]
        public ActionResult createProject(Project project)
        {
            string query = @"insert into [dbo].[projects] (project_name, priority, timeline, status, deals, contact, accounts, description) 
                             values (@projectName, @priority, @timeline, @status, @deals, @contact, @accounts, @description);";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@projectName", project.projectName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@priority", project.priority ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@timeline", project.timeline.Date); // Ensures date-only for DB 'date' type
                    myCom.Parameters.AddWithValue("@status", project.status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@deals", project.deals ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@contact", project.contact ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@accounts", project.accounts ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@description", project.description ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Project added successfully.");
        }

        [HttpPut]
        public ActionResult updateProject(Project project)
        {
            string query = @"update [dbo].[projects] 
                             set project_name = @projectName, priority = @priority, timeline = @timeline, status = @status, 
                                 deals = @deals, contact = @contact, accounts = @accounts, description = @description 
                             where SysID = @id;";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", project.Id);
                    myCom.Parameters.AddWithValue("@projectName", project.projectName ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@priority", project.priority ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@timeline", project.timeline.Date); // Ensures date-only for DB 'date' type
                    myCom.Parameters.AddWithValue("@status", project.status ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@deals", project.deals ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@contact", project.contact ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@accounts", project.accounts ?? (object)DBNull.Value);
                    myCom.Parameters.AddWithValue("@description", project.description ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Project updated successfully.");
        }

        [HttpDelete("{id}")]
        public ActionResult deleteProject(long id)
        {
            string query = @"delete from [dbo].[projects] where SysID = @id;";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);

                    int rowsAffected = myCom.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound("Project not found.");
                }
                myCon.Close();
            }

            return Ok("Project deleted successfully.");
        }
    }
}