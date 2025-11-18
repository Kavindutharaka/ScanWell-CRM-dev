namespace back_end.Models
{
    public class Lead
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public string Status { get; set; }
        public string Company { get; set; }
        public string Title { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public DateTime? LastInteraction { get; set; }
        public string ActiveSequences { get; set; }
        public string? Notes { get; set; }
        public string Priority { get; set; }
        public int Score { get; set; }
        public string ApprovalStatus { get; set; }
        public long? AssignedTo { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string Source { get; set; } = "Manual"; // "Facebook" or "Manual"
    }
}