"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, RotateCcw, ChevronLeft, CheckCircle, XCircle, Clock,
  Lightbulb, Terminal, Code2, ChevronDown, ChevronUp, Loader2, FlaskConical,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ALL_PROBLEMS } from "@/lib/coding/problems";

type SubmitStatus = "idle"|"running"|"accepted"|"wrong_answer"|"error"|"timeout"|"pending_key";

const LANG_LABELS: Record<string,string> = { cpp:"C++17", python:"Python 3", java:"Java", c:"C" };
const LANG_EXT:   Record<string,string> = { cpp:"cpp", python:"py", java:"java", c:"c" };

const SC: Record<SubmitStatus,{color:string;bg:string;border:string;label:string}> = {
  idle:        {color:"#94A3B8",bg:"transparent",              border:"transparent",            label:""},
  running:     {color:"#8BE9FD",bg:"rgba(139,233,253,0.06)",  border:"rgba(139,233,253,0.2)",  label:"Running…"},
  accepted:    {color:"#50FA7B",bg:"rgba(80,250,123,0.08)",   border:"rgba(80,250,123,0.3)",   label:"Accepted — All test cases passed!"},
  wrong_answer:{color:"#FFB86C",bg:"rgba(255,184,108,0.08)",  border:"rgba(255,184,108,0.3)",  label:"Wrong Answer"},
  error:       {color:"#FF5555",bg:"rgba(255,85,85,0.08)",    border:"rgba(255,85,85,0.3)",    label:"Runtime / Compile Error"},
  timeout:     {color:"#FF79C6",bg:"rgba(255,121,198,0.08)",  border:"rgba(255,121,198,0.3)",  label:"Time Limit Exceeded"},
  pending_key: {color:"#BD93F9",bg:"rgba(189,147,249,0.08)",  border:"rgba(189,147,249,0.3)",  label:"No compiler configured"},
};

/* ── Purple confetti ──────────────────────────────────────────── */
function Confetti({ active }: { active: boolean }) {
  const [ps, setPs] = useState<{id:number;x:number;color:string;delay:number;size:number;dur:number}[]>([]);
  useEffect(() => {
    if (!active) return;
    const cols = ["#BD93F9","#FF79C6","#50FA7B","#FFB86C","#8BE9FD","#6C3FD4","#FF5555"];
    setPs(Array.from({length:55},(_,i)=>({id:i,x:Math.random()*100,color:cols[Math.floor(Math.random()*cols.length)],delay:Math.random()*0.6,size:5+Math.random()*7,dur:1.4+Math.random()*1.4})));
    setTimeout(()=>setPs([]),3500);
  },[active]);
  if(!ps.length) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {ps.map(p=>(
        <div key={p.id} className="confetti-particle"
          style={{left:`${p.x}%`,top:"-20px",width:p.size,height:p.size,backgroundColor:p.color,
            animationDuration:`${p.dur}s`,animationDelay:`${p.delay}s`,
            borderRadius:p.id%2===0?"50%":"2px",boxShadow:`0 0 6px ${p.color}`}} />
      ))}
    </div>
  );
}

/* ── Syntax highlighter – Purple Knight ──────────────────────── */
function highlight(code: string) {
  return code
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/(\/\/[^\n]*)/g,'<span class="pk-comment">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g,'<span class="pk-string">$1</span>')
    .replace(/\b(int|long|short|char|bool|void|double|float|auto|string|vector|map|set|queue|stack|pair|using|namespace|std|include|return|if|else|while|for|do|break|continue|switch|case|class|struct|public|private|protected|virtual|new|delete|static|const|true|false|nullptr|this|cin|cout|endl)\b/g,'<span class="pk-keyword">$1</span>')
    .replace(/\b([A-Z][A-Za-z0-9_]*)\b/g,'<span class="pk-type">$1</span>')
    .replace(/\b(\d+)\b/g,'<span class="pk-number">$1</span>');
}

