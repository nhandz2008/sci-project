'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../app/contexts/AuthContext";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Competitions", href: "/competitions" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setMenuOpen((open) => !open);
  const handleClose = () => setMenuOpen(false);
  const handleUserMenuToggle = () => setUserMenuOpen((open) => !open);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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

        {/* Auth Buttons / User Menu */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            // User is logged in - show user menu
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={handleUserMenuToggle}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-700 font-medium">{user.full_name}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Account Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            // User is not logged in - show auth buttons
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 px-4 py-2 rounded transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
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
            
            {/* Mobile auth buttons */}
            {user ? (
              <li className="w-full px-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 font-medium">{user.full_name}</span>
                </div>
                <Link
                  href="/account"
                  className="block text-gray-700 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 px-2 py-1 rounded transition-colors"
                  onClick={handleClose}
                >
                  Account Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    handleClose();
                  }}
                  className="block w-full text-left text-gray-700 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 px-2 py-1 rounded transition-colors"
                >
                  Logout
                </button>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="block text-gray-900 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 px-4 py-2 rounded transition-colors"
                    onClick={handleClose}
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="block bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={handleClose}
                  >
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 