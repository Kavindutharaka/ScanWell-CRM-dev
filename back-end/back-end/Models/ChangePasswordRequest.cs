namespace back_end.Models
{
    public class ChangePasswordRequest
    {
        public int UserId { get; set; }           // user_roles.Id of the logged-in user
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
