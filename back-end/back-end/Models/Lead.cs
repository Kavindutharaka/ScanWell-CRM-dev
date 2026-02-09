namespace back_end.Models
{
    public class Lead
    {
        public long Id { get; set; }
        public DateTime? CreatedTime { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string? AdName { get; set; }
        public string? FormName { get; set; }
        public DateTime ImportedAt { get; set; }
    }
}
