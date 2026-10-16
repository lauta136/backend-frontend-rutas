using Microsoft.EntityFrameworkCore;
using RutasApi.Models;
using RutasApi.Services;

namespace RutasApi.Data;

/// <summary>
/// Crea la base SQLite si no existe y carga roles, usuarios y rutas de ejemplo.
/// Los usuarios semilla son la forma más rápida de probar las 3 clases de rutas.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IPasswordHasher passwordHasher, ILogger logger)
    {
        await db.Database.EnsureCreatedAsync();

        if (!await db.Roles.AnyAsync())
        {
            db.Roles.AddRange(
                new Role { Name = RoleNames.Admin, Description = "Acceso total, incluida la gestión de usuarios" },
                new Role { Name = RoleNames.Manager, Description = "Puede crear y editar rutas" },
                new Role { Name = RoleNames.User, Description = "Usuario autenticado estándar" });

            await db.SaveChangesAsync();
            logger.LogInformation("Roles creados: {Roles}", string.Join(", ", RoleNames.All));
        }

        if (!await db.Users.AnyAsync())
        {
            var roles = await db.Roles.ToDictionaryAsync(r => r.Name);

            var admin = NewUser("admin", "admin@rutas.local", "Ana Administradora", "Admin123!", passwordHasher, roles[RoleNames.Admin], roles[RoleNames.Manager], roles[RoleNames.User]);
            var manager = NewUser("manager", "manager@rutas.local", "Marcos Manager", "Manager123!", passwordHasher, roles[RoleNames.Manager], roles[RoleNames.User]);
            var user = NewUser("user", "user@rutas.local", "Lucía Usuaria", "User123!", passwordHasher, roles[RoleNames.User]);

            db.Users.AddRange(admin, manager, user);
            await db.SaveChangesAsync();

            db.Rutas.AddRange(
                new Ruta { Nombre = "Circuito Lago Espejo", Descripcion = "Paseo circular de baja dificultad con vistas al lago.", Region = "Patagonia", DuracionHoras = 2.5, Dificultad = "Baja", CreadaPorId = manager.Id },
                new Ruta { Nombre = "Sendero Cerro Ventana", Descripcion = "Ascenso con pendiente sostenida y mirador natural.", Region = "Sierras", DuracionHoras = 5, Dificultad = "Media", CreadaPorId = manager.Id },
                new Ruta { Nombre = "Travesía Alta Montaña", Descripcion = "Ruta exigente de dos jornadas con acampe.", Region = "Cordillera", DuracionHoras = 16, Dificultad = "Alta", CreadaPorId = admin.Id },
                new Ruta { Nombre = "Bosque de Arrayanes", Descripcion = "Recorrido interpretativo por bosque nativo (próximamente).", Region = "Patagonia", DuracionHoras = 1.5, Dificultad = "Baja", Publicada = false, CreadaPorId = manager.Id });

            await db.SaveChangesAsync();
            logger.LogInformation("Usuarios y rutas de ejemplo creados.");
        }
    }

    private static User NewUser(string username, string email, string fullName, string password, IPasswordHasher hasher, params Role[] roles)
    {
        var user = new User
        {
            Username = username,
            Email = email,
            FullName = fullName,
            PasswordHash = hasher.Hash(password)
        };

        foreach (var role in roles)
        {
            user.UserRoles.Add(new UserRole { RoleId = role.Id, Role = role });
        }

        return user;
    }
}
