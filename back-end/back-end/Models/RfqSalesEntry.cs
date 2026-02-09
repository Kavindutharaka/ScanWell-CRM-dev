using System;

namespace back_end.Models
{
    public class RfqSalesEntry
    {
        public long? Id { get; set; }
        public long RfqId { get; set; }
        public string Mode { get; set; }       // "AIR" or "Sea"
        public string Type { get; set; }       // "Import" or "Export"
        public string? BookingNo { get; set; }
        public decimal Amount { get; set; }
        public string? SalesPerson { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
