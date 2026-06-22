using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Cards.Api.Data;
using Cards.Api.Models;

namespace Cards.Api.Controllers
{
    [ApiController]
    [Route("api/v1/cards")]
    public class CardsController : ControllerBase
    {
        private readonly CardsDbContext _context;

        public CardsController(CardsDbContext context)
        {
            _context = context;
        }

        public class CreateCardRequest
        {
            public string Email { get; set; } = string.Empty;
            public string FullName { get; set; } = string.Empty;
            public string Designation { get; set; } = string.Empty;
            public string NfcToken { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Bio { get; set; } = string.Empty;
            public int OrganizationId { get; set; }
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetCards()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var orgIdClaim = User.FindFirst("OrganizationId")?.Value;

            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Unauthorized user context." });
            }

            int orgId = int.TryParse(orgIdClaim, out var parsedOrgId) ? parsedOrgId : 0;

            IQueryable<CardProfile> query = _context.CardProfiles
                .Include(cp => cp.User)
                .ThenInclude(u => u.Organization);

            if (roleClaim == "Cardholder")
            {
                query = query.Where(cp => cp.UserId == userId);
            }
            else if (roleClaim == "SubsidiaryAdmin")
            {
                query = query.Where(cp => cp.User.OrganizationId == orgId);
            }

            var profiles = await query
                .OrderBy(cp => cp.FullName)
                .Select(cp => new
                {
                    profileId = cp.Id,
                    nfcToken = cp.NfcToken,
                    fullName = cp.FullName,
                    designation = cp.Designation,
                    email = cp.Email,
                    phone = cp.Phone,
                    bio = cp.Bio,
                    isActive = cp.IsActive,
                    organizationName = cp.User.Organization.Name
                })
                .ToListAsync();

            return Ok(profiles);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateCard([FromBody] CreateCardRequest request)
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            if (roleClaim != "HoldingAdmin" && roleClaim != "SubsidiaryAdmin")
            {
                return Forbid();
            }

            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.FullName) || string.IsNullOrEmpty(request.NfcToken))
            {
                return BadRequest(new { error = "Email, FullName, and NfcToken are required fields." });
            }

            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (emailExists)
            {
                return BadRequest(new { error = "Email is already registered." });
            }

            var tokenExists = await _context.CardProfiles.AnyAsync(cp => cp.NfcToken.ToLower() == request.NfcToken.ToLower());
            if (tokenExists)
            {
                return BadRequest(new { error = "NFC Token is already in use." });
            }

            var orgExists = await _context.Organizations.AnyAsync(o => o.Id == request.OrganizationId);
            if (!orgExists)
            {
                return BadRequest(new { error = "Invalid OrganizationId." });
            }

            var user = new User
            {
                Email = request.Email,
                PasswordHash = Helpers.PasswordHasher.HashPassword("TempPass123!"),
                Role = "Cardholder",
                OrganizationId = request.OrganizationId
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var cardProfile = new CardProfile
            {
                UserId = user.Id,
                NfcToken = request.NfcToken,
                FullName = request.FullName,
                Designation = request.Designation,
                Email = request.Email,
                Phone = request.Phone,
                Bio = request.Bio,
                SocialLinksJson = "{}",
                IsActive = 1
            };
            _context.CardProfiles.Add(cardProfile);
            await _context.SaveChangesAsync();

            return StatusCode(201, new
            {
                message = "Card profile provisioned successfully.",
                profileId = cardProfile.Id,
                nfcToken = cardProfile.NfcToken
            });
        }

        public class UpdateProfileRequest
        {
            public string FullName { get; set; } = string.Empty;
            public string Designation { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Bio { get; set; } = string.Empty;
            public string ProfileImageUrl { get; set; } = string.Empty;
            public string SocialLinksJson { get; set; } = "{}";
        }

