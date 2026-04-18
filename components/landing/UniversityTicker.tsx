"use client";

const UNIVERSITIES = [
  "NUST", "LUMS", "FAST-NUCES", "COMSATS", "IBA", "GIKI",
  "UET Lahore", "Punjab University", "QAU", "NED", "Air University",
  "Bahria University", "SZABIST", "IST", "Habib University", "UCP",
  "Karachi University", "BZU", "UAF", "MUET",
];

export function UniversityTicker() {
  const doubled = [...UNIVERSITIES, ...UNIVERSITIES];

  return (
    <section className="py-12 border-y border-[rgb(var(--border))] overflow-hidden bg-[rgb(var(--muted)/0.3)]">
      <div className="flex gap-8 animate-marquee whitespace-nowrap">
        {doubled.map((uni, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors cursor-default flex-shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary)/0.6)]" />
            {uni}
          </span>
        ))}
      </div>
    </section>
  );
}
