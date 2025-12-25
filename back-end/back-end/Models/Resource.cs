// Resource.cs
using Microsoft.AspNetCore.Http;

namespace back_end.Models
{
    public class Resource
    {
        public string? sysID { get; set; }
        public string? title { get; set; }
        public string? link { get; set; }
        public string? description { get; set; }
        public string? logoUrl { get; set; }
        public IFormFile? logoFile { get; set; }
        public string? addedDate { get; set; }
        public string? addedBy { get; set; }
    }
}