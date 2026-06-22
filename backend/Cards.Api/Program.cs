using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Cards.Api.Data;
using Cards.Api.Models;
using Cards.Api.Helpers;

namespace Cards.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Configure SQLite Database path
            var dbPath = Path.Combine(builder.Environment.ContentRootPath, "cards.db");
            builder.Services.AddDbContext<CardsDbContext>(options =>
                options.UseSqlite($"Data Source={dbPath}"));

            // Configure JWT Authentication
            var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretSecureJwtKeyCardsComzeraSuperSecret";
            var key = Encoding.ASCII.GetBytes(jwtKey);

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false, // Set to false for local testing simplicity
                    ValidateAudience = false,
                    ValidateLifetime = true
                };
            });

            // Add Controllers
            builder.Services.AddControllers();

            // Configure CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure HTTP Request Pipeline
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // Database Initializer & Seeder
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<CardsDbContext>();
                try
                {
                    context.Database.EnsureCreated();

                    // Seed holding group & subsidiaries if empty
                    if (!context.Organizations.Any())
                    {
                        var holdingOrg = new Organization
                        {
                            Name = "Comzera Group",
                            WebsiteUrl = "https://comzera.co.za",
                            LogoUrl = "/assets/logos/comzera.png",
                            Description = "Corporate holdings parent company."
                        };
                        context.Organizations.Add(holdingOrg);
                        context.SaveChanges();

                        var subsidiary1 = new Organization
                        {
                            ParentId = holdingOrg.Id,
                            Name = "Prosource",
                            WebsiteUrl = "https://prosource.co.za",
                            LogoUrl = "/assets/logos/prosource.png",
                            Description = "Staffing and recruitment solutions provider."
                        };

                        var subsidiary2 = new Organization
                        {
                            ParentId = holdingOrg.Id,
                            Name = "Comzera Solutions",
                            WebsiteUrl = "https://solutions.comzera.co.za",
                            LogoUrl = "/assets/logos/solutions.png",
                            Description = "Advanced cloud engineering and IT infrastructure services."
                        };

                        var subsidiary3 = new Organization
                        {
                            ParentId = holdingOrg.Id,
                            Name = "Contabilita",
                            WebsiteUrl = "https://contabilita.co.za",
                            LogoUrl = "/assets/logos/contabilita.png",
                            Description = "Professional accounting and corporate advisory."
                        };

                        context.Organizations.AddRange(subsidiary1, subsidiary2, subsidiary3);
                        context.SaveChanges();

                        // Seed users
                        var adminUser = new User
                        {
                            OrganizationId = holdingOrg.Id,
                            Email = "admin@comzera.com",
                            PasswordHash = PasswordHasher.HashPassword("AdminPass123"),
                            Role = "HoldingAdmin"
                        };

                        var subsidiaryAdmin = new User
                        {
                            OrganizationId = subsidiary1.Id,
                            Email = "manager@prosource.co.za",
                            PasswordHash = PasswordHasher.HashPassword("ManagerPass123"),
                            Role = "SubsidiaryAdmin"
                        };

                        var cardholderUser = new User
                        {
                            OrganizationId = subsidiary1.Id,
                            Email = "john.doe@prosource.co.za",
                            PasswordHash = PasswordHasher.HashPassword("JohnPass123"),
                            Role = "Cardholder"
                        };

                        context.Users.AddRange(adminUser, subsidiaryAdmin, cardholderUser);
                        context.SaveChanges();

                        // Seed CardProfile for John Doe
                        var johnProfile = new CardProfile
                        {
                            UserId = cardholderUser.Id,
                            NfcToken = "john-doe",
                            FullName = "John Doe",
                            Designation = "Senior Account Executive",
                            Email = "john.doe@prosource.co.za",
                            Phone = "+27 82 123 4567",
                            Bio = "Passionate about bridging corporate talent gaps and optimization strategies at Prosource.",
                            ProfileImageUrl = "/assets/profiles/john.jpg",
                            SocialLinksJson = "{\"LinkedIn\":\"https://linkedin.com/in/johndoe\",\"Twitter\":\"https://twitter.com/johndoe\"}",
                            IsActive = 1
                        };

                        context.CardProfiles.Add(johnProfile);
                        context.SaveChanges();
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Database initialization failed: {ex.Message}");
                }
            }

            app.UseCors("AllowFrontend");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
