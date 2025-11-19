using System;
using System.Collections.Generic;
namespace back_end.Models
{
    public class BaseDocument
    {
        public long Id { get; set; }
        public string QuoteId { get; set; }  // New: Generated like YYYYMMDDHHmmss
        public string DocumentNumber { get; set; }
        public string Type { get; set; } // "Quote" or "Invoice"
        public decimal Amount { get; set; }
        public long? CustomerId { get; set; }  // New
        public string CustomerName { get; set; }  // New
        public string Recipient { get; set; }  // Old, can map to CustomerName if needed
        public string RecipientEmail { get; set; }
        public string RecipientAddress { get; set; }
        public long? PickupLocationId { get; set; }  // New
        public long? DeliveryLocationId { get; set; }  // New
        public long? CreditTermsId { get; set; }  // New
        public long? ClientId { get; set; }  // New
        public string ClientName { get; set; }  // New
        public int? Days { get; set; }  // New
        public string FreightMode { get; set; }  // New: e.g., 'Air Import'
        public string FreightCategory { get; set; }  // New: e.g., 'direct'
        public string CreatedBy { get; set; }  // New
        public DateTime? CreatedDate { get; set; }  // New
        public string Status { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public DateTime? ValidUntil { get; set; }
        public string Currency { get; set; } = "USD";
        public string Notes { get; set; }
        public string Terms { get; set; }
        public string FreightType { get; set; }  // Old, can map to FreightMode if needed
        public RateData RateData { get; set; }  // Old, keep for backward compat or remove if not needed
        public List<AdditionalCharge> AdditionalCharges { get; set; } = new List<AdditionalCharge>();
        public List<string> Remarks { get; set; } = new List<string>();  // Old, can use for custom terms
        public string Owner { get; set; }

        // New JSON properties (stored as strings, serialize/deserialize in controller)
        public string RouteConfigJson { get; set; }
        public string DirectRouteJson { get; set; }
        public string TransitRouteJson { get; set; }
        public string MultimodalSegmentsJson { get; set; }
        public string RoutePlanDataJson { get; set; }
        public string FreightChargesJson { get; set; }
        public string TermsConditionsJson { get; set; }  // Standard terms
        public string CustomTermsJson { get; set; }  // Custom terms
    }
}