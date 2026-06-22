"use strict";

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Settings, 
  LogOut, 
  Search, 
  Download, 
  Building
} from "lucide-react";
import { API_URL } from "@/config";

interface Lead {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  notes: string;
  createdAt: string;
  cardholderName: string;
}

interface TapTimelineItem {
  date: string;
  count: number;
}

interface CardProfile {
  profileId: number;
  nfcToken: string;
  fullName: string;
  designation: string;
  email: string;
  phone: string;
  bio: string;
  isActive: number;
  organizationName: string;
}

interface Organization {
  id: number;
  parentId: number | null;
  name: string;
  websiteUrl: string;
  logoUrl: string;
  description: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [nfcToken, setNfcToken] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "create-cards" | "leads" | "settings">("dashboard");

  // Analytics states
  const [totalTaps, setTotalTaps] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [tapsOverTime, setTapsOverTime] = useState<TapTimelineItem[]>([]);

  // Card Profiles states
  const [cardProfiles, setCardProfiles] = useState<CardProfile[]>([]);
  const [newCardEmail, setNewCardEmail] = useState("");
  const [newCardName, setNewCardName] = useState("");
  const [newCardDesignation, setNewCardDesignation] = useState("");
  const [newCardNfcToken, setNewCardNfcToken] = useState("");
  const [newCardOrgId, setNewCardOrgId] = useState("");
  const [cardSuccess, setCardSuccess] = useState("");
  const [cardError, setCardError] = useState("");
  const [cardSaving, setCardSaving] = useState(false);

  // Leads states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");

  // Organizations (Subsidiaries) states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [editOrgId, setEditOrgId] = useState<number | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgUrl, setOrgUrl] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [orgSuccess, setOrgSuccess] = useState("");
  const [orgError, setOrgError] = useState("");
  const [orgSaving, setOrgSaving] = useState(false);

  // Profile Editor (Self-Update) states
  const [profName, setProfName] = useState("");
  const [profTitle, setProfTitle] = useState("");
  const [profPhone, setProfPhone] = useState("");
  const [profBio, setProfBio] = useState("");
  const [profLinkedIn, setProfLinkedIn] = useState("");
  const [profTwitter, setProfTwitter] = useState("");
  const [editorSuccess, setEditorSuccess] = useState("");
  const [editorError, setEditorError] = useState("");
  const [editorSaving, setEditorSaving] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || "";
    const savedEmail = localStorage.getItem("email") || "";
    const savedRole = localStorage.getItem("role") || "";
    const savedName = localStorage.getItem("fullName") || "";
    const savedNfc = localStorage.getItem("nfcToken") || "";

    if (!savedToken) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    setEmail(savedEmail);
    setRole(savedRole);
    setFullName(savedName);
    setNfcToken(savedNfc);

    // Fetch initial datasets
    fetchAnalytics(savedToken);
    fetchLeads(savedToken);
    fetchCards(savedToken);
    fetchOrgs(savedToken);

