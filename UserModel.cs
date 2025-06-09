using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
namespace webapi.Models;

public partial class UserModel
{
    public Guid UserId { get; set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public string? Role { get; set; }

    public string PasswordHash { get; set; } = null!;

    public virtual ICollection<CourseModel> CourseModels { get; set; } = new List<CourseModel>();

    public virtual ICollection<ResultModel> ResultModels { get; set; } = new List<ResultModel>();
}