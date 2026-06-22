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

        [HttpGet]
        public async Task<IActionResult> GetOrganizations()
        {
            // Return all organizations
            var orgs = await _context.Organizations.ToListAsync();
            return Ok(orgs);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateOrganization([FromBody] OrgCreateRequest request)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "HoldingAdmin" && role != "SubsidiaryAdmin")
            {
                return Forbid();
            }

            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(new { error = "Name is required." });
            }

            // Find Comzera Group holding ID if parent ID is null
            int? parentId = request.ParentId;
            if (parentId == null)
            {
                var holding = await _context.Organizations.FirstOrDefaultAsync(o => o.ParentId == null);
                if (holding != null)
                {
                    parentId = holding.Id;
                }
            }

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
