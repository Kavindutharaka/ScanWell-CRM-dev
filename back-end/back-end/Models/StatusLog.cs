using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    public class StatusLogs
    {
        public long? sysID { get; set; }
        public string new_status { get; set; }
        public string note { get; set; }
        public string activity_id { get; set; }
    }
}