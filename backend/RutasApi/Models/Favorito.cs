namespace RutasApi.Models;

/// <summary>Ruta guardada como favorita por un usuario autenticado.</summary>
public class Favorito
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int RutaId { get; set; }
    public Ruta Ruta { get; set; } = null!;

    public DateTime GuardadoEn { get; set; } = DateTime.UtcNow;
}
