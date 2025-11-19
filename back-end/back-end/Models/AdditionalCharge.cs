using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    // Models/AdditionalCharge.cs
public class AdditionalCharge
    {
        public long Id { get; set; }
        public string Type { get; set; }  // Now 'name' in front-end
        public string Description { get; set; }
        public decimal Amount { get; set; }
        public decimal? Quantity { get; set; }  // New
        public decimal? Rate { get; set; }  // New
        public string Currency { get; set; }  // New
    }
}