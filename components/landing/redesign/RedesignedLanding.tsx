"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bot, MessageSquare, FileText, Globe, Briefcase, Code2, ScrollText,
  Sun, Moon, Menu, X, Play, Check, ChevronDown,
  UserPlus, Download, Zap,
} from "lucide-react";
import { Orbital } from "./Orbital";

/* ------------------------------------------------------------------ */
/* Content — preserved verbatim from the existing site                 */
/* ------------------------------------------------------------------ */
const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#universities", label: "Universities" },
  { href: "/jobs", label: "Jobs" },
  { href: "/notes", label: "Notes" },
  { href: "/ai", label: "AI" },
];

const UNIVERSITIES = [
  "NUST", "LUMS", "FAST-NUCES", "COMSATS", "IBA", "GIKI",
  "UET Lahore", "Punjab University", "QAU", "NED", "Air University",
  "Bahria University", "SZABIST", "IST", "Habib University", "UCP",
  "Karachi University", "BZU", "UAF", "MUET",
];

const STATS = [
  { value: "100+", label: "Universities" },
  { value: "24/7", label: "AI Help" },
  { value: "100%", label: "Free to Join" },
  { value: "1 App", label: "Everything in" },
];

const UNI_BADGES = [
  { initial: "N", name: "NUST", grad: "linear-gradient(150deg,#1e3a8a,#1d4ed8)" },
  { initial: "L", name: "LUMS", grad: "linear-gradient(150deg,#7f1d1d,#b91c1c)" },
  { initial: "F", name: "FAST-NUCES", grad: "linear-gradient(150deg,#9a3412,#c2410c)" },
  { initial: "C", name: "COMSATS", grad: "linear-gradient(150deg,#14532d,#15803d)" },
  { initial: "I", name: "IBA", grad: "linear-gradient(150deg,#3730a3,#4f46e5)" },
  { initial: "G", name: "GIKI", grad: "linear-gradient(150deg,#0f766e,#0d9488)" },
];

const STEPS = [
  { Icon: UserPlus, title: "Sign up & pick your university", desc: "Create your account, choose your university and branch. Your identity is instantly verified if you use a .edu.pk email." },
  { Icon: Download, title: "Join chats, download notes, post your CV", desc: "Dive into your university community, grab notes from any subject, and showcase your profile to employers." },
  { Icon: Zap, title: "Apply for jobs or ask the AI anything", desc: "One-click job applications with your uploaded CV. Ask UniConnect AI to explain anything — 24/7." },
];

const FAQS = [
  { q: "Is UniConnect free?", a: "Yes! UniConnect is completely free for students. We offer a Pro tier with unlimited AI messages and advanced CV features for students who want more." },
  { q: "Which universities are supported?", a: "We support 250+ Pakistani universities including NUST, LUMS, FAST-NUCES, COMSATS, IBA, GIKI, UET, NED, Air University, Bahria, SZABIST, and many more." },
  { q: "How are notes moderated?", a: "Notes go through automated checks and community voting. Users can report inappropriate content, which is reviewed by moderators within 24 hours." },
  { q: "Is my data safe?", a: "Absolutely. We use Supabase with Row Level Security on every table. Your data is never sold. You can delete your account and all data at any time." },
  { q: "Can employers see my CV without my permission?", a: "No. You control your CV visibility — you can set it to Public, Employers Only, or Private. With Private, only employers you've applied to can see it." },
  { q: "How does the AI know about my university's curriculum?", a: "UniConnect AI is powered by Claude, trained on broad academic knowledge. When you upload a note, the AI reads it directly and answers questions from that context." },
];

