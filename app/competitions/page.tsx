"use client";
import { useState } from "react";
import Link from "next/link";
import LikeButton from "../../components/like-button";
import Image from "next/image";

const COMPETITIONS = [
  {
    id: "imo-2024",
    name: "International Mathematical Olympiad (IMO)",
    overview: "The world's most prestigious math competition for high school students.",
    scale: "International",
    location: "Varies",
    modes: ["Offline"],
    homepage: "https://www.imo-official.org/",
    image: "/logos/IMO_logo.svg",
  },
  {
    id: "first-robotics-2024",
    name: "FIRST Robotics Competition",
    overview: "A global robotics challenge inspiring young engineers and innovators.",
    scale: "International",
    location: "USA & Worldwide",
    modes: ["Hybrid"],
    homepage: "https://www.firstinspires.org/robotics/frc",
    image: "/logos/FIRST_Robotics_Competition_(logo).svg.png",
  },
  {
    id: "vietnam-science-2024",
    name: "Vietnam National Science Olympiad",
    overview: "A national event for students to showcase their science projects and research.",
    scale: "Regional",
    location: "Vietnam",
    modes: ["Offline"],
    homepage: "https://example.com/vietnam-science",
    image: "/images/image1.jpeg",
  },
  {
    id: "isef-2024",
    name: "ISEF (International Science and Engineering Fair)",
    overview: "The world's largest international pre-college science competition.",
    scale: "International",
    location: "USA",
    modes: ["Hybrid", "Online"],
    homepage: "https://www.societyforscience.org/isef/",
    image: "/logos/2021_ISEF_Logo.png",
  },
  {
    id: "online-coding-2024",
    name: "Online Coding Challenge",
    overview: "A virtual competition for aspiring programmers worldwide.",
    scale: "International",
    location: "Online",
    modes: ["Online"],
    homepage: "https://example.com/online-coding",
    image: "/logos/images.png",
  },
  {
    id: "asean-science-2024",
    name: "ASEAN Science and Math Olympiad",
    overview: "A regional event for students in Southeast Asia to compete in STEM subjects.",
    scale: "Regional",
    location: "Southeast Asia",
    modes: ["Offline", "Online"],
    homepage: "https://example.com/asean-science",
    image: "/logos/logoWeb.png",
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
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-blue-900 mb-4">Explore Competitions</h1>
          <p className="text-gray-600 text-xl max-w-3xl mx-auto">
            Browse and filter science & technology competitions worldwide. Find the right challenge for you!
          </p>
        </div>
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <input
              type="text"
              placeholder="Search competitions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
              aria-label="Search competitions"
            />
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              className="w-full lg:w-1/6 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
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
              className="w-full lg:w-1/4 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
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
              className="w-full lg:w-1/6 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
              aria-label="Filter by mode"
            >
              <option value="">All Modes</option>
              {MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Competitions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-16 text-xl">
              <div className="bg-white rounded-xl shadow-lg p-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-semibold mb-2">No competitions found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            </div>
          ) : (
            filtered.map((c, index) => (
              <div key={c.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-3 hover:shadow-2xl group">
                {/* Image Section */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <Image
                    src={c.image}
                    alt={`${c.name} logo`}
                    width={120}
                    height={120}
                    className="object-contain transition-transform duration-300 group-hover:scale-110 z-10"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold z-10">
                            ${c.name.charAt(0)}
                          </div>
                        `;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Like Button - Top Right Corner */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
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
                </div>

                {/* Content Section */}
                <div className="p-6 relative">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight mb-3">{c.name}</h2>
                  </div>
                  
                  <p className="text-gray-700 text-base mb-4 leading-relaxed">{c.overview}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 font-medium">{c.scale}</span>
                    <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 font-medium">{c.location}</span>
                    {c.modes.map((m) => (
                      <span key={m} className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800 font-medium">{m}</span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <Link
                      href={`/competitions/${c.id}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors duration-200"
                    >
                      Learn More
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Results Count */}
        {filtered.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            <p className="text-lg">
              Showing {filtered.length} of {COMPETITIONS.length} competitions
            </p>
          </div>
        )}
      </div>
    </section>
  );
} 