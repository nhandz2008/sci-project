import Image from "next/image";
import Link from "next/link";

const logos = [
  { src: "/assets/logos/IMO_logo.svg", alt: "IMO" },
  { src: "/assets/logos/FIRST_Robotics_Competition_(logo).svg.png", alt: "FIRST Robotics" },
  { src: "/assets/logos/logoWeb.png", alt: "SCI Web" },
  { src: "/assets/logos/images.png", alt: "General Science" },
  { src: "/assets/logos/2021_ISEF_Logo.png", alt: "ISEF" },
];

const Hero = () => (
  <div className="relative flex h-[55vh] w-full items-center justify-between px-10 overflow-hidden pb-40">
    {/* Background image, right-aligned, rounded bottom-left */}
    <Image
      src="/assets/images/image1.jpeg"
      alt="STEM students working on robotics"
      width={1200}
      height={1200}
      className="absolute inset-0 right-0 ml-auto w-[920px] h-[780px] rounded-bl-[100px] object-cover object-center z-0"
      priority
    />
    <div className="container mx-auto pt-32 relative z-10">
      <div className="grid grid-cols-12 text-center lg:text-left">
        <div className="col-span-full rounded-xl border border-white bg-white/90 py-10 px-8 shadow-lg shadow-black/10 backdrop-blur-sm backdrop-saturate-200 xl:col-span-7">
          <h1 className="lg:text-5xl !leading-snug text-3xl lg:max-w-3xl font-bold text-blue-900">
            Empowering the Next Generation of STEM Leaders
          </h1>
          <p className="mb-10 mt-6 !text-gray-900 text-lg">
            Discover, explore, and participate in global science and technology competitions. Science Competition Insights (SCI) connects students, educators, and innovators worldwide, providing opportunities to grow, compete, and excel in STEM fields.
          </p>
          <div className="mb-8 flex justify-center gap-4 lg:justify-start">
            <Link href="/competitions" passHref legacyBehavior>
              <a className="bg-gray-800 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors">
                View all competitions
              </a>
            </Link>
            <button className="border border-gray-800 text-gray-800 px-6 py-2 rounded-full font-semibold shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-2 transition-colors">
              {/* AI icon (Heroicons: Sparkles) */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M12 18.75V21M4.219 4.219l1.591 1.591M18.19 18.19l1.591 1.591M3 12h2.25M18.75 12H21M4.219 19.781l1.591-1.591M18.19 5.81l1.591-1.591M8.25 12a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0z" />
              </svg>
              Get AI recommendations
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 items-center justify-between gap-4 lg:justify-start mt-8">
            {logos.map((logo) => (
              <Image
                key={logo.src}
                width={120}
                height={60}
                className="w-28 h-14 object-contain grayscale opacity-70 mx-auto"
                src={logo.src}
                alt={logo.alt}
                aria-label={logo.alt}
                tabIndex={0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Hero; 