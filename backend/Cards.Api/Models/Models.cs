using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Cards.Api.Models
{
    public class Organization
    {
        public int Id { get; set; }
        public int? ParentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string WebsiteUrl { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public Organization? Parent { get; set; }
        [JsonIgnore]
        public ICollection<Organization> Children { get; set; } = new List<Organization>();
        [JsonIgnore]
        public ICollection<User> Users { get; set; } = new List<User>();
    }

    public class User
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Cardholder"; // 'HoldingAdmin', 'SubsidiaryAdmin', 'Cardholder'
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public Organization? Organization { get; set; }
        [JsonIgnore]
        public CardProfile? CardProfile { get; set; }
    }

    public class CardProfile
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string NfcToken { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public string ProfileImageUrl { get; set; } = string.Empty;
        
        // JSON mapping social links
        public string SocialLinksJson { get; set; } = "{}";

        public int IsActive { get; set; } = 1;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public User? User { get; set; }
        [JsonIgnore]
        public ICollection<Lead> Leads { get; set; } = new List<Lead>();
        [JsonIgnore]
        public ICollection<TapAnalytics> TapAnalytics { get; set; } = new List<TapAnalytics>();
    }

    public class Lead
    {
        public int Id { get; set; }
        public int CardProfileId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public CardProfile? CardProfile { get; set; }
    }

    public class TapAnalytics
    {
        public int Id { get; set; }
        public int CardProfileId { get; set; }
        public string Referrer { get; set; } = "Direct Tap";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public CardProfile? CardProfile { get; set; }
    }
}
