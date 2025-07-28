"use client";
import { useState } from "react";

const socialIcons = [
  { label: "Facebook", icon: "fab fa-facebook-f", href: "#" },
  { label: "Google Plus", icon: "fab fa-google-plus-g", href: "#" },
  { label: "LinkedIn", icon: "fab fa-linkedin-in", href: "#" },
];

export default function RegistrationPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-8">
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-3xl min-h-[480px] overflow-hidden transition-all duration-500 ${isSignUp ? "right-panel-active" : ""}`}
        aria-label="Registration container"
      >
        {/* Sign Up Form */}
        <div
          className={`absolute top-0 left-0 h-full w-1/2 z-10 transition-all duration-500 ${isSignUp ? "translate-x-full opacity-100 z-20" : "opacity-0 z-10"}`}
          aria-hidden={!isSignUp}
        >
          <form className="bg-white flex flex-col items-center justify-center h-full px-12 text-center" aria-label="Sign up form">
            <h1 className="font-bold text-3xl mb-2">Create Account</h1>
            <div className="flex justify-center gap-2 my-4">
              {socialIcons.map((icon) => (
                <a
                  key={icon.label}
                  href={icon.href}
                  aria-label={icon.label}
                  tabIndex={0}
                  className="border border-gray-200 rounded-full flex items-center justify-center w-10 h-10 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <i className={icon.icon} aria-hidden="true" />
                </a>
              ))}
            </div>
            <span className="text-xs mb-2">or use your email for registration</span>
            <input
              type="text"
              placeholder="Name"
              aria-label="Name"
              className="bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              className="bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              className="bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="mt-4 rounded-full border border-pink-600 bg-pink-600 text-white font-bold px-8 py-3 uppercase text-xs tracking-wider transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              Sign Up
            </button>
          </form>
        </div>
        {/* Sign In Form */}
        <div
          className={`absolute top-0 left-0 h-full w-1/2 z-20 transition-all duration-500 ${isSignUp ? "-translate-x-full opacity-0 z-10" : "opacity-100 z-20"}`}
          aria-hidden={isSignUp}
        >
          <form className="bg-white flex flex-col items-center justify-center h-full px-12 text-center" aria-label="Sign in form">
            <h1 className="font-bold text-3xl mb-2">Sign in</h1>
            <div className="flex justify-center gap-2 my-4">
              {socialIcons.map((icon) => (
                <a
                  key={icon.label}
                  href={icon.href}
                  aria-label={icon.label}
                  tabIndex={0}
                  className="border border-gray-200 rounded-full flex items-center justify-center w-10 h-10 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <i className={icon.icon} aria-hidden="true" />
                </a>
              ))}
            </div>
            <span className="text-xs mb-2">or use your account</span>
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              className="bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              className="bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <a
              href="#"
              className="text-gray-500 text-xs mt-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400"
              tabIndex={0}
              aria-label="Forgot your password?"
            >
              Forgot your password?
            </a>
            <button
              type="submit"
              className="mt-4 rounded-full border border-pink-600 bg-pink-600 text-white font-bold px-8 py-3 uppercase text-xs tracking-wider transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              Sign In
            </button>
          </form>
        </div>
        {/* Overlay */}
        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 transition-transform duration-500 ${isSignUp ? "-translate-x-full" : "translate-x-0"}`}
          aria-hidden="true"
        >
          <div className="bg-gradient-to-r from-pink-600 to-pink-400 text-white absolute left-[-100%] h-full w-[200%] flex transition-transform duration-500" style={{ transform: isSignUp ? "translateX(50%)" : "translateX(0)" }}>
            {/* Overlay Left */}
            <div className={`flex flex-col items-center justify-center px-10 text-center h-full w-1/2 transition-transform duration-500 ${isSignUp ? "translate-x-0" : "-translate-x-1/5"}`}>
              <h1 className="font-bold text-3xl mb-2">Welcome Back!</h1>
              <p className="text-sm font-light mb-6">To keep connected with us please login with your personal info</p>
              <button
                className="ghost border border-white bg-transparent text-white font-bold px-8 py-3 rounded-full uppercase text-xs tracking-wider mt-2 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => setIsSignUp(false)}
                tabIndex={0}
                aria-label="Sign In"
                type="button"
              >
                Sign In
              </button>
            </div>
            {/* Overlay Right */}
            <div className={`flex flex-col items-center justify-center px-10 text-center h-full w-1/2 transition-transform duration-500 ${isSignUp ? "translate-x-1/5" : "translate-x-0"}`}>
              <h1 className="font-bold text-3xl mb-2">Hello, Friend!</h1>
              <p className="text-sm font-light mb-6">Enter your personal details and start journey with us</p>
              <button
                className="ghost border border-white bg-transparent text-white font-bold px-8 py-3 rounded-full uppercase text-xs tracking-wider mt-2 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => setIsSignUp(true)}
                tabIndex={0}
                aria-label="Sign Up"
                type="button"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-gray-800 text-white text-xs text-center w-full py-2 mt-8 fixed bottom-0 left-0 z-50">
        <p>
          Created with <span className="text-red-500">♥</span> by
          <a
            className="text-blue-300 hover:underline mx-1"
            href="https://florin-pop.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Florin Pop
          </a>
          - Read how I created this and how you can join the challenge
          <a
            className="text-blue-300 hover:underline mx-1"
            href="https://www.florin-pop.com/blog/2019/03/double-slider-sign-in-up-form/"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>.
        </p>
      </footer>
    </main>
  );
} 