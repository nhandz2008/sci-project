'use client';

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Competitions", href: "/competitions" },
  { name: "Login/Signup", href: "/auth" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggle = () => setMenuOpen((open) => !open);
  const handleClose = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="SCI Home">
          Science Competition Insights
        </Link>
        <button
          className="lg:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          onClick={handleToggle}
        >
          <span className="block w-6 h-0.5 bg-blue-900 mb-1" />
          <span className="block w-6 h-0.5 bg-blue-900 mb-1" />
          <span className="block w-6 h-0.5 bg-blue-900" />
        </button>
        <ul className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className="text-gray-900 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 px-2 py-1 rounded transition-colors"
                aria-label={link.name}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div id="navbar-menu" className="lg:hidden bg-white/95 shadow-md">
          <ul className="flex flex-col items-center gap-4 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="block text-gray-900 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 px-4 py-2 rounded transition-colors"
                  aria-label={link.name}
                  onClick={handleClose}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 