using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Cards.Api.Data;
using Cards.Api.Models;

namespace Cards.Api.Controllers
{
    [ApiController]
    [Route("api/v1/organizations")]
    public class OrganizationsController : ControllerBase
    {
        private readonly CardsDbContext _context;

        public OrganizationsController(CardsDbContext context)
        {
            _context = context;
        }

        public class OrgCreateRequest
        {
            public string Name { get; set; } = string.Empty;
            public string WebsiteUrl { get; set; } = string.Empty;
            public string LogoUrl { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public int? ParentId { get; set; }
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetOrganizations()
        {
            var orgIdClaim = User.FindFirst("OrganizationId")?.Value;
            if (string.IsNullOrEmpty(orgIdClaim) || !int.TryParse(orgIdClaim, out int userOrgId))
            {
                return Unauthorized(new { error = "No organization ID associated with user." });
            }

            var userOrg = await _context.Organizations.FindAsync(userOrgId);
            if (userOrg == null)
            {
                return NotFound(new { error = "User organization not found." });
            }

            var rootParentId = userOrg.ParentId ?? userOrg.Id;

            // Return only organizations in the user's group hierarchy
            var orgs = await _context.Organizations
                .Where(o => o.Id == rootParentId || o.ParentId == rootParentId)
                .ToListAsync();

            return Ok(orgs);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateOrganization([FromBody] OrgCreateRequest request)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var orgIdClaim = User.FindFirst("OrganizationId")?.Value;

            if (role != "HoldingAdmin" && role != "SubsidiaryAdmin")
            {
                return Forbid();
            }

            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(new { error = "Name is required." });
            }

            if (string.IsNullOrEmpty(orgIdClaim) || !int.TryParse(orgIdClaim, out int userOrgId))
            {
                return Unauthorized(new { error = "No organization ID associated with user." });
            }

            var userOrg = await _context.Organizations.FindAsync(userOrgId);
            if (userOrg == null)
            {
                return BadRequest(new { error = "User organization not found." });
            }

            // Subsidiaries must belong to the user's root group organization
            int? parentId = userOrg.ParentId ?? userOrg.Id;

            var org = new Organization
            {
                Name = request.Name,
                WebsiteUrl = request.WebsiteUrl,
                LogoUrl = request.LogoUrl,
                Description = request.Description,
                ParentId = parentId
            };

            _context.Organizations.Add(org);
            await _context.SaveChangesAsync();

            return StatusCode(201, org);
        }

        public class AddHoldingRequest
        {
            public string Name { get; set; } = string.Empty;
            public string WebsiteUrl { get; set; } = string.Empty;
            public string LogoUrl { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
        }

        [Authorize]
        [HttpPost("add-parent-holding")]
        public async Task<IActionResult> AddParentHolding([FromBody] AddHoldingRequest request)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var orgIdClaim = User.FindFirst("OrganizationId")?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (role != "HoldingAdmin")
            {
                return Forbid();
            }

            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(new { error = "Name is required." });
            }

            if (string.IsNullOrEmpty(orgIdClaim) || !int.TryParse(orgIdClaim, out int userOrgId))
            {
                return Unauthorized(new { error = "No organization ID associated with user." });
            }

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var userOrg = await _context.Organizations.FindAsync(userOrgId);
            if (userOrg == null)
            {
                return NotFound(new { error = "User organization not found." });
            }

            if (userOrg.ParentId != null)
            {
                return BadRequest(new { error = "This company already has a parent holding company." });
            }

            // Create the new parent holding company
            var newHoldingOrg = new Organization
            {
                Name = request.Name.Trim(),
                WebsiteUrl = request.WebsiteUrl,
                LogoUrl = request.LogoUrl,
                Description = request.Description,
                ParentId = null
            };

            _context.Organizations.Add(newHoldingOrg);
            await _context.SaveChangesAsync();

            // Link current company to the new holding company
            userOrg.ParentId = newHoldingOrg.Id;

            // Move the admin user to the new holding company organization
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.OrganizationId = newHoldingOrg.Id;
            }

            await _context.SaveChangesAsync();

            // Generate a new token with the updated OrganizationId claim
            var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var newToken = Helpers.TokenHelper.GenerateToken(user!, configuration);

            return Ok(new
            {
                message = "Parent holding company added successfully.",
                token = newToken,
                organizationId = newHoldingOrg.Id,
                organization = newHoldingOrg
            });
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrganization(int id, [FromBody] OrgCreateRequest request)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "HoldingAdmin" && role != "SubsidiaryAdmin")
            {
                return Forbid();
            }

            var org = await _context.Organizations.FindAsync(id);
            if (org == null)
            {
                return NotFound(new { error = "Organization not found." });
            }

            org.Name = request.Name;
            org.WebsiteUrl = request.WebsiteUrl;
            org.LogoUrl = request.LogoUrl;
            org.Description = request.Description;
            if (request.ParentId != null)
            {
                org.ParentId = request.ParentId;
            }

            await _context.SaveChangesAsync();
            return Ok(org);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrganization(int id)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "HoldingAdmin")
            {
                return Forbid();
            }

            var org = await _context.Organizations.FindAsync(id);
            if (org == null)
            {
                return NotFound(new { error = "Organization not found." });
            }

            if (org.ParentId == null)
            {
                return BadRequest(new { error = "Cannot delete the root holding organization." });
            }

            _context.Organizations.Remove(org);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Organization deleted successfully." });
        }
    }
}
