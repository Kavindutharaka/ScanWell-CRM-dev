// Models/UserRole.cs
namespace back_end.Models
{
    public class UserRole
    {
        public int Id { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;   // plain text

        public bool IsAdmin { get; set; } = false;
        public bool IsActive { get; set; } = true;

        // Rate Manage
        public bool RateManageView { get; set; }
        public bool RateManageAdd { get; set; }
        public bool RateManageEdit { get; set; }

        // Useful Links
        public bool UsefulLinksView { get; set; }
        public bool UsefulLinksAdd { get; set; }
        public bool UsefulLinksEdit { get; set; }

        // Sales Plan
        public bool SalesPlanView { get; set; }
        public bool SalesPlanAdd { get; set; }
        public bool SalesPlanEdit { get; set; }

        // Quotes
        public bool QuotesView { get; set; }
        public bool QuotesAdd { get; set; }
        public bool QuotesEdit { get; set; }

        // RFQ
        public bool RfqView { get; set; }
        public bool RfqAdd { get; set; }
        public bool RfqEdit { get; set; }

        // Contact
        public bool ContactView { get; set; }
        public bool ContactAdd { get; set; }
        public bool ContactEdit { get; set; }

        // Account
        public bool AccountView { get; set; }
        public bool AccountAdd { get; set; }
        public bool AccountEdit { get; set; }

        // System Management
        public bool SystemManagementView { get; set; }
        public bool SystemManagementAdd { get; set; }
        public bool SystemManagementEdit { get; set; }
    }
}