using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    public class Account
    {
        public string? sysID { get; set; }
        public string accountName { get; set; }
        public string domain { get; set; }
        public string industry { get; set; }
        public string description { get; set; }
        public string numberOfEmployees { get; set; }
        public string headquartersLocation { get; set; }
        public string contacts { get; set; }
        public string deals { get; set; }
    }
}