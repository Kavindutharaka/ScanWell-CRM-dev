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
    }
}
