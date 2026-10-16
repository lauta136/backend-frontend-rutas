using System.Security.Claims;

namespace RutasApi.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Id del usuario autenticado leído del claim "sub" / NameIdentifier.</summary>
    public static int GetUserId(this ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? principal.FindFirstValue("sub");

        return int.TryParse(raw, out var id) ? id : 0;
    }

    public static string GetUsername(this ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.Name) ?? "desconocido";

    public static IReadOnlyList<string> GetRoles(this ClaimsPrincipal principal) =>
        principal.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
}
