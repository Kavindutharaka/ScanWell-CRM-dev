using System;
using System.Collections.Generic;

namespace back_end.Models
{
    public class SeaBondRate
    {
        public int? Id { get; set; }
        public string? Origin { get; set; }
        public string? Rate { get; set; }
        public string? Vessel { get; set; }
        public string? Etd { get; set; }
        public string? Cutoff { get; set; }
        public string? Transit { get; set; }
        public string? Validity { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class SeaBondRateBulkRequest
    {
        public List<SeaBondRate> Rates { get; set; }
    }
}
