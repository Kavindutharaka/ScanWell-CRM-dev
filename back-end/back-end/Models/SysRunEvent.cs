using System;
using System.Collections.Generic;

namespace back_end.Models
{
    public class SysRunEvent
    {
        public int? UserId { get; set; }
        public string UserName { get; set; }
        public string Module { get; set; }
        public string Action { get; set; }
        public string HttpMethod { get; set; }
        public string Url { get; set; }
        public string RequestPayload { get; set; }
        public int? ResponseStatus { get; set; }
        public string ResponsePayload { get; set; }
        public string ErrorMessage { get; set; }
        public int? DurationMs { get; set; }
        public string UserAgent { get; set; }
        // Client-supplied UTC timestamp (with ms precision). Falls back to server time if null.
        public DateTime? CreatedAt { get; set; }
    }

    public class SysRunEventBatch
    {
        public List<SysRunEvent> Events { get; set; }
    }
}
