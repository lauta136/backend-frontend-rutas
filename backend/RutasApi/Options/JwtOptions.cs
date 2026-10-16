namespace RutasApi.Options;

/// <summary>
/// Configuración del token JWT, enlazada desde la sección "Jwt" de appsettings.json.
/// </summary>
public class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>Clave simétrica usada para firmar el token (HMAC-SHA256).</summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>Emisor del token (iss).</summary>
    public string Issuer { get; set; } = "RutasApi";

    /// <summary>Audiencia del token (aud).</summary>
    public string Audience { get; set; } = "RutasApp";

    /// <summary>Minutos de vigencia del token.</summary>
    public int ExpiryMinutes { get; set; } = 60;
}
