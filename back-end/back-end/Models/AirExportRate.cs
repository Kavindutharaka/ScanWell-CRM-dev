using System;
using System.Collections.Generic;

namespace back_end.Models
{
    public class AirExportRate
    {
        public int? Id { get; set; }
        public string? CommodityType { get; set; }
        public string? Airline { get; set; }
        public decimal? RateM { get; set; }           // Minimum (M)
        public decimal? Rate45Minus { get; set; }     // -45 kg
        public decimal? Rate45 { get; set; }          // 45 kg
        public decimal? Rate100 { get; set; }         // 100 kg
        public decimal? Rate300 { get; set; }         // 300 kg
        public decimal? Rate500 { get; set; }         // 500 kg
        public decimal? Rate1000 { get; set; }        // 1000 kg
        public string? Surcharges { get; set; }
        public string? TransitTime { get; set; }      // T/T
        public string? Frequency { get; set; }
        public string? Routing { get; set; }          // ROUTINE (routing)
        public string? Remarks { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }

    public class AirExportRateBulkRequest
    {
        public string? CommodityType { get; set; }
        public List<AirExportRate> Rates { get; set; }
    }
}
