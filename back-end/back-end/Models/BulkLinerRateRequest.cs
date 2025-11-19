// Models/Rate.cs
using System;
using System.Collections.Generic;

namespace back_end.Models
{
    public class BulkLinerRateRequest
{
    public List<LinerRateUpload> rates { get; set; }
}

public class LinerRateUpload
{
    public string freightType { get; set; }
    public string origin { get; set; }
    public string destination { get; set; }
    public string airline { get; set; }
    public string liner { get; set; }
    public string route { get; set; }
    public string surcharges { get; set; }
    public int? transitTime { get; set; }
    public string transshipmentTime { get; set; }
    public string frequency { get; set; }
    public string routingType { get; set; }
    public string validateDate { get; set; }
    public string note { get; set; }
    public string remark { get; set; }
    public string owner { get; set; }
    public string currency { get; set; }
    public string category { get; set; }
    public string rateDataJson { get; set; }
}
}