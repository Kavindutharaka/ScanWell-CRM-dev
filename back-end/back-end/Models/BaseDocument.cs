using System;
using System.Collections.Generic;
namespace back_end.Models
{
    public class BaseDocument
    {
        public long Id { get; set; } // Changed to long to match SQL bigint
        public string DocumentNumber { get; set; }
        public string Type { get; set; } // "Quote" or "Invoice"
        public decimal Amount { get; set; }
        public string Recipient { get; set; }
        public string RecipientEmail { get; set; }
        public string RecipientAddress { get; set; }
        public string Status { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime? DueDate { get; set; } // For Invoices
        public DateTime? ExpiryDate { get; set; } // For Quotes
        public DateTime? ValidUntil { get; set; }
        public string Currency { get; set; } = "USD";
        public string Notes { get; set; }
        public string Terms { get; set; }
        public string FreightType { get; set; } // e.g., "air-import", "sea-export-fcl"
        public RateData RateData { get; set; }
        public List<AdditionalCharge> AdditionalCharges { get; set; } = new List<AdditionalCharge>();
        public List<string> Remarks { get; set; } = new List<string>();
        public string Owner { get; set; }
    }
}