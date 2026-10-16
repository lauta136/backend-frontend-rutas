using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutasApi.Data;
using RutasApi.Dtos;
using RutasApi.Extensions;
using RutasApi.Models;

namespace RutasApi.Controllers;

/// <summary>
/// RUTA PRIVADA PROTEGIDA POR ROL — requiere autenticación + el rol Admin o Manager.
/// Cualquier usuario autenticado sin esos roles recibe 403 Forbidden.
/// </summary>
[ApiController]
[Route("api/admin/rutas")]
[Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Manager}")]
public class RutasAdminController(AppDbContext db) : ControllerBase
{
    /// <summary>Lista todas las rutas, incluidas las no publicadas.</summary>
    [HttpGet]
    [ProducesResponseType<IEnumerable<RutaDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<RutaDto>>> GetAll()
    {
        var rutas = await db.Rutas
            .AsNoTracking()
            .OrderBy(r => r.Id)
            .Select(r => new RutaDto(
                r.Id, r.Nombre, r.Descripcion, r.Region, r.DuracionHoras, r.Dificultad, r.Publicada,
                r.CreadaPor != null ? r.CreadaPor.FullName : null))
            .ToListAsync();

        return Ok(rutas);
    }

    /// <summary>Crea una ruta nueva.</summary>
    [HttpPost]
    [ProducesResponseType<RutaDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<RutaDto>> Create(RutaUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
        {
            return BadRequest(new { message = "El nombre de la ruta es obligatorio." });
        }

        var ruta = new Ruta
        {
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion?.Trim() ?? string.Empty,
            Region = request.Region?.Trim() ?? string.Empty,
            DuracionHoras = request.DuracionHoras,
            Dificultad = string.IsNullOrWhiteSpace(request.Dificultad) ? "Media" : request.Dificultad,
            Publicada = request.Publicada,
            CreadaPorId = User.GetUserId()
        };

        db.Rutas.Add(ruta);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(RutasPublicasController.GetById), "RutasPublicas",
            new { id = ruta.Id }, ToDto(ruta));
    }

    /// <summary>Actualiza una ruta existente.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType<RutaDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<RutaDto>> Update(int id, RutaUpsertRequest request)
    {
        var ruta = await db.Rutas.Include(r => r.CreadaPor).FirstOrDefaultAsync(r => r.Id == id);
        if (ruta is null)
        {
            return NotFound(new { message = $"No existe la ruta {id}." });
        }

        ruta.Nombre = request.Nombre.Trim();
        ruta.Descripcion = request.Descripcion?.Trim() ?? string.Empty;
        ruta.Region = request.Region?.Trim() ?? string.Empty;
        ruta.DuracionHoras = request.DuracionHoras;
        ruta.Dificultad = string.IsNullOrWhiteSpace(request.Dificultad) ? ruta.Dificultad : request.Dificultad;
        ruta.Publicada = request.Publicada;

        await db.SaveChangesAsync();
        return Ok(ToDto(ruta));
    }

    /// <summary>Elimina una ruta.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(int id)
    {
        var ruta = await db.Rutas.FindAsync(id);
        if (ruta is null)
        {
            return NotFound(new { message = $"No existe la ruta {id}." });
        }

        db.Rutas.Remove(ruta);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static RutaDto ToDto(Ruta r) => new(
        r.Id, r.Nombre, r.Descripcion, r.Region, r.DuracionHoras, r.Dificultad, r.Publicada,
        r.CreadaPor?.FullName);
}