const SHOWCASE = [
  {
    id: "ai", label: "AI Assistant", Icon: Bot,
    title: "Your 24/7 AI study companion.",
    desc: "Ask anything, analyze your notes, prepare for exams. Powered by Google Gemini and available around the clock.",
    feats: ["Context-aware explanations", "Instant note summaries", "Step-by-step debugging"],
  },
  {
    id: "code", label: "Coding", Icon: Code2,
    title: "Code, run, and practice in the browser.",
    desc: "A full coding environment with instant execution. Prototype, practice for interviews, and learn — zero setup required.",
    feats: ["Instant in-browser execution", "Python, C++, Java and more", "Practice problems & battles"],
  },
  {
    id: "resume", label: "Resume Builder", Icon: ScrollText,
    title: "Build a CV employers actually open.",
    desc: "Upload your CV and let UniConnect analyze your skills and roles, so your profile stands out to the right employers.",
    feats: ["AI skill extraction", "Control your visibility", "One-click apply to jobs"],
  },
  {
    id: "career", label: "Career Hub", Icon: Briefcase,
    title: "Jobs built for Pakistani grads.",
    desc: "Employers post roles filtered by university. Students apply in one click with their uploaded CV.",
    feats: ["University-filtered roles", "One-click applications", "Internships & full-time"],
  },
];

/* ------------------------------------------------------------------ */
/* Reveal-on-scroll                                                    */
/* ------------------------------------------------------------------ */
function useReveal(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
    requestAnimationFrame(() => {
      els.forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight * 0.95) el.classList.add("in"); });
    });
    return () => io.disconnect();
  }, [rootRef]);
}

const Brand = () => (
  <span className="brand">
    <span className="mark">
      <svg viewBox="0 0 24 24" fill="none"><path d="M7 4v8a5 5 0 0 0 10 0V4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
    </span>
    UniConnect
  </span>
);

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */
function LandingNav({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const [shrink, setShrink] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setShrink(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`nav-shell${shrink ? " shrink" : ""}`}>
      <div style={{ width: "100%", maxWidth: "var(--maxw)" }}>
        <nav className="nav">
          <Link href="/" aria-label="UniConnect home"><Brand /></Link>
          <div className="nav-links">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </div>
          <div className="nav-right">
            <button
              className="theme-toggle"
              onClick={onToggle}
              aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
            >
              {dark ? <Moon /> : <Sun />}
            </button>
            <Link href="/login" className="signin">Log in</Link>
            <Link href="/signup" className="btn btn-blue">Sign up free</Link>
            <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
        <div className={`mobile-menu${open ? " open" : ""}`}>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
          <Link href="/signup" onClick={() => setOpen(false)}>Sign up free</Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-left">
          <span className="pill reveal"><span className="dot" /> Built exclusively for Pakistani university students</span>
          <h1 className="reveal">One campus. <span className="grad">Every campus.</span></h1>
          <div className="hero-cta reveal" style={{ marginTop: 30 }}>
            <Link href="/signup" className="btn btn-blue">
              Join UniConnect Free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Sign in <span className="play"><Play fill="currentColor" stroke="none" /></span>
            </Link>
          </div>
        </div>
        <div className="hero-right">
          <Orbital />
        </div>
      </div>
    </section>
  );
}

