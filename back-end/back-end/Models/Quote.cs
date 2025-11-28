using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Models
{
    public class Quote
    {
        public string? sysID { get; set; }
        public string quoteId { get; set; }
        public string customerId { get; set; }
        public string customerName { get; set; }
        public string pickupLocationId { get; set; }
        public string deliveryLocationId { get; set; }
        public string creditTermsId { get; set; }
        public string createdDate { get; set; }
        public string clientId { get; set; }
        public string clientName { get; set; }
        public string days { get; set; }
        public string freightMode { get; set; }
        public string freightCategory { get; set; }
        public string createdBy { get; set; }
        // Complex structures stored as JSON strings
        public string directRoute { get; set; } // JSON serialized from frontend
        public string? transitRoute { get; set; } // JSON serialized from frontend
        public string? multimodalSegments { get; set; } // JSON serialized from frontend
        public string? routePlanData { get; set; } // JSON serialized from frontend
        public string freightCharges { get; set; } // JSON serialized from frontend
        public string handlingCharges { get; set; } // JSON serialized from frontend
        public string termsConditions { get; set; } // JSON serialized from frontend
        public string customTerms { get; set; } // JSON serialized from frontend
    }
}