export default function ProblemIDEPage() {
  const {problemId} = useParams<{problemId:string}>();
  const router = useRouter();
  const supabase = createClient();
  const problem = ALL_PROBLEMS.find(p=>p.id===problemId);

  const [code,setCode]           = useState(problem?.starterCode||"");
  const [language,setLanguage]   = useState("cpp");
  const [status,setStatus]       = useState<SubmitStatus>("idle");
  const [output,setOutput]       = useState("");
  const [errLog,setErrLog]       = useState("");
  const [execMs,setExecMs]       = useState(0);
  const [showHints,setShowHints] = useState(false);
  const [showCases,setShowCases] = useState(true);
  const [activeCase,setActiveCase] = useState(0);
  const [userId,setUserId]       = useState<string|null>(null);
  const [solved,setSolved]       = useState(false);
  const [confetti,setConfetti]   = useState(false);
  const taRef  = useRef<HTMLTextAreaElement>(null);
  const hlRef  = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!problem){router.push("/coding/practice");return;}
    setCode(problem.starterCode); setStatus("idle"); setOutput(""); setErrLog("");
    supabase.auth.getUser().then(({data:{user}})=>{
      if(!user) return;
      setUserId(user.id);
      (supabase as any).from("coding_submissions").select("id").eq("user_id",user.id)
        .eq("problem_id",problem.id).eq("status","accepted").maybeSingle()
        .then(({data}:any)=>setSolved(!!data));
    });
  },[problemId]);

  const syncScroll=()=>{
    if(taRef.current&&hlRef.current){
      hlRef.current.scrollTop=taRef.current.scrollTop;
      hlRef.current.scrollLeft=taRef.current.scrollLeft;
    }
  };

  const handleTab=(e:React.KeyboardEvent<HTMLTextAreaElement>)=>{
    if(e.key==="Tab"){
      e.preventDefault();
      const el=e.currentTarget,s=el.selectionStart,end=el.selectionEnd;
      const nc=code.substring(0,s)+"    "+code.substring(end);
      setCode(nc);
      setTimeout(()=>{el.selectionStart=el.selectionEnd=s+4;},0);
    }
  };

  const compile=async(submit=false)=>{
    if(!problem) return;
    setStatus("running"); setOutput(""); setErrLog("");
    if(!submit){
      try{
        const r=await fetch("/api/coding/compile",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({code,language,stdin:problem.testCases[activeCase]?.input||""})});
        const d=await r.json();
        setStatus(d.status||"error"); setOutput(d.output||""); setErrLog(d.error||""); setExecMs(d.executionTime||0);
      }catch{setStatus("error");setErrLog("Network error.");}
      return;
    }
    let ok=true,lastOut="",lastErr="",totalMs=0;
    for(const tc of problem.testCases){
      try{
        const r=await fetch("/api/coding/compile",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({code,language,stdin:tc.input})});
        const d=await r.json();
        lastOut=d.output||""; lastErr=d.error||""; totalMs+=d.executionTime||0;
        if(d.status==="pending_key"){setStatus("pending_key");return;}
        if(d.status!=="accepted"||(d.output||"").trim()!==tc.expected.trim()){ok=false;break;}
      }catch{ok=false;break;}
    }
    const final:SubmitStatus=ok?"accepted":"wrong_answer";
    setStatus(final); setOutput(lastOut); setErrLog(lastErr); setExecMs(totalMs);
    if(ok&&!solved){setConfetti(true);setTimeout(()=>setConfetti(false),3500);}
    if(userId) await (supabase as any).from("coding_submissions").insert({
      user_id:userId,problem_id:problem.id,code,language,status:final,
      output:lastOut,error_log:lastErr,points_earned:ok&&!solved?problem.points:0,execution_time_ms:totalMs
    });
    if(ok) setSolved(true);
  };

  if(!problem) return null;
  const lines=code.split("\n").length;
  const sc=SC[status];
  const diffColor=problem.difficulty==="easy"?"#50FA7B":problem.difficulty==="medium"?"#FFB86C":"#FF5555";
  const diffBg=problem.difficulty==="easy"?"rgba(80,250,123,0.1)":problem.difficulty==="medium"?"rgba(255,184,108,0.1)":"rgba(255,85,85,0.1)";
  const diffBorder=problem.difficulty==="easy"?"rgba(80,250,123,0.3)":problem.difficulty==="medium"?"rgba(255,184,108,0.3)":"rgba(255,85,85,0.3)";

  return (
    <>
      <Confetti active={confetti} />
      <div className="flex flex-col gap-3" style={{height:"calc(100vh - 7.5rem)"}}>

        {/* Top bar */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/coding/practice" className="flex items-center gap-1 text-xs transition-colors" style={{color:"#94A3B8"}}
            onMouseEnter={e=>(e.currentTarget.style.color="#fff")} onMouseLeave={e=>(e.currentTarget.style.color="#94A3B8")}>
            <ChevronLeft className="w-4 h-4"/> Practice
          </Link>
          <div className="h-4 w-px" style={{background:"rgba(255,255,255,0.1)"}}/>
          <h1 className="font-semibold text-sm text-white flex-1 truncate">{problem.title}</h1>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
            style={{color:diffColor,background:diffBg,border:`1px solid ${diffBorder}`}}>
            {problem.difficulty}
          </span>
          <span className="text-xs font-bold shrink-0" style={{color:"#FFB86C"}}>{problem.points} pts</span>
          {solved&&<span className="flex items-center gap-1 text-xs shrink-0" style={{color:"#50FA7B"}}><CheckCircle className="w-3.5 h-3.5"/> Solved</span>}
        </div>

        {/* 2-col layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">

          {/* ── Left: Problem description ── */}
          <div className="flex flex-col min-h-0 overflow-hidden rounded-2xl"
            style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white mb-3">{problem.title}</h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{color:"#CBD5E1"}}>{problem.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {problem.tags.map(tag=>(
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                    style={{background:"rgba(189,147,249,0.1)",color:"#BD93F9",border:"1px solid rgba(189,147,249,0.2)"}}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Test cases */}
              <div>
                <button onClick={()=>setShowCases(v=>!v)} className="flex items-center gap-2 text-xs font-semibold mb-2 transition-opacity hover:opacity-80" style={{color:"#94A3B8"}}>
                  Examples {showCases?<ChevronUp className="w-3.5 h-3.5"/>:<ChevronDown className="w-3.5 h-3.5"/>}
                </button>
                <AnimatePresence>
                  {showCases&&(
                    <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden space-y-2">
                      <div className="flex gap-1">
                        {problem.testCases.slice(0,3).map((_,i)=>(
                          <button key={i} onClick={()=>setActiveCase(i)} className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                            style={activeCase===i?{background:"rgba(255,255,255,0.3)",color:"#BD93F9",border:"1px solid rgba(255,255,255,0.4)"}
                              :{background:"rgba(255,255,255,0.04)",color:"#6272A4",border:"1px solid rgba(255,255,255,0.06)"}}>
                            Case {i+1}
                          </button>
                        ))}
                      </div>
                      <div className="rounded-xl overflow-hidden text-xs" style={{border:"1px solid rgba(255,255,255,0.06)"}}>
                        <div className="px-3 py-2" style={{borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(0,0,0,0.25)"}}>
                          <p className="text-[10px] mb-1" style={{color:"#6272A4"}}>Input:</p>
                          <pre className="font-mono" style={{color:"#50FA7B"}}>{problem.testCases[activeCase]?.input}</pre>
                        </div>
                        <div className="px-3 py-2" style={{background:"rgba(0,0,0,0.12)"}}>
                          <p className="text-[10px] mb-1" style={{color:"#6272A4"}}>Expected Output:</p>
                          <pre className="font-mono" style={{color:"#8BE9FD"}}>{problem.testCases[activeCase]?.expected}</pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hints */}
              {problem.hints.length>0&&(
                <div>
                  <button onClick={()=>setShowHints(v=>!v)} className="flex items-center gap-2 text-xs font-semibold transition-opacity hover:opacity-80" style={{color:"#FFB86C"}}>
                    <Lightbulb className="w-3.5 h-3.5"/> Hints ({problem.hints.length})
                    {showHints?<ChevronUp className="w-3.5 h-3.5"/>:<ChevronDown className="w-3.5 h-3.5"/>}
                  </button>
                  <AnimatePresence>
                    {showHints&&(
                      <motion.ul initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden mt-2 space-y-1.5 pl-4">
                        {problem.hints.map((h,i)=><li key={i} className="text-xs list-disc" style={{color:"#94A3B8"}}>{h}</li>)}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: IDE ── */}
          <div className="flex flex-col gap-2 min-h-0">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
              style={{background:"rgba(26,11,46,0.9)",border:"1px solid rgba(255,255,255,0.25)"}}>
              <Code2 className="w-3.5 h-3.5 shrink-0" style={{color:"#BD93F9"}}/>
              <span className="text-xs font-mono flex-1" style={{color:"#6272A4"}}>solution.{LANG_EXT[language]}</span>
              <select value={language} onChange={e=>setLanguage(e.target.value)}
                className="h-6 px-2 rounded-md text-xs focus:outline-none"
                style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(189,147,249,0.2)",color:"#BD93F9"}}>
                {Object.entries(LANG_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
              <button onClick={()=>{setCode(problem.starterCode);setStatus("idle");}}
                className="p-1 rounded-md hover:bg-white/5 transition-colors" title="Reset code">
                <RotateCcw className="w-3 h-3" style={{color:"#6272A4"}}/>
              </button>
            </div>

            {/* Code editor */}
            <div className="flex-1 rounded-xl overflow-hidden relative min-h-0"
              style={{background:"#0e0e0e",border:"1px solid rgba(255,255,255,0.2)",boxShadow:"inset 0 0 40px rgba(255,255,255,0.04)"}}>
              <div className="flex h-full">
                {/* Line numbers */}
                <div className="pt-4 pb-4 px-3 select-none shrink-0"
                  style={{borderRight:"1px solid rgba(255,255,255,0.04)",color:"#3a2f54",fontFamily:"'Fira Code',monospace",fontSize:"13px",lineHeight:"24px",minWidth:"40px",textAlign:"right"}}>
                  {Array.from({length:lines},(_,i)=><div key={i}>{i+1}</div>)}
                </div>
                {/* Editor */}
                <div className="relative flex-1 min-w-0 overflow-hidden">
                  <div ref={hlRef} className="absolute inset-0 p-4 pointer-events-none overflow-auto"
                    style={{fontFamily:"'Fira Code',monospace",fontSize:"13px",lineHeight:"24px",color:"transparent",whiteSpace:"pre"}}
                    dangerouslySetInnerHTML={{__html:highlight(code)+"\n"}}/>
                  <textarea ref={taRef} value={code} onChange={e=>setCode(e.target.value)}
                    onKeyDown={handleTab} onScroll={syncScroll} spellCheck={false}
                    className="absolute inset-0 w-full h-full p-4 resize-none bg-transparent focus:outline-none"
                    style={{fontFamily:"'Fira Code',monospace",fontSize:"13px",lineHeight:"24px",color:"rgba(226,232,240,0.92)",tabSize:4,caretColor:"#BD93F9"}}/>
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0 text-xs"
              style={{background:"rgba(15,5,29,0.9)",border:"1px solid rgba(255,255,255,0.05)"}}>
              <div className="w-2 h-2 rounded-full"
                style={{background:status==="accepted"?"#50FA7B":status==="running"?"#8BE9FD":status==="idle"?"#3a2f54":"#FF5555"}}/>
              <span style={{color:"#6272A4"}}>Piston</span>
              <span style={{color:"#3a2f54"}}>|</span>
              <span style={{color:"#6272A4"}}>{LANG_LABELS[language]}</span>
              <span style={{color:"#3a2f54"}}>|</span>
              <span style={{color:"#6272A4"}}>{lines} ln</span>
              {execMs>0&&<><span style={{color:"#3a2f54"}}>|</span><span style={{color:"#6272A4"}}>{execMs}ms</span></>}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 shrink-0">
              <button onClick={()=>compile(false)} disabled={status==="running"}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#E2E8F0"}}>
                {status==="running"?<Loader2 className="w-4 h-4 animate-spin"/>:<Play className="w-4 h-4"/>}
                Run
              </button>
              <button onClick={()=>compile(true)} disabled={status==="running"||!userId}
                className="coding-btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm disabled:opacity-40">
                {status==="running"?<Loader2 className="w-4 h-4 animate-spin"/>:<FlaskConical className="w-4 h-4"/>}
                {solved?"Re-submit":"Submit Solution"}
              </button>
            </div>

            {/* Output */}
            <AnimatePresence>
              {status!=="idle"&&(
                <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                  className="rounded-xl overflow-hidden shrink-0"
                  style={{border:`1px solid ${sc.border}`,background:sc.bg}}>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold"
                    style={{borderBottom:`1px solid ${sc.border}`,color:sc.color}}>
                    {status==="running"?<Loader2 className="w-3.5 h-3.5 animate-spin"/>
                      :status==="accepted"?<CheckCircle className="w-3.5 h-3.5"/>
                      :status==="timeout"?<Clock className="w-3.5 h-3.5"/>
                      :<XCircle className="w-3.5 h-3.5"/>}
                    {sc.label}
                    {status==="accepted"&&!solved&&(
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{background:"rgba(80,250,123,0.15)",color:"#50FA7B",border:"1px solid rgba(80,250,123,0.3)"}}>
                        +{problem.points} pts
                      </span>
                    )}
                    {execMs>0&&<span className="ml-auto" style={{color:"#6272A4"}}>{execMs}ms</span>}
                  </div>
                  {(output||errLog)&&(
                    <pre className="px-3 py-2.5 text-xs font-mono max-h-28 overflow-y-auto whitespace-pre-wrap"
                      style={{color:status==="error"?"#FF5555":"#E2E8F0",background:"rgba(15,5,29,0.7)"}}>
                      {output||errLog}
                    </pre>
                  )}
                  {status==="pending_key"&&(
                    <p className="px-3 py-2 text-xs" style={{color:"#94A3B8"}}>
                      Run Piston on localhost:2000 or add <code className="font-mono" style={{color:"#BD93F9"}}>JUDGE0_API_KEY</code> to .env.local
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
