// Models/QuoteOutcome.cs
namespace back_end.Models
{
    public class QuoteOutcome
        {
            public int? QuoteId { get; set; }
            public string? OutcomeStatus { get; set; }
            public decimal? WonAmount { get; set; }
            public string? LostReason { get; set; }
            public string? LostNote { get; set; }
            public string? InvoiceNumber { get; set; }
            public decimal? Cost { get; set; }
            public decimal? SalesValue { get; set; }
        }
}