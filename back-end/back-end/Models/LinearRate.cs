// Models/Rate.cs
using System;
using System.Collections.Generic;

namespace back_end.Models
{
    public class LinearRate
    {
        public string? id { get; set; }  // Matches Account.sysID
        public string freightType { get; set; }
        public string origin { get; set; }
        public string destination { get; set; }
        public string? rateDataJson { get; set; }
        public string? category { get; set; }
        
    }
}