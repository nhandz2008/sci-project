"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface Competition {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  deadline: string;
  prize: string;
}

const featuredCompetitions: Competition[] = [
  {
    id: "1",
    title: "International Mathematical Olympiad",
    description: "The world's most prestigious mathematics competition for high school students.",
    image: "/logos/IMO_logo.svg",
    category: "Mathematics",
    deadline: "2024-07-15",
    prize: "$50,000"
  },
  {
    id: "2", 
    title: "FIRST Robotics Competition",
    description: "Build and program robots to compete in exciting challenges.",
    image: "/logos/FIRST_Robotics_Competition_(logo).svg.png",
    category: "Robotics",
    deadline: "2024-03-20",
    prize: "$25,000"
  },
  {
    id: "3",
    title: "Intel ISEF",
    description: "International Science and Engineering Fair for innovative research projects.",
    image: "/logos/2021_ISEF_Logo.png",
    category: "Science",
    deadline: "2024-05-10",
    prize: "$75,000"
  },
  {
    id: "4",
    title: "Google Science Fair",
    description: "Global online science competition open to students aged 13-18.",
    image: "/logos/logoWeb.png",
    category: "Technology",
    deadline: "2024-06-30",
    prize: "$50,000"
  },
  {
    id: "5",
    title: "Regeneron Science Talent Search",
    description: "America's oldest and most prestigious science competition.",
    image: "/logos/images.png",
    category: "Research",
    deadline: "2024-04-15",
    prize: "$250,000"
  },
  {
    id: "6",
    title: "Microsoft Imagine Cup",
    description: "Global student technology competition for innovative software solutions.",
    image: "/logos/logoWeb.png",
    category: "Software",
    deadline: "2024-07-25",
    prize: "$100,000"
  }
];

export default function CompetitionsCarousel() {
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Handle drag to scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (carouselRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Combined mouse leave handler
  const handleMouseLeave = () => {
    setIsPaused(false);
    setIsDragging(false);
  };

  // Pause animation on hover
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Featured Competitions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the most prestigious STEM competitions that can launch your career
          </p>
        </div>

        <div 
          ref={carouselRef}
          className="relative overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className={`flex gap-6 transition-transform duration-1000 ease-in-out ${
            isPaused ? 'animate-pause' : 'animate-scroll'
          }`}>
            {/* Duplicate items for seamless loop */}
            {[...featuredCompetitions, ...featuredCompetitions].map((competition, index) => (
              <div
                key={`${competition.id}-${index}`}
                className="flex-shrink-0 w-80 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl flex items-center justify-center">
                  <Image
                    src={competition.image}
                    alt={competition.title}
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {competition.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(competition.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                    {competition.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {competition.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      {competition.prize}
                    </span>
                    <Link
                      href={`/competitions/${competition.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Gradient overlays for smooth edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-blue-50 to-transparent pointer-events-none z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none z-10"></div>
        </div>
      </div>
    </section>
  );
} 