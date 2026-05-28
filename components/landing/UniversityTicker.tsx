"use client";

const UNIVERSITIES = [
  "NUST", "LUMS", "FAST-NUCES", "COMSATS", "IBA", "GIKI",
  "UET Lahore", "Punjab University", "QAU", "NED", "Air University",
  "Bahria University", "SZABIST", "IST", "Habib University", "UCP",
  "Karachi University", "BZU", "UAF", "MUET",
];

export function UniversityTicker() {
  const quadrupled = [...UNIVERSITIES, ...UNIVERSITIES, ...UNIVERSITIES, ...UNIVERSITIES];

  return (
    <section id="universities" className="py-10 overflow-hidden relative">
      <div className="section-divider mb-10" />
      <div className="liquid-marquee relative">
        <div className="flex gap-10 animate-marquee whitespace-nowrap" style={{ animationDuration: "50s" }}>
          {quadrupled.map((uni, i) => (
            <span
              key={i}
              className="liquid-marquee-text inline-flex items-center gap-2.5 text-sm font-medium text-white/25 hover:text-white/60 transition-all duration-300 cursor-default flex-shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400/40" />
              {uni}
            </span>
          ))}
        </div>
      </div>
      <div className="section-divider mt-10" />
    </section>
  );
}
