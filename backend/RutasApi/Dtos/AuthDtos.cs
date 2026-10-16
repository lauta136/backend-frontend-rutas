namespace RutasApi.Dtos;

public record RegisterRequest(string Username, string Email, string FullName, string Password);

public record LoginRequest(string Username, string Password);

public record UserProfile(int Id, string Username, string Email, string FullName, IReadOnlyList<string> Roles);

public record AuthResponse(string Token, DateTime ExpiresAt, UserProfile User);

public record RutaDto(
    int Id,
    string Nombre,
    string Descripcion,
    string Region,
    double DuracionHoras,
    string Dificultad,
    bool Publicada,
    string? CreadaPor);

public record RutaUpsertRequest(
    string Nombre,
    string Descripcion,
    string Region,
    double DuracionHoras,
    string Dificultad,
    bool Publicada);

public record UpdateRolesRequest(IReadOnlyList<string> Roles);
