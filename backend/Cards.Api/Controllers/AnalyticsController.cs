using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Cards.Api.Data;

namespace Cards.Api.Controllers
{
    [ApiController]
    [Route("api/v1/analytics")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly CardsDbContext _context;

        public AnalyticsController(CardsDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardAnalytics()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var orgIdClaim = User.FindFirst("OrganizationId")?.Value;

            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Unauthorized user context." });
            }

            int orgId = int.TryParse(orgIdClaim, out var parsedOrgId) ? parsedOrgId : 0;

            // Queries for Taps and Leads
            var tapsQuery = _context.TapAnalytics
                .Include(ta => ta.CardProfile)
                .ThenInclude(cp => cp.User)
                .AsQueryable();

            var leadsQuery = _context.Leads
                .Include(l => l.CardProfile)
                .ThenInclude(cp => cp.User)
                .AsQueryable();

            if (roleClaim == "Cardholder")
            {
                tapsQuery = tapsQuery.Where(ta => ta.CardProfile.UserId == userId);
                leadsQuery = leadsQuery.Where(l => l.CardProfile.UserId == userId);
            }
            else if (roleClaim == "SubsidiaryAdmin")
            {
                tapsQuery = tapsQuery.Where(ta => ta.CardProfile.User.OrganizationId == orgId);
                leadsQuery = leadsQuery.Where(l => l.CardProfile.User.OrganizationId == orgId);
            }

            int totalTaps = await tapsQuery.CountAsync();
            int totalLeads = await leadsQuery.CountAsync();

            double conversionRate = 0.0;
            if (totalTaps > 0)
            {
                conversionRate = Math.Round(((double)totalLeads / totalTaps) * 100, 1);
            }

            // Get timeline of taps in the last 7 days
            var sevenDaysAgo = DateTime.UtcNow.Date.AddDays(-7);
            var tapsOverTime = await tapsQuery
                .Where(ta => ta.CreatedAt >= sevenDaysAgo)
                .GroupBy(ta => ta.CreatedAt.Date)
                .Select(g => new
                {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    Count = g.Count()
                })
                .ToListAsync();

            // Populate all 7 days even if count is 0
            var allDays = Enumerable.Range(0, 8)
                .Select(offset => DateTime.UtcNow.Date.AddDays(-7 + offset))
                .Select(d => new
                {
                    Date = d.ToString("yyyy-MM-dd"),
                    Count = tapsOverTime.FirstOrDefault(t => t.Date == d.ToString("yyyy-MM-dd"))?.Count ?? 0
                })
                .ToList();

            return Ok(new
            {
                totalTaps,
                totalLeads,
                conversionRate,
                tapsOverTime = allDays
            });
        }
    }
}
