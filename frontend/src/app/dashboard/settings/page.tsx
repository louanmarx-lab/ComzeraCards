"use strict";

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/config";

interface Organization {
  id: number;
  parentId: number | null;
  name: string;
  websiteUrl: string;
  logoUrl: string;
  description: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || "";
    const savedRole = localStorage.getItem("role") || "";

    if (!savedToken) {
      router.push("/login");
      return;
    }

    if (savedRole !== "HoldingAdmin" && savedRole !== "SubsidiaryAdmin") {
      router.push("/dashboard");
      return;
    }

    setToken(savedToken);

    fetchOrgs(savedToken);
  }, [router]);

  const fetchOrgs = (authToken: string) => {
    setLoading(true);
    fetch(`${API_URL}/organizations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter to show only child subsidiaries (exclude root holding company if desired, or show all)
          setOrganizations(data);
        }
      })
      .catch((err) => console.error("Error fetching organizations", err))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const url = editId
        ? `${API_URL}/organizations/${editId}`
        : `${API_URL}/organizations`;

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          websiteUrl,
          logoUrl,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save organization details");
      }

      setSuccess(
        editId
          ? "Subsidiary updated successfully!"
          : "Subsidiary added successfully!"
      );
      setName("");
      setWebsiteUrl("");
      setLogoUrl("");
      setDescription("");
      setEditId(null);

      fetchOrgs(token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (org: Organization) => {
    setEditId(org.id);
    setName(org.name);
    setWebsiteUrl(org.websiteUrl);
    setLogoUrl(org.logoUrl);
    setDescription(org.description);
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setName("");
    setWebsiteUrl("");
    setLogoUrl("");
    setDescription("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <nav className="glass border-b border-zinc-800 w-full py-4 px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            COMZERA CARDS
          </span>
          <span className="text-xs text-zinc-500">Settings</span>
        </div>
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Grid content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
        {/* Left Form: Add/Edit Subsidiary */}
        <div className="glass rounded-2xl border border-zinc-800 p-6 space-y-6 h-fit">
          <div>
            <h2 className="text-xl font-bold text-white">
              {editId ? "Edit Subsidiary" : "Add Subsidiary"}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Configure sister brands shown dynamically under NFC employee cards.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs text-red-200 bg-red-950/40 border border-red-900 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-xs text-green-200 bg-green-950/40 border border-green-900 rounded-lg">
                {success}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase">
                Subsidiary Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prosource"
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase">
                Website URL
              </label>
              <input
                type="url"
                required
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://prosource.co.za"
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase">
                Logo URL or Path
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/assets/logos/prosource.png"
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase">
                Brief Description
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description for cross-promotion showcase card..."
                rows={3}
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none"
              ></textarea>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-lg text-white transition disabled:opacity-50"
              >
                {submitting ? "Saving..." : editId ? "Update" : "Save Subsidiary"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm text-zinc-400 rounded-lg transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right List: Subsidiary Listing Grid */}
        <div className="glass rounded-2xl border border-zinc-800 p-6 lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Group Subsidiaries</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Currently registered entities in the holding group context.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Loading subsidiary list...
            </div>
          ) : organizations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="p-4 bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl flex flex-col justify-between space-y-4 hover-glow"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 overflow-hidden">
                      {org.logoUrl ? (
                        <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                      ) : (
                        org.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {org.name}
                      </h4>
                      {org.parentId === null && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[8px] bg-purple-900/50 border border-purple-700/50 text-purple-300 rounded font-bold uppercase">
                          Root Parent Holding
                        </span>
                      )}
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {org.description || "No description set."}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-zinc-900 pt-3 flex items-center justify-between text-xs">
                    <a
                      href={org.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Website Link ↗
                    </a>
                    <button
                      onClick={() => handleEditClick(org)}
                      className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded font-medium text-zinc-300"
                    >
                      Edit Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No subsidiaries registered yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
