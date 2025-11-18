using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    // Models/Invoice.cs
public class Invoice : BaseDocument
{
    public Invoice()
    {
        Type = "Invoice";
    }
}
}