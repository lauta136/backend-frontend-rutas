using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutasApi.Data;
using RutasApi.Dtos;
using RutasApi.Models;

namespace RutasApi.Controllers;

/// <summary>
/// RUTA PRIVADA PROTEGIDA POR ROL (exclusiva de Admin).
/// Un usuario con rol Manager obtiene 403 aquí, aunque sí pueda administrar rutas.
/// </summary>
[ApiController]
[Route("api/admin/usuarios")]
[Authorize(Roles = RoleNames.Admin)]
public class UsuariosAdminController(AppDbContext db) : ControllerBase
{
    /// <summary>Lista los usuarios registrados con sus roles.</summary>
    [HttpGet]
    [ProducesResponseType<IEnumerable<UserProfile>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<UserProfile>>> GetAll()
    {
        var usuarios = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .OrderBy(u => u.Id)
            .Select(u => new UserProfile(
                u.Id, u.Username, u.Email, u.FullName,
                u.UserRoles.Select(ur => ur.Role.Name).ToList()))
            .ToListAsync();

        return Ok(usuarios);
    }

    /// <summary>Reemplaza los roles de un usuario. Solo Admin puede hacerlo.</summary>
    [HttpPut("{id:int}/roles")]
    [ProducesResponseType<UserProfile>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserProfile>> UpdateRoles(int id, UpdateRolesRequest request)
    {
        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
        {
            return NotFound(new { message = $"No existe el usuario {id}." });
        }

        var solicitados = request.Roles
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var rolesDb = await db.Roles
            .Where(r => solicitados.Contains(r.Name))
            .ToListAsync();

        var desconocidos = solicitados
            .Where(s => !rolesDb.Any(r => string.Equals(r.Name, s, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        if (desconocidos.Count > 0)
        {
            return BadRequest(new
            {
                message = $"Roles inexistentes: {string.Join(", ", desconocidos)}. Válidos: {string.Join(", ", RoleNames.All)}."
            });
        }

        if (rolesDb.Count == 0)
        {
            return BadRequest(new { message = "El usuario debe tener al menos un rol." });
        }

        db.UserRoles.RemoveRange(user.UserRoles);
        user.UserRoles.Clear();

        foreach (var rol in rolesDb)
        {
            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = rol.Id, Role = rol });
        }

        await db.SaveChangesAsync();

        return Ok(new UserProfile(
            user.Id, user.Username, user.Email, user.FullName,
            rolesDb.Select(r => r.Name).OrderBy(r => r).ToList()));
    }
}
