using System.ComponentModel.DataAnnotations;

namespace back_end.Models
{
    public class Project
    {
        public long Id { get; set; }
        
        [Required]
        public string projectName { get; set; } = string.Empty;
        
        [Required]
        public string priority { get; set; } = string.Empty;
        
        [Required]
        public DateTime timeline { get; set; }
        
        [Required]
        public string status { get; set; } = string.Empty;
        
        public string? deals { get; set; }
        
        public string? contact { get; set; }
        
        public string? accounts { get; set; }
        
        public string? description { get; set; }
    }
}