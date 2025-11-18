using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    public class Contact
    {
        public string? sysID { get; set; }
        public string name { get; set; }
        public string email { get; set; }
        public string? phone { get; set; }
        public string? title { get; set; }
        public string? company { get; set; }
        public string? deals { get; set; }
        public string? deal_value { get; set; }
        public string? type { get; set; }
        public string? priority { get; set; }
        public string? comments { get; set; }
    }
}