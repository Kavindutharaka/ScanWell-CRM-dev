using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    public class Deal
    {
        public string? sysID { get; set; }
        public string dealName { get; set; }
        public string stage { get; set; }
        public string owner { get; set; }
        public string dealsValue { get; set; }
        public string contacts { get; set; }
        public string accounts { get; set; }
        public string expectedCloseDate { get; set; }
        public string closeProbability { get; set; }
        public string forecastValue { get; set; }
        public string lastInteraction { get; set; }
        public string quotesInvoicesNumber { get; set; }
        public string notes { get; set; }
    }
}