// Models/Account.cs
namespace back_end.Models
{
    public class Account
    {
        public string? sysID { get; set; }
        public string accountName { get; set; } = "";
        public string domain { get; set; } = "";
        public string fmsCode { get; set; } = "";
        public string accountType { get; set; } = "";        // "import" or "export"
        public string industry { get; set; } = "";
        public string tp { get; set; } = "";                 // company phone
        public string location { get; set; } = "";        // ← renamed from headquartersLocation
        public string salesPerson { get; set; } = "";
        
        // Primary Contact
        public string primaryContact { get; set; } = "";
        public string primaryEmail { get; set; } = "";
        public string primaryPosition { get; set; } = "";
        public string primaryMobile { get; set; } = "";

        public string description { get; set; } = "";

        // All contacts (including primary) as JSON string
        public string contactsJson { get; set; } = "[]";     // ← This holds full contact list
    }
}