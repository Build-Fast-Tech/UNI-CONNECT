"use client";

const UNIVERSITIES = [
  "NUST", "LUMS", "FAST-NUCES", "COMSATS", "IBA Karachi", "GIKI",
  "UET Lahore", "Punjab University", "QAU", "NED University", "Air University",
  "Bahria University", "SZABIST", "IST Islamabad", "Habib University", "UCP",
  "Karachi University", "BZU Multan", "UAF Faisalabad", "MUET Jamshoro",
];

/**
 * Editorial university ticker. Quiet, hairline, dictionary-style listing
 * that drifts horizontally. No icons, no color noise — just type.
 */
export function UniversityTicker() {
  const doubled = [...UNIVERSITIES, ...UNIVERSITIES];

  return (
    <section
      id="universities"
      aria-label="Universities supported"
      className="relative overflow-hidden border-y border-[rgb(var(--line))] py-10 sm:py-14 bg-[rgb(var(--bg-sunk)/0.6)]"
    >
      {/* Edge fades */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10"
        style={{ background: "linear-gradient(to right, rgb(var(--bg)) 0%, transparent 100%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10"
        style={{ background: "linear-gradient(to left, rgb(var(--bg)) 0%, transparent 100%)" }}
      />

      <p className="eyebrow text-center mb-5">Supported across the country</p>

      <div className="flex gap-12 sm:gap-16 animate-marquee whitespace-nowrap">
        {doubled.map((uni, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 font-display italic text-[clamp(22px,3.4vw,42px)] leading-none text-[rgb(var(--fg))] flex-shrink-0"
          >
            <span className="w-1 h-1 rounded-full bg-[rgb(var(--accent))] flex-shrink-0" />
            {uni}
          </span>
        ))}
      </div>
    </section>
  );
}
