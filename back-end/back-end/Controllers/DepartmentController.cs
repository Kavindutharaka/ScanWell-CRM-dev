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
    public class DepartmentController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;

        public DepartmentController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
        }

        [HttpGet]
        public ActionResult getDepartment()
        {
            string query = "select * from [dbo].[department];";

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
        public ActionResult createDepartment(Department department)
        {
            string query = @"insert into [dbo].[department] values (@dname);";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@dname", department.dName ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Department added successfully.");
        }

        [HttpPut]
        public ActionResult updateDepartment(Department department)
        {
            string query = @"update [dbo].[department] set d_name = @dname where SysID = @id;";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", department.Id);
                    myCom.Parameters.AddWithValue("@dname", department.dName ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Department updated successfully.");
        }

        [HttpDelete("{id}")]
        public ActionResult deleteDepartment(long id)
        {
            string query = @"delete from [dbo].[department] where SysID = @id;";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", id);

                    int rowsAffected = myCom.ExecuteNonQuery();
                    if (rowsAffected == 0)
                        return NotFound("Department not found.");
                }
                myCon.Close();
            }

            return Ok("Department deleted successfully.");
        }
    }
}