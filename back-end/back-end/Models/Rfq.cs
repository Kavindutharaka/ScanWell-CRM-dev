using System;

namespace back_end.Models
{
    public class Rfq
    {
        public long? sysID { get; set; }
        public string? rfq_number { get; set; }
        public string customer { get; set; }
        public DateOnly valid_date { get; set; }
        public string? link { get; set; }
        public string added_by { get; set; }
        // DB migration required: ALTER TABLE [dbo].[rfq] ADD amount DECIMAL(18,2) NULL;
        public decimal? amount { get; set; }
    }
}
