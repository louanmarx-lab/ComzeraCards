using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Cards.Api.Data;
using Cards.Api.Models;
using Cards.Api.Helpers;

namespace Cards.Api.Controllers
{
    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController : ControllerBase
    {
        private readonly CardsDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(CardsDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class RegisterRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Role { get; set; } = "Cardholder"; // 'HoldingAdmin', 'SubsidiaryAdmin', 'Cardholder'
            public int OrganizationId { get; set; }
            public string FullName { get; set; } = string.Empty;
            public string Designation { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { error = "Email and Password are required." });
            }

            var user = await _context.Users
                .Include(u => u.CardProfile)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { error = "Invalid email or password." });
            }

            var token = TokenHelper.GenerateToken(user, _configuration);

            return Ok(new
            {
                token = token,
                role = user.Role,
                email = user.Email,
                organizationId = user.OrganizationId,
                userId = user.Id,
                fullName = user.CardProfile?.FullName ?? user.Email,
                nfcToken = user.CardProfile?.NfcToken
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { error = "Email and Password are required." });
            }

            var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (exists)
            {
                return BadRequest(new { error = "Email is already registered." });
            }

            var orgExists = await _context.Organizations.AnyAsync(o => o.Id == request.OrganizationId);
            if (!orgExists)
            {
                return BadRequest(new { error = "Invalid OrganizationId." });
            }

            var user = new User
            {
                Email = request.Email,
                PasswordHash = PasswordHasher.HashPassword(request.Password),
                Role = request.Role,
                OrganizationId = request.OrganizationId
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Auto-create a CardProfile if the user role is Cardholder
            if (user.Role == "Cardholder")
            {
                var uniqueToken = request.Email.Split('@')[0] + "-" + System.Guid.NewGuid().ToString().Substring(0, 4);
                var cardProfile = new CardProfile
                {
                    UserId = user.Id,
                    NfcToken = uniqueToken,
                    FullName = request.FullName,
                    Designation = request.Designation,
                    Email = request.Email,
                    Phone = "",
                    Bio = "",
                    ProfileImageUrl = "",
                    SocialLinksJson = "{}"
                };
                _context.CardProfiles.Add(cardProfile);
                await _context.SaveChangesAsync();
            }

            return StatusCode(201, new { message = "User registered successfully." });
        }
    }
}
