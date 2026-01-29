using System;
using System.Collections.Generic;

namespace back_end.Models
{
    public class DestinationRate
    {
        public int? Id { get; set; }
        public string Destination { get; set; }      // Destination port/region
        public string Liner { get; set; }            // Shipping line name
        public decimal? Gp20 { get; set; }           // 20GP rate
        public decimal? Hq40 { get; set; }           // 40HQ rate
        public string TtRouting { get; set; }        // Transit Time / Routing
        public DateTime? Valid { get; set; }         // Validity date
        public string Category { get; set; }         // Header category (USEC/USWC, CANADA, JEBAL ALI, EU/UK)
        public string? Remark { get; set; }
    }

    public class DestinationRateBulkRequest
    {
        public List<DestinationRate> Rates { get; set; }
    }
}
