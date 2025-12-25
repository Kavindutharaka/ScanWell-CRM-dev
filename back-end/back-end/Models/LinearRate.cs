using System;
using System.Collections.Generic;

namespace back_end.Models
{
    public class LinearRate
    {
        public int? Id { get; set; }
        public string Pol { get; set; }           // Port of Loading
        public string Pod { get; set; }           // Port of Discharge
        public decimal? Gp20Usd { get; set; }     // 20GP USD rate
        public decimal? Hq40Usd { get; set; }     // 40HQ-USD rate
        public string TtRouting { get; set; }     // Transit Time / Routing
        public DateTime? Valid { get; set; }      // Validity date
        public string Category { get; set; }      // Shipping line (MSC, ONE, etc.)
    }

    public class LinearRateBulkRequest
    {
        public List<LinearRate> Rates { get; set; }
    }
}