function UniMarquee() {
  const row = [...UNIVERSITIES, ...UNIVERSITIES];
  return (
    <section className="uni-strip" id="universities">
      <div className="uni-marquee">
        <div className="uni-track">
          {row.map((u, i) => (<span key={i}><i />{u}</span>))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="features" id="features">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">Everything you need</span>
          <h2>Everything a Pakistani student needs</h2>
          <p>We unified WhatsApp groups, Google Drives, LinkedIn, and Facebook pages into one clean, fast product.</p>
        </div>
        <div className="bento">
          {/* Wide — community */}
          <div className="fcard wide reveal">
            <div className="f-top">
              <div className="f-icon"><MessageSquare strokeWidth={1.8} /></div>
              <div><h3>Your university, your community</h3></div>
            </div>
            <p className="f-desc">Dedicated chats for your university, branch, and the entire nation. Every message carries your university tag.</p>
            <div className="f-demo">
              <div className="demo-chat">
                <div className="bubble-user">Anyone have the OS notes for midterm?</div>
                <div className="bubble-ai">
                  <span className="ai-face"><MessageSquare strokeWidth={1.8} /></span>
                  <span className="ai-text">Check the notes portal — just uploaded them! 📚</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="fcard reveal">
            <div className="f-top">
              <div className="f-icon"><FileText strokeWidth={1.8} /></div>
              <div><h3>Shared notes library</h3></div>
            </div>
            <p className="f-desc">Upload and discover notes from every university, subject, and semester.</p>
            <div className="f-demo">
              <div className="demo-list">
                <div className="file-row"><span className="ext" style={{ background: "#2563eb" }}>PDF</span><span className="fn">Data Structures · CS201</span></div>
                <div className="file-row"><span className="ext" style={{ background: "#16a34a" }}>PDF</span><span className="fn">Calculus II · MATH202</span></div>
                <div className="file-row"><span className="ext" style={{ background: "#dc2626" }}>PDF</span><span className="fn">Networks · CS301</span></div>
              </div>
            </div>
          </div>

          {/* Global chat */}
          <div className="fcard reveal">
            <div className="f-top">
              <div className="f-icon"><Globe strokeWidth={1.8} /></div>
              <div><h3>Global student chat</h3></div>
            </div>
            <p className="f-desc">Connect with students from every Pakistani university in one all-Pakistan chat.</p>
          </div>

          {/* Jobs */}
          <div className="fcard reveal">
            <div className="f-top">
              <div className="f-icon"><Briefcase strokeWidth={1.8} /></div>
              <div><h3>Jobs built for Pakistani grads</h3></div>
            </div>
            <p className="f-desc">Employers post jobs filtered by university. Students apply in one click with their CV.</p>
            <div className="f-demo">
              <div className="demo-jobs">
                <div className="job-row"><span className="jlogo" style={{ background: "#2563eb" }}>S</span><div className="jmeta"><div className="jt">Software Engineer Intern</div><div className="js">Systems Ltd · Karachi</div></div><span className="tag">New</span></div>
              </div>
            </div>
          </div>

          {/* AI */}
          <div className="fcard reveal">
            <div className="f-top">
              <div className="f-icon"><Bot strokeWidth={1.8} /></div>
              <div><h3>AI study companion</h3></div>
            </div>
            <p className="f-desc">Ask anything, analyze your notes, prepare for exams. Powered by Google Gemini, available 24/7.</p>
            <div className="f-demo">
              <div className="demo-chat">
                <div className="bubble-user">Time complexity of merge sort?</div>
                <div className="bubble-ai">
                  <span className="ai-face"><Bot strokeWidth={1.8} /></span>
                  <span className="ai-text">O(n log n) in all cases<span className="typing"><span /><span /><span /></span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  const [active, setActive] = useState("ai");
  return (
    <section className="showcase" id="showcase">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">See it in action</span>
          <h2>Powerful tools. Unified experience.</h2>
          <p>Explore how UniConnect brings everything you need into a single, seamless workspace.</p>
        </div>
        <div className="showcase-panel reveal">
          <div className="tabs">
            {SHOWCASE.map((t) => (
              <button key={t.id} className={`tab${active === t.id ? " active" : ""}`} onClick={() => setActive(t.id)}>
                <t.Icon strokeWidth={1.9} /> {t.label}
              </button>
            ))}
          </div>
          <div className="stage">
            {SHOWCASE.map((t) => (
              <div key={t.id} className={`panel-view${active === t.id ? " active" : ""}`}>
                <div className="pv-grid">
                  <div>
                    <h3>{t.title}</h3>
                    <p className="pv-desc">{t.desc}</p>
                    <div className="pv-feats">
                      {t.feats.map((f) => (
                        <div key={f} className="pv-feat"><span className="ck"><Check strokeWidth={3} /></span> {f}</div>
                      ))}
                    </div>
                  </div>
                  <div className="pv-mock mock-ai">
                    <div className="row"><span className="ttl">{t.label}</span><span className="pulse-dot" /></div>
                    {t.id === "code" ? (
                      <div className="demo-code">
                        <div className="ctop"><span className="d" style={{ background: "#ff5f57" }} /><span className="d" style={{ background: "#febc2e" }} /><span className="d" style={{ background: "#28c840" }} /><span className="lbl">main.py — UniConnect</span></div>
                        <pre>{`def factorial(n):
  if n == 0: return 1
  return n * factorial(n-1)
print(factorial(5))`}</pre>
                        <div className="crun"><span className="out">→ 120</span><span className="runbtn"><Play fill="currentColor" stroke="none" /></span></div>
                      </div>
                    ) : (
                      <>
                        <div className="q">{t.feats[0]}</div>
                        <div className="a">{t.desc}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="social">
      <div className="wrap social-grid">
        <div className="reveal">
          <span className="eyebrow">Trusted across Pakistan</span>
          <h2 style={{ fontSize: "clamp(28px,3vw,38px)", marginTop: 14 }}>Built for students at every university</h2>
          <div className="metrics">
            {STATS.map((s) => (
              <div key={s.label} className="metric">
                <div className="num">{s.value}</div>
                <div className="lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="badges reveal">
          {UNI_BADGES.map((b) => (
            <div key={b.name} className="uni-badge">
              <span className="crest" style={{ background: b.grad }}>{b.initial}</span>
              <div><div className="uname">{b.name}</div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">Get started</span>
          <h2>How it works</h2>
          <p>Up and running in under 30 seconds.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s.title} className="step reveal">
              <div className="s-top">
                <div className="s-icon"><s.Icon strokeWidth={1.9} /></div>
                <span className="s-num">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="faq">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">Questions</span>
          <h2>Frequently asked</h2>
          <p>Everything you need to know.</p>
        </div>
        <div className="faq-list reveal">
          {FAQS.map((f, i) => (
            <div key={f.q} className={`faq-item${open === i ? " open" : ""}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                {f.q} <ChevronDown />
              </button>
              <div className="faq-a"><div className="faq-a-inner"><p>{f.a}</p></div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="cta" id="cta">
      <div className="wrap">
        <div className="cta-box reveal">
          <div className="cta-left">
            <h2>Ready to connect?</h2>
            <p>Join 2,400+ students from across Pakistan who are already sharing notes, chatting, and landing jobs.</p>
          </div>
          <div className="cta-right">
            <Link href="/signup" className="btn btn-white">
              Join UniConnect Free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link href="/universities" className="btn btn-ghost-light">Browse Universities</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Legal", href: "/legal" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

function SiteFooter() {
  return (
    <footer>
      <div className="wrap foot-center">
        <Link href="/" aria-label="UniConnect home"><Brand /></Link>
        <nav className="foot-links">
          {FOOTER_LINKS.map((l) => (<Link key={l.label} href={l.href}>{l.label}</Link>))}
        </nav>
        <p className="foot-made">Made with <span className="heart" role="img" aria-label="love">❤️</span> in Pakistan</p>
        <p className="foot-copy">© 2026 UniConnect</p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */
export function RedesignedLanding() {
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);

  // Landing has its own light/dark theme (default LIGHT — white background, to
  // match the design reference). It's scoped to this page only and does not
  // touch the rest of the app's theme.
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      setDark(localStorage.getItem("uc-landing-theme") === "dark");
    } catch {}
  }, []);
  const toggleTheme = () => {
    setDark((d) => {
      const next = !d;
      try { localStorage.setItem("uc-landing-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  };

  return (
    <div className={`uc-landing${dark ? " ucl-dark" : ""}`} ref={rootRef}>
      <LandingNav dark={dark} onToggle={toggleTheme} />
      <Hero />
      <UniMarquee />
      <Features />
      <Showcase />
      <SocialProof />
      <HowItWorks />
      <FAQ />
      <CTA />
      <SiteFooter />
    </div>
  );
}