        [HttpGet("{nfcToken}")]
        public async Task<IActionResult> GetCard(string nfcToken)
        {
            var profile = await _context.CardProfiles
                .Include(cp => cp.User)
                .ThenInclude(u => u.Organization)
                .FirstOrDefaultAsync(cp => cp.NfcToken == nfcToken && cp.IsActive == 1);

            if (profile == null)
            {
                return NotFound(new { error = "Card profile not found or inactive." });
            }

            // Track tap event in background analytics
            var analytics = new TapAnalytics
            {
                CardProfileId = profile.Id,
                Referrer = Request.Headers["Referer"].ToString() ?? "Direct Tap"
            };
            _context.TapAnalytics.Add(analytics);
            await _context.SaveChangesAsync();

            // Find sister companies (companies under the same holding parent, excluding the cardholder's company)
            var orgId = profile.User?.OrganizationId;
            var org = await _context.Organizations.FindAsync(orgId);

            var sisterCompanies = Enumerable.Empty<Organization>().ToList();
            if (org != null && org.ParentId != null)
            {
                sisterCompanies = await _context.Organizations
                    .Where(o => o.ParentId == org.ParentId && o.Id != org.Id)
                    .ToListAsync();
            }
            else if (org != null && org.ParentId == null)
            {
                // If it is the holding company itself, get all child subsidiaries
                sisterCompanies = await _context.Organizations
                    .Where(o => o.ParentId == org.Id)
                    .ToListAsync();
            }

            return Ok(new
            {
                profile = new
                {
                    profileId = profile.Id,
                    nfcToken = profile.NfcToken,
                    fullName = profile.FullName,
                    designation = profile.Designation,
                    email = profile.Email,
                    phone = profile.Phone,
                    bio = profile.Bio,
                    profileImageUrl = profile.ProfileImageUrl,
                    socialLinks = JsonSerializer.Deserialize<object>(profile.SocialLinksJson) ?? new {},
                    organizationName = profile.User?.Organization?.Name ?? ""
                },
                sisterCompanies = sisterCompanies.Select(s => new
                {
                    id = s.Id,
                    name = s.Name,
                    websiteUrl = s.WebsiteUrl,
                    logoUrl = s.LogoUrl,
                    description = s.Description
                })
            });
        }

        [HttpGet("{nfcToken}/vcard")]
        public async Task<IActionResult> DownloadVCard(string nfcToken)
        {
            var profile = await _context.CardProfiles
                .Include(cp => cp.User)
                .ThenInclude(u => u.Organization)
                .FirstOrDefaultAsync(cp => cp.NfcToken == nfcToken && cp.IsActive == 1);

            if (profile == null)
            {
                return NotFound(new { error = "Card profile not found." });
            }

            // Split name into first and last
            var names = profile.FullName.Split(' ', 2);
            string firstName = names[0];
            string lastName = names.Length > 1 ? names[1] : "";

            var sb = new StringBuilder();
            sb.AppendLine("BEGIN:VCARD");
            sb.AppendLine("VERSION:3.0");
            sb.AppendLine($"N:{lastName};{firstName};;;");
            sb.AppendLine($"FN:{profile.FullName}");
            sb.AppendLine($"ORG:{profile.User?.Organization?.Name ?? "Comzera Group"}");
            sb.AppendLine($"TITLE:{profile.Designation}");
            sb.AppendLine($"TEL;TYPE=CELL,VOICE:{profile.Phone}");
            sb.AppendLine($"EMAIL;TYPE=PREF,INTERNET:{profile.Email}");
            sb.AppendLine($"NOTE:{profile.Bio}");
            sb.AppendLine("END:VCARD");

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var stream = new MemoryStream(bytes);
            return File(stream, "text/vcard", $"{profile.FullName.Replace(" ", "_")}.vcf");
        }

        [Authorize]
        [HttpPut("my-profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Unauthorized user context." });
            }

            var profile = await _context.CardProfiles.FirstOrDefaultAsync(cp => cp.UserId == userId);
            if (profile == null)
            {
                return NotFound(new { error = "Card profile not found." });
            }

            profile.FullName = request.FullName;
            profile.Designation = request.Designation;
            profile.Email = request.Email;
            profile.Phone = request.Phone;
            profile.Bio = request.Bio;
            profile.ProfileImageUrl = request.ProfileImageUrl;
            profile.SocialLinksJson = request.SocialLinksJson;
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Profile updated successfully." });
        }
    }
}
