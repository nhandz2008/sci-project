"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import LikeButton from "../../components/like-button";
import { useCompetitions } from "../hooks/useCompetitions";
import { Competition } from "../api/competitions";

// Helper function to get fallback image for competitions
const getFallbackImage = (competition: Competition) => {
  // Map competition titles to existing images or use a default
  const title = competition.title.toLowerCase();

  if (title.includes('mathematical') || title.includes('imo')) {
    return "/assets/logos/IMO_logo.svg";
  } else if (title.includes('robotics') || title.includes('first')) {
    return "/assets/logos/FIRST_Robotics_Competition_(logo).svg.png";
  } else if (title.includes('isef') || title.includes('science and engineering')) {
    return "/assets/logos/2021_ISEF_Logo.webp";
  } else if (title.includes('coding') || title.includes('programming')) {
    return "/assets/logos/images.png";
  } else if (title.includes('vietnam') || title.includes('national')) {
    return "/assets/images/image1.jpeg";
  } else {
    return "/assets/logos/logoWeb.png";
  }
};

// Helper function to check if image URL is valid
const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Helper function to map backend format to frontend display format
const mapCompetitionToDisplay = (competition: Competition) => {
  // Try to use the background image URL first, then fallback to local images
  let imageUrl = null;

  if (isValidImageUrl(competition.background_image_url)) {
    imageUrl = competition.background_image_url;
  } else {
    imageUrl = getFallbackImage(competition);
  }

  return {
    id: competition.id,
    name: competition.title,
    overview: competition.introduction || competition.overview || "No description available",
    scale: competition.scale ? competition.scale.charAt(0).toUpperCase() + competition.scale.slice(1).toLowerCase() : "Unknown",
    location: competition.location || "TBD",
    modes: competition.format ? [competition.format.charAt(0).toUpperCase() + competition.format.slice(1).toLowerCase()] : ["TBD"],
    homepage: competition.competition_link || "#",
    image: imageUrl,
  };
};

