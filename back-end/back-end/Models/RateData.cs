using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    public class RateData
{
    // Common fields
    public string Routing { get; set; }
    public int? TransitTime { get; set; }
    public string RoutingType { get; set; } // "DIRECT" or "TRANSHIP"
    
    // Air-specific
    public string Airline { get; set; }
    public decimal? RateM { get; set; } // Min (-45kg)
    public decimal? Rate45Minus { get; set; }
    public decimal? Rate45Plus { get; set; }
    public decimal? Rate100 { get; set; }
    public decimal? Rate300 { get; set; }
    public decimal? Rate500 { get; set; }
    public decimal? Rate1000 { get; set; }
    public string Surcharges { get; set; }
    public string Frequency { get; set; }
    
    // Sea FCL-specific
    public string Liner { get; set; }
    public decimal? Rate20GP { get; set; }
    public decimal? Rate40GP { get; set; }
    public decimal? Rate40HQ { get; set; }
    
    // Sea LCL-specific
    public decimal? LclRate { get; set; }
}
}