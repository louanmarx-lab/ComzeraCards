using Microsoft.EntityFrameworkCore;
using Cards.Api.Models;

namespace Cards.Api.Data
{
    public class CardsDbContext : DbContext
    {
        public CardsDbContext(DbContextOptions<CardsDbContext> options) : base(options)
        {
        }

        public DbSet<Organization> Organizations { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<CardProfile> CardProfiles { get; set; }
        public DbSet<Lead> Leads { get; set; }
        public DbSet<TapAnalytics> TapAnalytics { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Organization self-reference hierarchy
            modelBuilder.Entity<Organization>()
                .HasOne(o => o.Parent)
                .WithMany(o => o.Children)
                .HasForeignKey(o => o.ParentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure User Organization relation
            modelBuilder.Entity<User>()
                .HasOne(o => o.Organization)
                .WithMany(o => o.Users)
                .HasForeignKey(o => o.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure User CardProfile relation (1-to-1)
            modelBuilder.Entity<CardProfile>()
                .HasOne(cp => cp.User)
                .WithOne(u => u.CardProfile)
                .HasForeignKey<CardProfile>(cp => cp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Lead CardProfile relation
            modelBuilder.Entity<Lead>()
                .HasOne(l => l.CardProfile)
                .WithMany(cp => cp.Leads)
                .HasForeignKey(l => l.CardProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure TapAnalytics CardProfile relation
            modelBuilder.Entity<TapAnalytics>()
                .HasOne(ta => ta.CardProfile)
                .WithMany(cp => cp.TapAnalytics)
                .HasForeignKey(ta => ta.CardProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // Add Unique Constraints and Indices
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<CardProfile>()
                .HasIndex(cp => cp.NfcToken)
                .IsUnique();
        }
    }
}
