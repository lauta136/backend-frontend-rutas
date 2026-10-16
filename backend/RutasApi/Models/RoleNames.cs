namespace RutasApi.Models;

/// <summary>
/// Nombres de rol centralizados para evitar errores de tipeo en los atributos [Authorize(Roles = ...)].
/// </summary>
public static class RoleNames
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string User = "User";

    public static readonly string[] All = [Admin, Manager, User];
}
