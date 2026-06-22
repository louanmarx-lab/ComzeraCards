"use strict";

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/config";

interface SisterCompany {
  id: number;
  name: string;
  websiteUrl: string;
  logoUrl: string;
  description: string;
}

interface Profile {
  profileId: number;
  nfcToken: string;
  fullName: string;
  designation: string;
  email: string;
  phone: string;
  bio: string;
  profileImageUrl: string;
  socialLinks: Record<string, string>;
  organizationName: string;
}

export default function NfcCardPage() {
  const params = useParams();
  const token = params.token as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sisterCompanies, setSisterCompanies] = useState<SisterCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lead capture states
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState("");
  const [leadError, setLeadError] = useState("");

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/cards/${token}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Card profile not found.");
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data.profile);
        setSisterCompanies(data.sisterCompanies || []);
      })
      .catch((err) => {
        setError(err.message || "Could not load profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLeadSubmitting(true);
    setLeadError("");
    setLeadSuccess("");

    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardProfileId: profile.profileId,
          fullName: leadName,
          email: leadEmail,
          phone: leadPhone,
          companyName: leadCompany,
          notes: leadNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit lead");
      }

      setLeadSuccess("Thanks! Your contact details have been shared.");
      setLeadName("");
      setLeadEmail("");
      setLeadPhone("");
      setLeadCompany("");
      setLeadNotes("");
    } catch (err: unknown) {
      setLeadError(err instanceof Error ? err.message : "Failed to submit details.");
    } finally {
      setLeadSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">Loading dynamic profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md w-full glass p-8 rounded-2xl border border-zinc-800 text-center space-y-4">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-xl font-bold text-white">Profile Not Found</h2>
          <p className="text-zinc-400 text-sm">
            This card profile has not been configured yet or is inactive.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition animate-pulse-slow"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 md:px-6 flex flex-col items-center justify-between">
      <div className="max-w-md w-full space-y-6">
        {/* Main Card Profile Box */}
        <div className="glass rounded-3xl p-6 shadow-2xl border border-zinc-800 relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-indigo-600/30 to-purple-600/30"></div>
          
          {/* Avatar */}
          <div className="relative mt-8 mb-4">
            <div className="w-24 h-24 rounded-2xl bg-zinc-800 border-2 border-indigo-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg overflow-hidden">
              {profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                profile.fullName.charAt(0)
              )}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white leading-tight">{profile.fullName}</h2>
          <p className="text-sm font-semibold text-indigo-400 mt-1">{profile.designation}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{profile.organizationName}</p>

          <a
            href={`${API_URL}/cards/${profile.nfcToken}/vcard`}
            className="w-full mt-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition duration-200 shadow-lg shadow-indigo-600/20 text-center"
          >
            Add to Contacts (vCard)
          </a>

          <div className="w-full mt-6 border-t border-zinc-800 pt-4 text-left space-y-3 text-sm">
            {profile.phone && (
              <div className="flex items-center space-x-3">
                <span className="text-zinc-500">📞</span>
                <a href={`tel:${profile.phone}`} className="text-zinc-300 hover:text-white transition">
                  {profile.phone}
                </a>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <span className="text-zinc-500">✉️</span>
              <a href={`mailto:${profile.email}`} className="text-zinc-300 hover:text-white transition">
                {profile.email}
              </a>
            </div>
            {profile.bio && (
              <div className="text-xs text-zinc-400 bg-zinc-900/40 p-3 rounded-lg border border-zinc-900 mt-2">
                {profile.bio}
              </div>
            )}
          </div>

          {/* Social Links */}
          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="w-full mt-4 flex justify-center gap-4">
              {Object.entries(profile.socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition"
                >
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Lead Capture Form */}
        <div className="glass rounded-3xl p-6 border border-zinc-800 space-y-4">
          <h3 className="text-lg font-bold text-white">Share Your Contact Info</h3>
          <p className="text-xs text-zinc-400">
            Let {profile.fullName.split(" ")[0]} know you met by sharing your details back.
          </p>

          <form onSubmit={handleLeadSubmit} className="space-y-3">
            {leadError && (
              <div className="p-2 text-xs text-red-200 bg-red-950/40 border border-red-900 rounded-lg">
                {leadError}
              </div>
            )}
            {leadSuccess && (
              <div className="p-2 text-xs text-green-200 bg-green-950/40 border border-green-900 rounded-lg">
                {leadSuccess}
              </div>
            )}
            <div>
              <input
                type="text"
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="email"
                required
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <input
                type="text"
                value={leadCompany}
                onChange={(e) => setLeadCompany(e.target.value)}
                placeholder="Company / Organization"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <textarea
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="Notes / Message"
                rows={2}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={leadSubmitting}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            >
              {leadSubmitting ? "Sharing..." : "Share Contact Info"}
            </button>
          </form>
        </div>

        {/* Sister Companies Cross-Promotion Grid */}
        {sisterCompanies.length > 0 && (
          <div className="glass rounded-3xl p-6 border border-zinc-800 space-y-4">
            <div className="border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold tracking-wider text-zinc-400 uppercase">
                Our Sister Companies
              </h3>
            </div>
            <div className="space-y-3">
              {sisterCompanies.map((company) => (
                <div
                  key={company.id}
                  className="p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 rounded-xl flex items-start space-x-3 transition duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex-shrink-0 flex items-center justify-center text-xs text-white font-bold overflow-hidden">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      company.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white">{company.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                      {company.description}
                    </p>
                    <a
                      href={company.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 mt-1"
                    >
                      Visit website ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-[10px] text-zinc-600">
        Powered by Comzera Cards • POPIA Protected
      </footer>
    </div>
  );
}
