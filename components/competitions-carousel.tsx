"use client";
import { useState, useRef, useEffect } from "react";
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
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  // Animation duration in milliseconds
  const ANIMATION_DURATION = 30000; // 30 seconds

  // Intersection Observer for entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (carouselRef.current) {
      observer.observe(carouselRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation loop function
  const animate = (timestamp: DOMHighResTimeStamp) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    if (!isPaused) {
      const elapsed = timestamp - startTimeRef.current;
      const progress = (elapsed % ANIMATION_DURATION) / ANIMATION_DURATION;
      setAnimationProgress(progress);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Start animation
  useEffect(() => {
    const startAnimation = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    startAnimation();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle pause/resume
  const handlePause = () => {
    if (!isPaused) {
      pauseTimeRef.current = Date.now();
    }
    setIsPaused(true);
  };

  const handleResume = () => {
    if (isPaused) {
      const pauseDuration = Date.now() - pauseTimeRef.current;
      startTimeRef.current += pauseDuration;
    }
    setIsPaused(false);
  };

  // Handle drag to scroll (mouse events)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
    handlePause();
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
    handleResume();
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
    handlePause();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    handleResume();
  };

  // Combined mouse/touch leave handler
  const handleMouseLeave = () => {
    setIsDragging(false);
    handleResume();
  };

  // Pause animation on hover
  const handleMouseEnter = () => {
    handlePause();
  };

  return (
    <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-12 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-4xl font-bold text-gray-800 mb-4 animate-pulse">
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div 
            className="flex gap-6 transition-transform duration-1000 ease-in-out"
            style={{
              transform: `translateX(-${animationProgress * 50}%)`,
              transition: isPaused ? 'none' : 'transform 0.1s linear'
            }}
          >
            {/* Duplicate items for seamless loop */}
            {[...featuredCompetitions, ...featuredCompetitions, ...featuredCompetitions].map((competition, index) => (
              <div
                key={`${competition.id}-${index}`}
                className={`flex-shrink-0 w-80 bg-white rounded-xl shadow-lg transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-3 hover:shadow-2xl ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  animationDelay: `${(index % featuredCompetitions.length) * 200}ms`
                }}
              >
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl flex items-center justify-center overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <Image
                    src={competition.image}
                    alt={competition.title}
                    width={120}
                    height={120}
                    className="object-contain transition-transform duration-300 group-hover:scale-110 z-10"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold z-10">
                            ${competition.title.charAt(0)}
                          </div>
                        `;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="p-6 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full transition-all duration-300 hover:bg-blue-200 hover:scale-105">
                      {competition.category}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      {new Date(competition.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 transition-colors duration-300 group-hover:text-blue-600">
                    {competition.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {competition.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600 animate-pulse">
                      {competition.prize}
                    </span>
                    <Link
                      href={`/competitions/${competition.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-sm font-medium transform hover:scale-105 hover:shadow-lg active:scale-95"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Enhanced gradient overlays for smooth edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-blue-50 via-blue-50 to-transparent pointer-events-none z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-blue-50 via-blue-50 to-transparent pointer-events-none z-10"></div>
          
          {/* Floating animation indicators */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {featuredCompetitions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  Math.floor(animationProgress * featuredCompetitions.length) % featuredCompetitions.length === index
                    ? 'bg-blue-600 scale-125'
                    : 'bg-blue-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 