using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Cards.Api.Data;
using Cards.Api.Models;

namespace Cards.Api.Controllers
{
    [ApiController]
    [Route("api/v1/leads")]
    public class LeadsController : ControllerBase
    {
        private readonly CardsDbContext _context;

        public LeadsController(CardsDbContext context)
        {
            _context = context;
        }

        public class LeadSubmissionRequest
        {
            public int CardProfileId { get; set; }
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string CompanyName { get; set; } = string.Empty;
            public string Notes { get; set; } = string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> SubmitLead([FromBody] LeadSubmissionRequest request)
        {
            if (string.IsNullOrEmpty(request.FullName) || string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { error = "Name and Email are required fields." });
            }

            var profileExists = await _context.CardProfiles.AnyAsync(cp => cp.Id == request.CardProfileId);
            if (!profileExists)
            {
                return BadRequest(new { error = "Invalid CardProfileId." });
            }

            var lead = new Lead
            {
                CardProfileId = request.CardProfileId,
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                CompanyName = request.CompanyName,
                Notes = request.Notes
            };

            _context.Leads.Add(lead);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "Lead captured successfully.", leadId = lead.Id });
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetLeads()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var orgIdClaim = User.FindFirst("OrganizationId")?.Value;

            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Unauthorized user context." });
            }

            int orgId = int.TryParse(orgIdClaim, out var parsedOrgId) ? parsedOrgId : 0;

            IQueryable<Lead> query = _context.Leads
                .Include(l => l.CardProfile)
                .ThenInclude(cp => cp.User);

            if (roleClaim == "Cardholder")
            {
                query = query.Where(l => l.CardProfile.UserId == userId);
            }
            else if (roleClaim == "SubsidiaryAdmin")
            {
                query = query.Where(l => l.CardProfile.User.OrganizationId == orgId);
            }
            else if (roleClaim == "HoldingAdmin")
            {
                var userOrg = await _context.Organizations.FindAsync(orgId);
                if (userOrg != null)
                {
                    var rootParentId = userOrg.ParentId ?? userOrg.Id;
                    query = query.Where(l => l.CardProfile.User.OrganizationId == rootParentId || l.CardProfile.User.Organization.ParentId == rootParentId);
                }
                else
                {
                    query = query.Where(l => l.CardProfile.User.OrganizationId == orgId);
                }
            }

            var leadsList = await query
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => new
                {
                    l.Id,
                    l.FullName,
                    l.Email,
                    l.Phone,
                    l.CompanyName,
                    l.Notes,
                    l.CreatedAt,
                    CardholderName = l.CardProfile.FullName
                })
                .ToListAsync();

            return Ok(leadsList);
        }

        [Authorize]
        [HttpGet("export")]
        public async Task<IActionResult> ExportLeads()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var orgIdClaim = User.FindFirst("OrganizationId")?.Value;

            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Unauthorized user context." });
            }

            int orgId = int.TryParse(orgIdClaim, out var parsedOrgId) ? parsedOrgId : 0;

            IQueryable<Lead> query = _context.Leads
                .Include(l => l.CardProfile)
                .ThenInclude(cp => cp.User);

            if (roleClaim == "Cardholder")
            {
                query = query.Where(l => l.CardProfile.UserId == userId);
            }
            else if (roleClaim == "SubsidiaryAdmin")
            {
                query = query.Where(l => l.CardProfile.User.OrganizationId == orgId);
            }
            else if (roleClaim == "HoldingAdmin")
            {
                var userOrg = await _context.Organizations.FindAsync(orgId);
                if (userOrg != null)
                {
                    var rootParentId = userOrg.ParentId ?? userOrg.Id;
                    query = query.Where(l => l.CardProfile.User.OrganizationId == rootParentId || l.CardProfile.User.Organization.ParentId == rootParentId);
                }
                else
                {
                    query = query.Where(l => l.CardProfile.User.OrganizationId == orgId);
                }
            }

            var leads = await query
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("ID,Name,Email,Phone,Company,Notes,Date Captured,Cardholder");

            foreach (var lead in leads)
            {
                sb.AppendLine($"{lead.Id},\"{EscapeCsv(lead.FullName)}\",\"{EscapeCsv(lead.Email)}\",\"{EscapeCsv(lead.Phone)}\",\"{EscapeCsv(lead.CompanyName)}\",\"{EscapeCsv(lead.Notes)}\",\"{lead.CreatedAt:yyyy-MM-dd HH:mm:ss}\",\"{EscapeCsv(lead.CardProfile?.FullName ?? "")}\"");
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var stream = new MemoryStream(bytes);
            return File(stream, "text/csv", "comzera_cards_leads.csv");
        }

        private string EscapeCsv(string val)
        {
            if (string.IsNullOrEmpty(val)) return "";
            return val.Replace("\"", "\"\"");
        }
    }
}
