// Models/Rate.cs
using System;
using System.Collections.Generic;

namespace back_end.Models
{
    public class Rate
    {
        public string? sysID { get; set; }  // Matches Account.sysID
        public string freightType { get; set; }
        public string origin { get; set; }
        public string destination { get; set; }
        public string? airline { get; set; }
        public string? liner { get; set; }
        public string? currency { get; set; }
        public string? route { get; set; }
        public string? surcharges { get; set; }
        public string? transitTime { get; set; }
        public string? transshipmentTime { get; set; }
        public string? frequency { get; set; }
        public string? routingType { get; set; }
        public string rateDataJson { get; set; }  // JSON string
        public string validateDate { get; set; }  // ISO string: "2025-12-31"
        public string? note { get; set; }
        public string? remark { get; set; }
        public string? owner { get; set; }
        
    }
}