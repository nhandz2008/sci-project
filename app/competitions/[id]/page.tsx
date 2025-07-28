import Link from "next/link";

// Example static data (replace with real data or fetch logic as needed)
const competition = {
  name: "International Mathematical Olympiad (IMO)",
  location: "Varies (hosted in a different country each year)",
  description: `
    The International Mathematical Olympiad (IMO) is the world’s most prestigious mathematics competition for high school students. Each year, teams from over 100 countries compete in a rigorous two-day exam that challenges participants with creative, complex problems in algebra, geometry, combinatorics, and number theory. The IMO fosters international friendship, mathematical excellence, and a spirit of collaboration among young mathematicians.
  `,
  modes: ["Offline"],
  scale: "International",
  size: "~600 participants",
  prizes: "Gold, Silver, Bronze medals; Honorable Mentions",
  homepage: "https://www.imo-official.org/",
};

export default function CompetitionDetailPage() {
  return (
    <section className="bg-gray-50 min-h-screen px-4 py-12">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-blue-900 mb-2">{competition.name}</h1>
          <div className="text-gray-500 text-lg">{competition.location}</div>
        </header>
        {/* Main content layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Description */}
          <article className="flex-1 prose prose-lg max-w-none text-gray-800 bg-white rounded-xl shadow p-6">
            {/*
              Style: Large, readable font, good line height, max-width for readability, clear paragraph spacing.
              Use Tailwind's prose classes for typography.
            */}
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">About this competition</h2>
            <p>{competition.description}</p>
          </article>
          {/* Info card */}
          <aside className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl shadow p-6 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-blue-900 mb-2">Quick Facts</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-blue-200 rounded-full" aria-hidden="true" />
                <span className="font-medium">Modes:</span> {competition.modes.join(", ")}
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-green-200 rounded-full" aria-hidden="true" />
                <span className="font-medium">Scale:</span> {competition.scale}
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-yellow-200 rounded-full" aria-hidden="true" />
                <span className="font-medium">Size:</span> {competition.size}
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-purple-200 rounded-full" aria-hidden="true" />
                <span className="font-medium">Prizes:</span> {competition.prizes}
              </li>
            </ul>
            <Link
              href={competition.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Visit official competition homepage"
            >
              Visit Official Website
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
} 