export default function CompetitionsPage() {
  const [search, setSearch] = useState("");
  const [scaleFilter, setScaleFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Fetch competitions from API
  const { competitions, loading, error, totalCount } = useCompetitions();

  // Get unique values for filters from API data with proper null checks
  const { scales, modes, locations } = useMemo(() => {
    if (!competitions || !Array.isArray(competitions)) {
      return { scales: [], modes: [], locations: [] };
    }

    const uniqueScales = [...new Set(competitions.map(c => c.scale ? c.scale.charAt(0).toUpperCase() + c.scale.slice(1).toLowerCase() : '').filter(Boolean))];
    const uniqueModes = [...new Set(competitions.map(c => c.format ? c.format.charAt(0).toUpperCase() + c.format.slice(1).toLowerCase() : '').filter(Boolean))];
    const uniqueLocations = [...new Set(competitions.map(c => c.location).filter(Boolean))];

    return {
      scales: uniqueScales,
      modes: uniqueModes,
      locations: uniqueLocations,
    };
  }, [competitions]);

  // Filter competitions based on search and filters with proper null checks
  const filteredCompetitions = useMemo(() => {
    if (!competitions || !Array.isArray(competitions)) {
      return [];
    }

    return competitions
      .map(mapCompetitionToDisplay)
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.overview.toLowerCase().includes(search.toLowerCase());
        const matchesScale = !scaleFilter || c.scale === scaleFilter;
        const matchesMode = !modeFilter || c.modes.includes(modeFilter);
        const matchesLocation = !locationFilter || c.location === locationFilter;
        return matchesSearch && matchesScale && matchesMode && matchesLocation;
      });
  }, [competitions, search, scaleFilter, modeFilter, locationFilter]);

  // Loading state
  if (loading) {
    return (
      <section className="px-4 py-16 min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-blue-900 mb-4">Explore Competitions</h1>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Browse and filter science & technology competitions worldwide. Find the right challenge for you!
            </p>
          </div>

          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="px-4 py-16 min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-blue-900 mb-4">Explore Competitions</h1>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Browse and filter science & technology competitions worldwide. Find the right challenge for you!
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-semibold mb-2 text-red-600">Error Loading Competitions</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

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
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse competitions</h2>
            <p className="text-gray-600">Find the perfect competition for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search Input */}
            <div className="space-y-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  placeholder="Search competitions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors bg-white hover:border-gray-400"
                  aria-label="Search competitions"
                />
              </div>
            </div>

            {/* Scale Filter */}
            <div className="space-y-2">
              <label htmlFor="scale-filter" className="block text-sm font-medium text-gray-700">
                Scale
              </label>
              <div className="relative">
                <select
                  id="scale-filter"
                  value={scaleFilter}
                  onChange={(e) => setScaleFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors bg-white hover:border-gray-400 appearance-none cursor-pointer"
                  aria-label="Filter by scale"
                >
                  <option value="">All scales</option>
                  {scales.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="location-filter"
                type="text"
                placeholder="Type or select location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors bg-white hover:border-gray-400"
                aria-label="Filter by location"
                list="location-options"
              />
              <datalist id="location-options">
                <option value="">All locations</option>
                {locations.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>

            {/* Mode Filter */}
            <div className="space-y-2">
              <label htmlFor="mode-filter" className="block text-sm font-medium text-gray-700">
                Mode
              </label>
              <div className="relative">
                <select
                  id="mode-filter"
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors bg-white hover:border-gray-400 appearance-none cursor-pointer"
                  aria-label="Filter by mode"
                >
                  <option value="">All modes</option>
                  {modes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(search || scaleFilter || locationFilter || modeFilter) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setSearch("");
                  setScaleFilter("");
                  setLocationFilter("");
                  setModeFilter("");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Competitions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCompetitions.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-16 text-xl">
              <div className="bg-white rounded-xl shadow-lg p-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-semibold mb-2">No competitions found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            </div>
          ) : (
            filteredCompetitions.map((c) => (
              <Link
                key={c.id}
                href={`/competitions/${c.id}`}
                className="block rounded-xl shadow-lg overflow-hidden hover:shadow-xl focus:shadow-xl transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-3 focus:scale-105 focus:-translate-y-3 hover:shadow-2xl focus:shadow-2xl group cursor-pointer bg-white hover:bg-gray-50 focus:bg-gray-50 border border-gray-100 hover:border-blue-200 focus:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                {/* Image Section */}
                <div className="relative h-48 rounded-t-xl overflow-hidden">
                  {c.image && !imageErrors.has(c.id) ? (
                    <img
                      src={c.image}
                      alt={`${c.name} logo`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={() => {
                        setImageErrors(prev => new Set(prev).add(c.id));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">{c.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Like Button - Top Right Corner */}
                  <div
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 transform group-hover:scale-110"
                    onClick={(e) => e.preventDefault()}
                  >
                    <LikeButton
                      competitionId={c.id}
                      competition={{
                        id: c.id,
                        title: c.name,
                        location: c.location,
                        introduction: c.overview,
                        competition_link: c.homepage,
                      }}
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 relative">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight mb-3 group-hover:text-blue-600 transition-colors duration-200">{c.name}</h2>
                  </div>

                  <p className="text-gray-700 text-base mb-4 leading-relaxed line-clamp-3">{c.overview}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 font-medium group-hover:bg-blue-200 transition-colors duration-200">{c.scale}</span>
                    <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 font-medium group-hover:bg-green-200 transition-colors duration-200">{c.location}</span>
                    {c.modes.map((m) => (
                      <span key={m} className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800 font-medium group-hover:bg-purple-200 transition-colors duration-200">{m}</span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="inline-flex items-center text-blue-600 group-hover:text-blue-800 font-semibold text-sm transition-colors duration-200">
                      View Details
                      <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Results Count */}
        {filteredCompetitions.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            <p className="text-lg">
              Showing {filteredCompetitions.length} of {totalCount} competitions
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
