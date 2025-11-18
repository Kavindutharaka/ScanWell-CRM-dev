using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    // Models/AdditionalCharge.cs
public class AdditionalCharge
{
    public long Id { get; set; } // Changed to long
    public string Type { get; set; }
    public string Description { get; set; }
    public decimal Amount { get; set; }
}
}