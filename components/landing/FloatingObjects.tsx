const ITEMS = [
  { emoji: "📚", x: 7,  duration: 9,  delay: 0,   size: 4.5, rotate: -15 },
  { emoji: "🎓", x: 22, duration: 12, delay: 3,   size: 5.0, rotate: 8   },
  { emoji: "✏️", x: 40, duration: 10, delay: 6,   size: 4.0, rotate: 40  },
  { emoji: "📖", x: 58, duration: 11, delay: 1.5, size: 4.8, rotate: -10 },
  { emoji: "🖊️", x: 75, duration: 8,  delay: 4.5, size: 3.8, rotate: -35 },
  { emoji: "🎒", x: 88, duration: 13, delay: 2,   size: 5.2, rotate: 12  },
  { emoji: "📝", x: 30, duration: 14, delay: 7,   size: 4.2, rotate: -20 },
  { emoji: "📐", x: 65, duration: 9,  delay: 5,   size: 3.6, rotate: 30  },
];

export function FloatingObjects() {
  return (
    <>
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-120px) rotate(var(--r0)); opacity: 0; }
          8%   { opacity: 0.4; }
          90%  { opacity: 0.35; }
          100% { transform: translateY(110vh) rotate(var(--r1)); opacity: 0; }
        }
      `}</style>
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: -1 }}
        aria-hidden
      >
        {ITEMS.map((item, i) => (
          <div
            key={i}
            className="absolute top-0 select-none"
            style={{
              left: `${item.x}%`,
              fontSize: `${item.size}rem`,
              "--r0": `${item.rotate}deg`,
              "--r1": `${item.rotate + 25}deg`,
              animation: `fall ${item.duration}s ${item.delay}s ease-in infinite`,
              willChange: "transform, opacity",
              filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.25))",
            } as React.CSSProperties}
          >
            {item.emoji}
          </div>
        ))}
      </div>
    </>
  );
}
