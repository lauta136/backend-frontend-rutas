using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutasApi.Data;
using RutasApi.Dtos;
using RutasApi.Extensions;
using RutasApi.Models;

namespace RutasApi.Controllers;

/// <summary>
/// RUTA PRIVADA — requiere estar autenticado (token JWT válido), sin importar el rol.
/// El atributo [Authorize] a nivel de controlador protege todos los endpoints.
/// </summary>
[ApiController]
[Route("api/favoritos")]
[Authorize]
public class FavoritosController(AppDbContext db) : ControllerBase
{
    /// <summary>Lista las rutas favoritas del usuario autenticado.</summary>
    [HttpGet]
    [ProducesResponseType<IEnumerable<RutaDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<RutaDto>>> GetMine()
    {
        var userId = User.GetUserId();

        var favoritos = await db.Favoritos
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.GuardadoEn)
            .Select(f => new RutaDto(
                f.Ruta.Id, f.Ruta.Nombre, f.Ruta.Descripcion, f.Ruta.Region,
                f.Ruta.DuracionHoras, f.Ruta.Dificultad, f.Ruta.Publicada,
                f.Ruta.CreadaPor == null ? null : f.Ruta.CreadaPor.FullName))
            .ToListAsync();

        return Ok(favoritos);
    }

    /// <summary>Guarda una ruta como favorita para el usuario autenticado.</summary>
    [HttpPost("{rutaId:int}")]
    [ProducesResponseType<RutaDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RutaDto>> Add(int rutaId)
    {
        var userId = User.GetUserId();

        var ruta = await db.Rutas.FirstOrDefaultAsync(r => r.Id == rutaId && r.Publicada);
        if (ruta is null)
        {
            return NotFound(new { message = $"No existe una ruta pública con id {rutaId}." });
        }

        if (await db.Favoritos.AnyAsync(f => f.UserId == userId && f.RutaId == rutaId))
        {
            return Conflict(new { message = "Esa ruta ya está en tus favoritos." });
        }

        db.Favoritos.Add(new Favorito { UserId = userId, RutaId = rutaId });
        await db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new RutaDto(
            ruta.Id, ruta.Nombre, ruta.Descripcion, ruta.Region,
            ruta.DuracionHoras, ruta.Dificultad, ruta.Publicada, null));
    }

    /// <summary>Quita una ruta de favoritos del usuario autenticado.</summary>
    [HttpDelete("{rutaId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Remove(int rutaId)
    {
        var userId = User.GetUserId();

        var favorito = await db.Favoritos.FirstOrDefaultAsync(f => f.UserId == userId && f.RutaId == rutaId);
        if (favorito is null)
        {
            return NotFound(new { message = "Esa ruta no está en tus favoritos." });
        }

        db.Favoritos.Remove(favorito);
        await db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Contador simple usado por el dashboard privado.</summary>
    [HttpGet("resumen")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> Resumen()
    {
        var userId = User.GetUserId();
        var total = await db.Favoritos.CountAsync(f => f.UserId == userId);

        return Ok(new
        {
            usuario = User.GetUsername(),
            roles = User.GetRoles(),
            favoritos = total,
            mensaje = "Este endpoint solo responde con un JWT válido."
        });
    }
}
