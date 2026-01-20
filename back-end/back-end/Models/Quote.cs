namespace back_end.Models
{
    public class Quote
    {
        public int QuoteId { get; set; }
        public string QuoteNumber { get; set; } = null!;
        public string FreightCategory { get; set; } = null!; // 'air', 'sea', 'multimodal'
        public string FreightMode { get; set; } = null!;     // 'import', 'export', 'fcl', 'lcl', 'mixed'
        public string FreightType { get; set; } = null!;     // 'direct', 'transit', 'multimodal'

        public DateTime CreatedDate { get; set; }  // Stored as DATE
        public DateTime? RateValidity { get; set; } // DATE NULL

        public string? Customer { get; set; }
        public string? ContactName { get; set; }
        public string? PickupLocation { get; set; }
        public string? DeliveryLocation { get; set; }
        public string? PortOfLoading { get; set; }
        public string? PortOfDischarge { get; set; }

        // JSON Fields (NVARCHAR(MAX))
        public string? Carriers { get; set; }
        public string? Equipment { get; set; }
        public string? FreightCharges { get; set; }
        public string? DestinationCharges { get; set; }
        public string? OriginHandling { get; set; }
        public string? DestinationHandling { get; set; }
        public string? TransitRoutes { get; set; }
        public string? Routes { get; set; }

        public string? OtherCharges { get; set; } // NEW
        public int? TotalTransitTime { get; set; }
        public string? CarrierOptions { get; set; } 
        public string? TermsConditions { get; set; }

        public string Status { get; set; } = "draft";

        public long CreatedBy { get; set; }  // BIGINT → emp_reg.SysID
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        //      // ADDED: Outcome tracking fields
        // public string? OutcomeStatus { get; set; }
        // public decimal? WonAmount { get; set; }
        // public string? LostReason { get; set; }
        // public string? LostNote { get; set; }
    }
}