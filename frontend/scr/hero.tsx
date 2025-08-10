import Image from "next/image";

const logos = [
  { src: "/assets/logos/IMO_logo.svg", alt: "IMO" },
  { src: "/assets/logos/FIRST_Robotics_Competition_(logo).svg.png", alt: "FIRST Robotics" },
  { src: "/assets/logos/logoWeb.png", alt: "SCI Web" },
  { src: "/assets/logos/images.png", alt: "General Science" },
  { src: "/assets/logos/2021_ISEF_Logo.webp", alt: "ISEF" },
];

const Hero = () => (
  <section className="relative flex h-[55vh] w-full items-center justify-between px-10 bg-gradient-to-br from-white to-gray-100 overflow-hidden">
    {/* Background image placeholder */}
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Replace with actual image if available */}
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-white opacity-60" />
    </div>
    <div className="container mx-auto mt-28 relative z-10">
      <div className="grid grid-cols-12 text-center lg:text-left">
        <div className="col-span-full rounded-xl border border-white bg-white/90 py-10 px-8 shadow-lg shadow-black/10 backdrop-blur-sm backdrop-saturate-200 xl:col-span-7">
          <h1 className="text-3xl lg:text-5xl font-bold text-blue-900 leading-snug max-w-3xl mx-auto lg:mx-0">
            Empowering the Next Generation of STEM Leaders.
          </h1>
          <p className="mb-10 mt-6 text-gray-900 text-lg max-w-2xl mx-auto lg:mx-0">
            Discover, explore, and participate in global science and technology competitions. SCI connects students, educators, and innovators worldwide, providing opportunities to grow, compete, and excel in STEM fields.
          </p>
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
  </section>
);

export default Hero;
