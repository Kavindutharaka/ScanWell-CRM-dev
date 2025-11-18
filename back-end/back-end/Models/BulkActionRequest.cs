namespace back_end.Models
{
    public class BulkActionRequest
    {
        public List<long> LeadIds { get; set; }
    }

    public class BulkAssignRequest : BulkActionRequest
    {
        public long EmployeeId { get; set; }
    }

    public class BulkRejectRequest : BulkActionRequest
    {
        public string Reason { get; set; }
    }
}