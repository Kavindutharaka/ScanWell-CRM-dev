namespace back_end.Models
{
    public class Activitys
    {
        public long id { get; set; }
        public string? activityName { get; set; }
        public string? activityType { get; set; }
        public string? owner { get; set; }
        public DateTime? startTime { get; set; }
        public DateTime? endTime { get; set; }
        public string? status { get; set; }
        public string? relatedItem { get; set; }
    }
}