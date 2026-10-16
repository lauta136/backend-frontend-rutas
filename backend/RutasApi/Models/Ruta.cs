namespace RutasApi.Models;

/// <summary>Ruta turística/senderista: contenido de dominio de la demo.</summary>
public class Ruta
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;

    /// <summary>Duración estimada en horas.</summary>
    public double DuracionHoras { get; set; }

    /// <summary>Dificultad: Baja, Media o Alta.</summary>
    public string Dificultad { get; set; } = "Media";

    /// <summary>Solo las rutas publicadas son visibles en el catálogo público.</summary>
    public bool Publicada { get; set; } = true;

    public DateTime CreadaEn { get; set; } = DateTime.UtcNow;

    /// <summary>Usuario que creó la ruta (requiere rol Admin o Manager).</summary>
    public int? CreadaPorId { get; set; }
    public User? CreadaPor { get; set; }

    public ICollection<Favorito> Favoritos { get; set; } = new List<Favorito>();
}
