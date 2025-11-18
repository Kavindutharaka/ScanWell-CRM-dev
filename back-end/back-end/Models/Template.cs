using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    public class Template
{
    public long Id { get; set; } // Changed to long
    public string Name { get; set; }
    public string FreightType { get; set; }
    public string DataJson { get; set; } // Serialized BaseDocument data for template reuse
}
}