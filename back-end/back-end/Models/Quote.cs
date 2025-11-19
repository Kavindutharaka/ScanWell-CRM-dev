// File: Models/Quote.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace back_end.Models
{
    public class Quote
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string QuoteId { get; set; } = string.Empty; // e.g., 20251119123456

        public int? CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;

        public int? ClientId { get; set; }
        public string ClientName { get; set; } = string.Empty;

        public int? PickupLocationId { get; set; }
        public int? DeliveryLocationId { get; set; }
        public int? CreditTermsId { get; set; }

        [Column(TypeName = "date")]
        public DateTime CreatedDate { get; set; } = DateTime.Today;

        public int? DaysValid { get; set; }

        // Freight Configuration
        [Required]
        public string FreightMode { get; set; } = string.Empty; // Air Import, Sea Export FCL, etc.

        [Required]
        public string FreightCategory { get; set; } = string.Empty; // direct, transit, multimodal

        public string CreatedBy { get; set; } = "System User";

        // JSON Stored Complex Data (Recommended for flexibility)
        public string? DirectRouteJson { get; set; }
        public string? TransitRouteJson { get; set; }
        public string? MultimodalSegmentsJson { get; set; }
        public string? RoutePlanJson { get; set; }
        public string? FreightChargesJson { get; set; }
        public string? AdditionalChargesJson { get; set; }
        public string? CustomTermsJson { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }

    // Optional: Strongly-typed classes if you prefer not to use JSON (more rigid)
    public class DirectRoute
    {
        public PortDetail PortOfLoading { get; set; } = new();
        public PortDetail PortOfDischarge { get; set; } = new();
    }

    public class PortDetail
    {
        public string PortId { get; set; } = string.Empty;
        public string Carrier { get; set; } = string.Empty;
        public string Incoterm { get; set; } = string.Empty;
        public string Currency { get; set; } = "USD";
        public string CargoType { get; set; } = string.Empty;
    }

    public class TransitStop
    {
        public long Id { get; set; }
        public string PortId { get; set; } = string.Empty;
        public string Carrier { get; set; } = string.Empty;
        public string Incoterm { get; set; } = string.Empty;
        public string Currency { get; set; } = "USD";
        public string CargoType { get; set; } = string.Empty;
    }

    public class MultimodalSegment
    {
        public long Id { get; set; }
        public string SelectedMode { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public decimal? ChargeableWeight { get; set; }
        public string WeightBreaker { get; set; } = string.Empty;
        public string PricingUnit { get; set; } = string.Empty;
        public decimal? Charge { get; set; }
        public string Currency { get; set; } = "USD";
    }

    public class RoutePlanPoint
    {
        public string AirportPortCode { get; set; } = string.Empty;
        public string Carrier1 { get; set; } = string.Empty;
        public string Equipment { get; set; } = string.Empty;
        public int? Units { get; set; }
        public decimal? NetWeight { get; set; }
        public decimal? GrossWeight { get; set; }
        public decimal? Cbm { get; set; }
        public decimal? ChargeableWeight { get; set; }
        public int? TotalPieces { get; set; }
    }

    public class FreightCharge
    {
        public long Id { get; set; }
        public string ChargeName { get; set; } = string.Empty;
        public string Uom { get; set; } = string.Empty;
        public Dictionary<string, decimal?> Rates { get; set; } = new(); // Key: origin, transit1, destination
    }

    public class AdditionalCharge
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal Rate { get; set; }
        public string Currency { get; set; } = "USD";
        public decimal Amount => Quantity * Rate;
    }
}