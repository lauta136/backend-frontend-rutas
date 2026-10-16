using Microsoft.EntityFrameworkCore;
using RutasApi.Models;

namespace RutasApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Ruta> Rutas => Set<Ruta>();
    public DbSet<Favorito> Favoritos => Set<Favorito>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Role>()
            .HasIndex(r => r.Name)
            .IsUnique();

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });

            entity.HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Favorito>(entity =>
        {
            // Un usuario no puede guardar la misma ruta dos veces.
            entity.HasIndex(f => new { f.UserId, f.RutaId }).IsUnique();

            entity.HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.Ruta)
                .WithMany(r => r.Favoritos)
                .HasForeignKey(f => f.RutaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Ruta>(entity =>
        {
            entity.HasOne(r => r.CreadaPor)
                .WithMany()
                .HasForeignKey(r => r.CreadaPorId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
