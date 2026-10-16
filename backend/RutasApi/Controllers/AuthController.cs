using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutasApi.Data;
using RutasApi.Dtos;
using RutasApi.Extensions;
using RutasApi.Models;
using RutasApi.Services;

namespace RutasApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AppDbContext db,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    ILogger<AuthController> logger) : ControllerBase
{
    /// <summary>
    /// Registro público. Cualquier visitante puede crear una cuenta y siempre
    /// recibe el rol "User" (no se puede auto-asignar Admin desde la API).
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Usuario, email y contraseña son obligatorios." });
        }

        if (request.Password.Length < 6)
        {
            return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres." });
        }

        var username = request.Username.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Username == username))
        {
            return Conflict(new { message = "Ese nombre de usuario ya está en uso." });
        }

        var userRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == RoleNames.User);
        if (userRole is null)
        {
            return Problem("Falta el rol base 'User'. Reinicia la API para volver a sembrar la base.");
        }

        var user = new User
        {
            Username = username,
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? username : request.FullName.Trim(),
            PasswordHash = passwordHasher.Hash(request.Password)
        };
        user.UserRoles.Add(new UserRole { RoleId = userRole.Id, Role = userRole });

        db.Users.Add(user);
        await db.SaveChangesAsync();

        logger.LogInformation("Nuevo usuario registrado: {Username}", user.Username);

        return StatusCode(StatusCodes.Status201Created, BuildAuthResponse(user, [userRole.Name]));
    }

    /// <summary>Autentica credenciales y devuelve el token JWT.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var username = (request.Username ?? string.Empty).Trim().ToLowerInvariant();

        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username == username);

        if (user is null || !passwordHasher.Verify(request.Password ?? string.Empty, user.PasswordHash))
        {
            return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
        }

        return Ok(BuildAuthResponse(user, user.UserRoles.Select(ur => ur.Role.Name)));
    }

    /// <summary>Devuelve el perfil del usuario que envía el token (ruta privada).</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType<UserProfile>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserProfile>> Me()
    {
        var id = User.GetUserId();
        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        return user is null
            ? NotFound(new { message = "El usuario del token ya no existe." })
            : Ok(ToProfile(user));
    }

    private AuthResponse BuildAuthResponse(User user, IEnumerable<string> roles)
    {
        var roleList = roles.Distinct().OrderBy(r => r).ToList();
        var (token, expiresAt) = tokenService.CreateToken(user, roleList);
        return new AuthResponse(token, expiresAt, ToProfile(user, roleList));
    }

    private static UserProfile ToProfile(User user, IEnumerable<string>? roles = null)
    {
        var roleList = (roles ?? user.UserRoles.Select(ur => ur.Role.Name))
            .Distinct()
            .OrderBy(r => r)
            .ToList();

        return new UserProfile(user.Id, user.Username, user.Email, user.FullName, roleList);
    }
}
