using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    public class Employee
    {
        public string? sysID { get; set; }
        public string? fname { get; set; }
        public string? lname { get; set; }
        public string? email { get; set; }
        public string? tp { get; set; }
        public string? position { get; set; }
        public string? department { get; set; }
        public string? w_location { get; set; }
        public string? a_manager { get; set; }
        public string? status { get; set; }
        public string? note { get; set; }
    }
}