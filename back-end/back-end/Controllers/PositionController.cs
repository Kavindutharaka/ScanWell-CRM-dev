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
    public class PositionController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnectionString;

        public PositionController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnectionString = _configuration.GetSection("DBCon").Value;
        }

        [HttpGet]
        public ActionResult getPositions()
        {
            string query = "select * from [dbo].[position];";

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
        public ActionResult createPosition(Position position)
        {
            string query = @"insert into [dbo].[position] values (@pname);";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@pname", position.pName ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Position added successfully.");
        }

        [HttpPut]
        public ActionResult updatePosition(Position position)
        {
            string query = @"update [dbo].[position] set p_name = @pname where SysID = @id;";

            using (SqlConnection myCon = new SqlConnection(_dbConnectionString))
            {
                myCon.Open();
                using (SqlCommand myCom = new SqlCommand(query, myCon))
                {
                    myCom.Parameters.AddWithValue("@id", position.Id);
                    myCom.Parameters.AddWithValue("@pname", position.pName ?? (object)DBNull.Value);

                    myCom.ExecuteNonQuery();
                }
                myCon.Close();
            }

            return Ok("Position updated successfully.");
        }
    }
}