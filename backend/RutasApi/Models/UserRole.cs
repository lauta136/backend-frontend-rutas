namespace RutasApi.Models;

/// <summary>Tabla intermedia de la relación muchos-a-muchos entre usuarios y roles.</summary>
public class UserRole
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
}
