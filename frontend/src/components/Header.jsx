// src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="fixed top-4 left-4 right-4 z-50 pointer-events-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Left: logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-14 h-14 p-1 rounded-xl bg-white/10 backdrop-blur-sm shadow-md flex items-center justify-center transform-gpu animate-logo-float">
            <img
              src="/reco_logo.png"
              alt="Reco logo"
              className="w-full h-full object-contain rounded-md"
              style={{ imageRendering: "auto" }}
            />
          </div>

          <div className="hidden sm:block">
            <div className="text-white font-bold leading-tight text-lg">Reco</div>
            <div className="text-xs text-white/70 -mt-0.5">Course suggestions — demo UI</div>
          </div>
        </Link>

        {/* Right: decorative pill (non-functional) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-xs font-semibold shadow-sm text-white">
            Demo Mode
          </div>
        </div>
      </div>
    </header>
  );
}
