namespace back_end.Models
{
    public class EmployeeSalesTarget
    {
        public int? Id { get; set; }
        public string EmployeeId { get; set; }
        public int Year { get; set; }
        public decimal JanTarget { get; set; }
        public decimal FebTarget { get; set; }
        public decimal MarTarget { get; set; }
        public decimal AprTarget { get; set; }
        public decimal MayTarget { get; set; }
        public decimal JunTarget { get; set; }
        public decimal JulTarget { get; set; }
        public decimal AugTarget { get; set; }
        public decimal SepTarget { get; set; }
        public decimal OctTarget { get; set; }
        public decimal NovTarget { get; set; }
        public decimal DecTarget { get; set; }
        public decimal AnnualTarget { get; set; }
        public string? UpdatedBy { get; set; }
    }

    public class SalesTargetConfig
    {
        public int FinancialYearStart { get; set; }  // 1 = January, 4 = April
        public string? UpdatedBy { get; set; }
    }
}
