using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutasApi.Data;
using RutasApi.Dtos;

namespace RutasApi.Controllers;

/// <summary>
/// RUTA PÚBLICA — accesible para cualquier usuario, autenticado o no.
/// No lleva [Authorize]; además se marca [AllowAnonymous] de forma explícita
/// para que la intención quede documentada (y para que ninguna política global la tape).
/// </summary>
[ApiController]
[Route("api/rutas")]
[AllowAnonymous]
public class RutasPublicasController(AppDbContext db) : ControllerBase
{
    /// <summary>Catálogo público: solo las rutas marcadas como publicadas.</summary>
    [HttpGet]
    [ProducesResponseType<IEnumerable<RutaDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RutaDto>>> GetAll([FromQuery] string? region)
    {
        var query = db.Rutas.Where(r => r.Publicada);

        if (!string.IsNullOrWhiteSpace(region))
        {
            query = query.Where(r => r.Region == region);
        }

        var rutas = await query
            .AsNoTracking()
            .OrderBy(r => r.Nombre)
            .Select(r => new RutaDto(
                r.Id, r.Nombre, r.Descripcion, r.Region, r.DuracionHoras, r.Dificultad, r.Publicada,
                r.CreadaPor != null ? r.CreadaPor.FullName : null))
            .ToListAsync();

        return Ok(rutas);
    }

    /// <summary>Detalle público de una ruta publicada.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType<RutaDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RutaDto>> GetById(int id)
    {
        var ruta = await db.Rutas
            .AsNoTracking()
            .Where(r => r.Id == id && r.Publicada)
            .Select(r => new RutaDto(
                r.Id, r.Nombre, r.Descripcion, r.Region, r.DuracionHoras, r.Dificultad, r.Publicada,
                r.CreadaPor != null ? r.CreadaPor.FullName : null))
            .FirstOrDefaultAsync();

        return ruta is null
            ? NotFound(new { message = $"No existe una ruta pública con id {id}." })
            : Ok(ruta);
    }

    /// <summary>Regiones con rutas publicadas, para armar filtros en el frontend.</summary>
    [HttpGet("regiones")]
    [ProducesResponseType<IEnumerable<string>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<string>>> GetRegiones()
    {
        var regiones = await db.Rutas
            .Where(r => r.Publicada)
            .Select(r => r.Region)
            .Distinct()
            .OrderBy(r => r)
            .ToListAsync();

        return Ok(regiones);
    }
}
