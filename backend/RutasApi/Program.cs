using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using RutasApi.Data;
using RutasApi.Options;
using RutasApi.Services;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------- Configuración
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? new JwtOptions();

// La clave de firma NUNCA se versiona. Se resuelve, en orden, desde:
//   1) variable de entorno  Jwt__Key           (producción / CI)
//   2) user-secrets                             (solo en Development)
//   3) appsettings*.json                        -> debe quedar vacío en el repo
var claveEfimera = false;

if (string.IsNullOrWhiteSpace(jwtOptions.Key))
{
    if (!builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            "Falta 'Jwt:Key'. Definila con la variable de entorno Jwt__Key. " +
            "La API no arranca en producción sin una clave de firma propia.");
    }

    // Solo para desarrollo local: clave aleatoria por proceso.
    // Los tokens emitidos dejan de ser válidos al reiniciar la API.
    jwtOptions.Key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    claveEfimera = true;
}

if (jwtOptions.Key.Length < 32)
{
    throw new InvalidOperationException(
        "'Jwt:Key' debe tener al menos 32 caracteres (HMAC-SHA256).");
}

// Registramos la instancia ya resuelta para garantizar que JwtTokenService firme
// con exactamente la misma clave que valida el middleware de autenticación.
builder.Services.AddSingleton(Microsoft.Extensions.Options.Options.Create(jwtOptions));

// ---------------------------------------------------------------- Persistencia
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
                      ?? "Data Source=rutas.db"));

// ---------------------------------------------------------------- Servicios propios
builder.Services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();

// ---------------------------------------------------------------- Autenticación (JWT)
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

// ---------------------------------------------------------------- Autorización
// Sin políticas globales: cada controlador declara qué exige ([Authorize], [Authorize(Roles = ...)]).
builder.Services.AddAuthorization();

// ---------------------------------------------------------------- CORS (React en Vite)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

// ---------------------------------------------------------------- API + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Rutas API",
        Version = "v1",
        Description = """
            API de ejemplo para demostrar los tres tipos de rutas:

            - Públicas   -> /api/rutas            (sin autenticación)
            - Privadas   -> /api/favoritos, /api/auth/me  (JWT válido)
            - Por rol    -> /api/admin/rutas (Admin|Manager), /api/admin/usuarios (Admin)

            Usuarios semilla: admin/Admin123!, manager/Manager123!, user/User123!
            """
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Pega únicamente el token devuelto por /api/auth/login."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

var app = builder.Build();

if (claveEfimera)
{
    app.Logger.LogWarning(
        "Se generó una clave JWT EFÍMERA para desarrollo: al reiniciar la API los tokens dejan de ser válidos. " +
        "Para persistir sesiones ejecutá: dotnet user-secrets set \"Jwt:Key\" \"<clave de 32+ caracteres>\"");
}

// ---------------------------------------------------------------- Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Rutas API v1");
        c.DocumentTitle = "Rutas API — Demo de rutas públicas/privadas/por rol";
    });
}

app.UseCors("Frontend");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Endpoint público raíz: sirve de mapa de la API.
app.MapGet("/", () => Results.Ok(new
{
    api = "Rutas API",
    documentacion = "/swagger",
    rutasPublicas = new[] { "GET /api/rutas", "GET /api/rutas/{id}", "GET /api/rutas/regiones", "POST /api/auth/register", "POST /api/auth/login" },
    rutasPrivadas = new[] { "GET /api/auth/me", "GET /api/favoritos", "POST /api/favoritos/{rutaId}", "DELETE /api/favoritos/{rutaId}", "GET /api/favoritos/resumen" },
    rutasPorRol = new[] { "GET|POST|PUT|DELETE /api/admin/rutas (Admin, Manager)", "GET /api/admin/usuarios (Admin)", "PUT /api/admin/usuarios/{id}/roles (Admin)" }
}));

// ---------------------------------------------------------------- Seed de datos
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<AppDbContext>();
    var hasher = services.GetRequiredService<IPasswordHasher>();
    var logger = services.GetRequiredService<ILogger<Program>>();

    await DbSeeder.SeedAsync(db, hasher, logger);
}

app.Run();
