"use strict";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          COMZERA CARDS
        </span>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-semibold text-zinc-300 hover:text-white transition">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition duration-200 shadow-lg shadow-indigo-600/20">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto z-10 py-12">
        <div className="inline-flex items-center space-x-2 bg-indigo-950/40 border border-indigo-800/40 px-3 py-1 rounded-full text-indigo-300 text-xs font-semibold mb-6 animate-pulse-slow">
          <span>✨ Interactive NFC Business Cards</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Networking reimagined for{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Holding Groups
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed">
          Taps trigger dynamic, mobile-first business card profiles. Instantly download vCards, collect qualified leads, and automatically cross-promote sister companies in your group.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link href="/register" className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition duration-200 shadow-xl shadow-indigo-600/30">
            Create Your Card
          </Link>
          <Link href="/t/john-doe" className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition duration-200">
            Demo NFC Landing Page
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="glass p-6 rounded-2xl hover-glow">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg mb-4">
              📇
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Dynamic vCards</h3>
            <p className="text-sm text-zinc-400">
              One tap compiles and downloads a contact file (.vcf) directly into the client&apos;s phone address book.
            </p>
          </div>
          <div className="glass p-6 rounded-2xl hover-glow">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg mb-4">
              🤝
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Group Cross-Promotion</h3>
            <p className="text-sm text-zinc-400">
              Showcase other subsidiaries automatically on card taps to cross-sell holding company services.
            </p>
          </div>
          <div className="glass p-6 rounded-2xl hover-glow">
            <div className="w-10 h-10 rounded-lg bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-lg mb-4">
              📊
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Lead Manager CRM</h3>
            <p className="text-sm text-zinc-400">
              Check real-time metrics showing views, taps, and captured lead forms on your custom dashboard.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-zinc-600 border-t border-zinc-900 z-10">
        © 2026 Comzera Group. All rights reserved. Registered under POPIA compliance standards.
      </footer>
    </div>
  );
}
