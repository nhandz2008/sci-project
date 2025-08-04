"use client";
import { useState } from "react";
import Link from "next/link";
import LikeButton from "../../components/like-button";

const COMPETITIONS = [
  {
    id: "imo-2024",
    name: "International Mathematical Olympiad (IMO)",
    overview: "The world's most prestigious math competition for high school students.",
    scale: "International",
    location: "Varies",
    modes: ["Offline"],
    homepage: "https://www.imo-official.org/",
  },
  {
    id: "first-robotics-2024",
    name: "FIRST Robotics Competition",
    overview: "A global robotics challenge inspiring young engineers and innovators.",
    scale: "International",
    location: "USA & Worldwide",
    modes: ["Hybrid"],
    homepage: "https://www.firstinspires.org/robotics/frc",
  },
  {
    id: "vietnam-science-2024",
    name: "Vietnam National Science Olympiad",
    overview: "A national event for students to showcase their science projects and research.",
    scale: "Regional",
    location: "Vietnam",
    modes: ["Offline"],
    homepage: "https://example.com/vietnam-science",
  },
  {
    id: "isef-2024",
    name: "ISEF (International Science and Engineering Fair)",
    overview: "The world's largest international pre-college science competition.",
    scale: "International",
    location: "USA",
    modes: ["Hybrid", "Online"],
    homepage: "https://www.societyforscience.org/isef/",
  },
  {
    id: "online-coding-2024",
    name: "Online Coding Challenge",
    overview: "A virtual competition for aspiring programmers worldwide.",
    scale: "International",
    location: "Online",
    modes: ["Online"],
    homepage: "https://example.com/online-coding",
  },
  {
    id: "asean-science-2024",
    name: "ASEAN Science and Math Olympiad",
    overview: "A regional event for students in Southeast Asia to compete in STEM subjects.",
    scale: "Regional",
    location: "Southeast Asia",
    modes: ["Offline", "Online"],
    homepage: "https://example.com/asean-science",
  },
];

const SCALES = ["International", "Regional"];
const MODES = ["Hybrid", "Online", "Offline"];
const LOCATIONS = [
  ...Array.from(new Set(COMPETITIONS.map((c) => c.location))),
];

export default function CompetitionsPage() {
  const [search, setSearch] = useState("");
  const [scale, setScale] = useState("");
  const [mode, setMode] = useState("");
  const [location, setLocation] = useState("");

  const filtered = COMPETITIONS.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.overview.toLowerCase().includes(search.toLowerCase());
    const matchesScale = !scale || c.scale === scale;
    const matchesMode = !mode || c.modes.includes(mode);
    const matchesLocation = !location || c.location === location;
    return matchesSearch && matchesScale && matchesMode && matchesLocation;
  });

  return (
    <section className="px-4 py-16 min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-blue-900 mb-2">Explore Competitions</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Browse and filter science & technology competitions worldwide. Find the right challenge for you!
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
          <input
            type="text"
            placeholder="Search competitions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Search competitions"
          />
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            className="w-full md:w-1/6 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Filter by scale"
          >
            <option value="">All Scales</option>
            {SCALES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Filter by location"
          >
            <option value="">All Locations</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full md:w-1/6 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Filter by mode"
          >
            <option value="">All Modes</option>
            {MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">No competitions found.</div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-3 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-blue-800">{c.name}</h2>
                  <LikeButton 
                    competitionId={c.id} 
                    competition={{
                      id: c.id,
                      name: c.name,
                      location: c.location,
                      description: c.overview,
                      homepage: c.homepage,
                    }} 
                  />
                </div>
                <p className="text-gray-700 text-base mb-2">{c.overview}</p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 font-medium">{c.scale}</span>
                  <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 font-medium">{c.location}</span>
                  {c.modes.map((m) => (
                    <span key={m} className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800 font-medium">{m}</span>
                  ))}
                </div>
                <Link
                  href={`/competitions/${c.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm mt-2 inline-block"
                >
                  View Details →
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
} 