    // If role is Cardholder, pre-fetch card details for self profile editor
    if (savedRole === "Cardholder" && savedNfc) {
      fetch(`${API_URL}/cards/${savedNfc}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.profile) {
            setProfName(data.profile.fullName || "");
            setProfTitle(data.profile.designation || "");
            setProfPhone(data.profile.phone || "");
            setProfBio(data.profile.bio || "");
            setProfLinkedIn(data.profile.socialLinks?.LinkedIn || "");
            setProfTwitter(data.profile.socialLinks?.Twitter || "");
          }
        })
        .catch((err) => console.error(err));
    }
  }, [router]);

  const fetchAnalytics = (authToken: string) => {
    fetch(`${API_URL}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setTotalTaps(data.totalTaps || 0);
        setTotalLeads(data.totalLeads || 0);
        setConversionRate(data.conversionRate || 0);
        setTapsOverTime(data.tapsOverTime || []);
      })
      .catch((err) => console.error("Error fetching analytics", err));
  };

  const fetchLeads = (authToken: string) => {
    fetch(`${API_URL}/leads`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLeads(data);
        }
      })
      .catch((err) => console.error("Error fetching leads", err));
  };

  const fetchCards = (authToken: string) => {
    fetch(`${API_URL}/cards`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCardProfiles(data);
        }
      })
      .catch((err) => console.error("Error fetching card profiles", err));
  };

  const fetchOrgs = (authToken: string) => {
    fetch(`${API_URL}/organizations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrganizations(data);
          if (data.length > 0) {
            setNewCardOrgId(data[0].id.toString());
          }
        }
      })
      .catch((err) => console.error("Error fetching organizations", err));
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch(`${API_URL}/leads/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to export leads");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "comzera_cards_leads.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Error exporting CSV", err);
    }
  };

  const handleProvisionCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError("");
    setCardSuccess("");
    setCardSaving(true);

    try {
      const res = await fetch(`${API_URL}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newCardEmail,
          fullName: newCardName,
          designation: newCardDesignation,
          nfcToken: newCardNfcToken,
          organizationId: parseInt(newCardOrgId),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to provision card");
      }

      setCardSuccess("NFC Card profile successfully created!");
      setNewCardEmail("");
      setNewCardName("");
      setNewCardDesignation("");
      setNewCardNfcToken("");
      fetchCards(token);
    } catch (err: unknown) {
      setCardError(err instanceof Error ? err.message : "Failed to create card profile.");
    } finally {
      setCardSaving(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgError("");
    setOrgSuccess("");
    setOrgSaving(true);

    try {
      const url = editOrgId
        ? `${API_URL}/organizations/${editOrgId}`
        : `${API_URL}/organizations`;
      const method = editOrgId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: orgName,
          websiteUrl: orgUrl,
          logoUrl: orgLogo,
          description: orgDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save organization");
      }

      setOrgSuccess(editOrgId ? "Subsidiary updated successfully!" : "Subsidiary created successfully!");
      setOrgName("");
      setOrgUrl("");
      setOrgLogo("");
      setOrgDesc("");
      setEditOrgId(null);
      fetchOrgs(token);
    } catch (err: unknown) {
      setOrgError(err instanceof Error ? err.message : "Failed to save organization.");
    } finally {
      setOrgSaving(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditorError("");
    setEditorSuccess("");
    setEditorSaving(true);

    try {
      const socialLinksJson = JSON.stringify({
        LinkedIn: profLinkedIn,
        Twitter: profTwitter,
      });

      const res = await fetch(`${API_URL}/cards/my-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profName,
          designation: profTitle,
          email,
          phone: profPhone,
          bio: profBio,
          profileImageUrl: "",
          socialLinksJson,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setEditorSuccess("Profile details updated successfully!");
      localStorage.setItem("fullName", profName);
      setFullName(profName);
    } catch (err: unknown) {
      setEditorError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setEditorSaving(false);
    }
  };

  const handleEditOrgClick = (org: Organization) => {
    setEditOrgId(org.id);
    setOrgName(org.name);
    setOrgUrl(org.websiteUrl);
    setOrgLogo(org.logoUrl);
    setOrgDesc(org.description);
    setOrgError("");
    setOrgSuccess("");
  };

  const handleCancelOrgEdit = () => {
    setEditOrgId(null);
    setOrgName("");
    setOrgUrl("");
    setOrgLogo("");
    setOrgDesc("");
    setOrgError("");
    setOrgSuccess("");
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.fullName.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.companyName.toLowerCase().includes(search.toLowerCase()) ||
      l.cardholderName.toLowerCase().includes(search.toLowerCase())
  );

  const maxTapCount = Math.max(...tapsOverTime.map((t) => t.count), 1);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-gray-100 font-sans overflow-hidden">
      
      {/* 1. Left Sidebar Header Navigation */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between py-6 px-4 flex-shrink-0 z-20">
        <div className="space-y-8">
          {/* Logo */}
          <div className="px-3">
            <span className="text-xl font-black tracking-widest bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent block">
              COMZERA CARDS
            </span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block mt-1">
              Group Business Cards CRM
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
              }`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveTab("create-cards")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
                activeTab === "create-cards"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
              }`}
            >
              <CreditCard size={18} />
              <span>Create Cards</span>
            </button>

            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
                activeTab === "leads"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
              }`}
            >
              <Users size={18} />
              <span>Lead Manager</span>
            </button>

            {(role === "HoldingAdmin" || role === "SubsidiaryAdmin") && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
                  activeTab === "settings"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                }`}
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer User controls */}
        <div className="border-t border-zinc-800 pt-4 px-2 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-indigo-400 text-xs border border-zinc-700">
              {fullName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{fullName || "User"}</p>
              <p className="text-[10px] text-zinc-500 truncate uppercase tracking-wider">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/20 transition duration-150"
          >
            <LogOut size={14} />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="py-5 px-8 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-extrabold capitalize tracking-tight text-white">
              {activeTab.replace("-", " ")}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {nfcToken && (
              <a
                href={`/t/${nfcToken}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 text-indigo-400 rounded-lg transition"
              >
                View My NFC Card ↗
              </a>
            )}
            <span className="text-xs text-zinc-500 font-medium">{email}</span>
          </div>
        </header>

        <div className="p-8 space-y-8 flex-1">
          {/* TAB CONTENT: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Analytics summary row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-zinc-800 hover-glow">
                  <span className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
                    Total Card Taps
                  </span>
                  <div className="text-4xl font-extrabold text-white mt-2">{totalTaps}</div>
                  <p className="text-[10px] text-zinc-500 mt-1">NFC tap counts and QR loads</p>
                </div>
                <div className="glass p-6 rounded-2xl border border-zinc-800 hover-glow">
                  <span className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
                    Leads Captured
                  </span>
                  <div className="text-4xl font-extrabold text-indigo-400 mt-2">{totalLeads}</div>
                  <p className="text-[10px] text-zinc-500 mt-1">Prospect contact exchanges completed</p>
                </div>
                <div className="glass p-6 rounded-2xl border border-zinc-800 hover-glow">
                  <span className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
                    Conversion Rate
                  </span>
                  <div className="text-4xl font-extrabold text-purple-400 mt-2">{conversionRate}%</div>
                  <p className="text-[10px] text-zinc-500 mt-1">Percentage of taps sharing contact info</p>
                </div>
              </div>

              {/* Analytics chart and personal profile side updates */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline Chart */}
                <div className="glass p-6 rounded-2xl border border-zinc-800 lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">
                    Card Performance (Last 7 Days)
                  </h3>
                  <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
                    {tapsOverTime.map((item) => {
                      const heightPercent = Math.max((item.count / maxTapCount) * 100, 4);
                      return (
                        <div key={item.date} className="flex-1 flex flex-col items-center group">
                          <div className="text-xs text-indigo-300 font-bold mb-1 opacity-0 group-hover:opacity-100 transition duration-150">
                            {item.count}
                          </div>
                          <div
                            className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-md hover:from-indigo-500 hover:to-purple-400 transition-all duration-300"
                            style={{ height: `${heightPercent}%` }}
                          ></div>
                          <div className="text-[10px] text-zinc-500 mt-2">
                            {item.date.substring(5)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Profile Editor for Cardholder role */}
                {role === "Cardholder" ? (
                  <div className="glass p-6 rounded-2xl border border-zinc-800 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">
                      Customize Profile
                    </h3>
                    <form onSubmit={handleProfileSave} className="space-y-3">
                      {editorSuccess && (
                        <div className="p-2 text-xs text-green-200 bg-green-950/40 border border-green-800 rounded-lg">
                          {editorSuccess}
                        </div>
                      )}
                      {editorError && (
                        <div className="p-2 text-xs text-red-200 bg-red-950/40 border border-red-800 rounded-lg">
                          {editorError}
                        </div>
                      )}
                      <div>
                        <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Full Name</label>
                        <input
                          type="text"
                          required
                          value={profName}
                          onChange={(e) => setProfName(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Designation</label>
                        <input
                          type="text"
                          required
                          value={profTitle}
                          onChange={(e) => setProfTitle(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Mobile Phone</label>
                        <input
                          type="text"
                          value={profPhone}
                          onChange={(e) => setProfPhone(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Bio Statement</label>
                        <textarea
                          value={profBio}
                          onChange={(e) => setProfBio(e.target.value)}
                          rows={2}
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white"
                        ></textarea>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">LinkedIn Url</label>
                          <input
                            type="text"
                            value={profLinkedIn}
                            onChange={(e) => setProfLinkedIn(e.target.value)}
                            placeholder="https://..."
                            className="w-full mt-1 px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-[9px] text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Twitter Url</label>
                          <input
                            type="text"
                            value={profTwitter}
                            onChange={(e) => setProfTwitter(e.target.value)}
                            placeholder="https://..."
                            className="w-full mt-1 px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-[9px] text-white"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={editorSaving}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white transition"
                      >
                        {editorSaving ? "Saving..." : "Save Card Details"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="glass p-6 rounded-2xl border border-zinc-800 flex flex-col justify-center text-center space-y-3">
                    <Building size={32} className="mx-auto text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Administrator Access</h3>
                    <p className="text-xs text-zinc-400">
                      Use the left navigation sidebar to provision employee cards or update subsidiary cross-promotional settings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: CREATE CARDS (PROVISIONING MODULE) */}
          {activeTab === "create-cards" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Card Provision Form (Only for Admins) */}
              {(role === "HoldingAdmin" || role === "SubsidiaryAdmin") ? (
                <div className="glass p-6 rounded-2xl border border-zinc-800 h-fit space-y-4">
                  <h3 className="text-lg font-bold text-white">Create NFC Card</h3>
                  <p className="text-xs text-zinc-400">
                    Register a new cardholder profile and assign its NFC token route URL.
                  </p>

                  <form onSubmit={handleProvisionCard} className="space-y-3 pt-2">
                    {cardSuccess && (
                      <div className="p-3 text-xs text-green-200 bg-green-950/40 border border-green-800 rounded-lg">
                        {cardSuccess}
                      </div>
                    )}
                    {cardError && (
                      <div className="p-3 text-xs text-red-200 bg-red-950/40 border border-red-800 rounded-lg">
                        {cardError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                        Employee Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newCardName}
                        onChange={(e) => setNewCardName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                        Email Address (Registration)
                      </label>
                      <input
                        type="email"
                        required
                        value={newCardEmail}
                        onChange={(e) => setNewCardEmail(e.target.value)}
                        placeholder="john.doe@company.com"
                        className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                          Designation
                        </label>
                        <input
                          type="text"
                          required
                          value={newCardDesignation}
                          onChange={(e) => setNewCardDesignation(e.target.value)}
                          placeholder="Sales Manager"
                          className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                          NFC String Token
                        </label>
                        <input
                          type="text"
                          required
                          value={newCardNfcToken}
                          onChange={(e) => setNewCardNfcToken(e.target.value)}
                          placeholder="john-doe"
                          className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                        Company / Organization
                      </label>
                      <select
                        value={newCardOrgId}
                        onChange={(e) => setNewCardOrgId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                      >
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={cardSaving}
                      className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white transition"
                    >
                      {cardSaving ? "Provisioning..." : "Provision NFC Card Profile"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass p-6 rounded-2xl border border-zinc-800 h-fit space-y-3 text-center">
                  <span className="text-4xl block">📇</span>
                  <h3 className="text-sm font-bold text-white">NFC Profile Assigned</h3>
                  <p className="text-xs text-zinc-400">
                    Your physical business card routes to nfc token <strong className="text-indigo-400">{nfcToken}</strong>. Use the dashboard updates section to change info.
                  </p>
                </div>
              )}

              {/* Cards Profiles Grid List */}
              <div className="glass p-6 rounded-2xl border border-zinc-800 lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-white uppercase tracking-wider text-zinc-400">
                  Provisioned Card profiles
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase text-[9px]">
                        <th className="py-3 px-4">Cardholder</th>
                        <th className="py-3 px-4">Designation</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">NFC Token</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cardProfiles.length > 0 ? (
                        cardProfiles.map((cp) => (
                          <tr key={cp.profileId} className="border-b border-zinc-900 hover:bg-zinc-900/30 text-zinc-300">
                            <td className="py-3 px-4 font-bold text-white">{cp.fullName}</td>
                            <td className="py-3 px-4">{cp.designation}</td>
                            <td className="py-3 px-4">{cp.email}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-zinc-850 rounded font-mono text-[10px] text-zinc-400 border border-zinc-800">
                                {cp.nfcToken}
                              </span>
                            </td>
                            <td className="py-3 px-4">{cp.organizationName}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                cp.isActive === 1 
                                  ? "bg-green-950/40 border border-green-800 text-green-400"
                                  : "bg-red-950/40 border border-red-800 text-red-400"
                              }`}>
                                {cp.isActive === 1 ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500">
                            No profiles provisioned.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: LEAD MANAGER */}
          {activeTab === "leads" && (
            <div className="glass rounded-2xl border border-zinc-800 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider text-zinc-400">
                    CRM Captured Leads
                  </h3>
                  <p className="text-xs text-zinc-400">Total list of contacts collected from NFC card taps.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2 text-zinc-500" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search leads..."
                      className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleExportCsv}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold rounded-lg transition"
                  >
                    <Download size={12} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Leads Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase text-[9px]">
                      <th className="py-3 px-4">Prospect Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4">Cardholder</th>
                      <th className="py-3 px-4 text-right">Date Captured</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-zinc-900 hover:bg-zinc-900/30 text-zinc-300">
                          <td className="py-3 px-4 font-bold text-white">{lead.fullName}</td>
                          <td className="py-3 px-4">{lead.email}</td>
                          <td className="py-3 px-4">{lead.phone || "-"}</td>
                          <td className="py-3 px-4">{lead.companyName || "-"}</td>
                          <td className="py-3 px-4 max-w-xs truncate" title={lead.notes}>
                            {lead.notes || "-"}
                          </td>
                          <td className="py-3 px-4 text-zinc-400">{lead.cardholderName || "-"}</td>
                          <td className="py-3 px-4 text-right text-zinc-500">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          No leads captured matching filter query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: GROUP SETTINGS (SUBSIDIARIES CONFIGURATION) */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Config Add/Edit */}
              <div className="glass rounded-2xl border border-zinc-800 p-6 space-y-6 h-fit">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editOrgId ? "Edit Subsidiary" : "Add Subsidiary"}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage other subsidiary companies displayed as sister groups.
                  </p>
                </div>

                <form onSubmit={handleOrgSubmit} className="space-y-4">
                  {orgSuccess && (
                    <div className="p-3 text-xs text-green-200 bg-green-950/40 border border-green-800 rounded-lg">
                      {orgSuccess}
                    </div>
                  )}
                  {orgError && (
                    <div className="p-3 text-xs text-red-200 bg-red-950/40 border border-red-800 rounded-lg">
                      {orgError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      Subsidiary Name
                    </label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Comzera Solutions"
                      className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      Website URL
                    </label>
                    <input
                      type="url"
                      required
                      value={orgUrl}
                      onChange={(e) => setOrgUrl(e.target.value)}
                      placeholder="https://solutions.comzera.co.za"
                      className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      Logo Path or Image URL
                    </label>
                    <input
                      type="text"
                      value={orgLogo}
                      onChange={(e) => setOrgLogo(e.target.value)}
                      placeholder="/assets/logos/solutions.png"
                      className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      required
                      value={orgDesc}
                      onChange={(e) => setOrgDesc(e.target.value)}
                      placeholder="Brief capability description..."
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                    ></textarea>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={orgSaving}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white transition disabled:opacity-50"
                    >
                      {orgSaving ? "Saving..." : editOrgId ? "Update Info" : "Save Subsidiary"}
                    </button>
                    {editOrgId && (
                      <button
                        type="button"
                        onClick={handleCancelOrgEdit}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Subsidiaries List */}
              <div className="glass rounded-2xl border border-zinc-800 p-6 lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-white uppercase tracking-wider text-zinc-400">
                  Registered subsidiaries
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex flex-col justify-between space-y-3 hover-glow"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center font-bold text-xs text-white flex-shrink-0 overflow-hidden">
                          {org.logoUrl ? (
                            <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                          ) : (
                            org.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{org.name}</h4>
                          <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{org.description}</p>
                        </div>
                      </div>
                      <div className="border-t border-zinc-850 pt-2.5 flex items-center justify-between">
                        <a
                          href={org.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          Visit website ↗
                        </a>
                        <button
                          onClick={() => handleEditOrgClick(org)}
                          className="text-[10px] text-zinc-300 hover:text-white border border-zinc-800 px-2.5 py-1 rounded bg-zinc-900/50 hover:bg-zinc-900 transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
