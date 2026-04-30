"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Play, RotateCcw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Lab = "pointer" | "recursion" | "array";

// ── Pointer Playground ───────────────────────────────────────────
function PointerPlayground() {
  const [vars, setVars] = useState([
    { name: "a", value: 42,  addr: "0x1A4C" },
    { name: "b", value: 17,  addr: "0x1A50" },
    { name: "c", value: 99,  addr: "0x1A54" },
  ]);
  const [ptr, setPtr] = useState<string | null>(null);
  const [log, setLog]  = useState<string[]>(["// Pointer Playground loaded", "// Click a variable to point to it"]);

  const pointTo = (varName: string) => {
    const v = vars.find(x => x.name === varName);
    if (!v) return;
    setPtr(varName);
    setLog(l => [...l, `int* p = &${varName};  // p = ${v.addr}`, `*p = ${v.value};  // dereferenced value`]);
  };

  const derefModify = () => {
    if (!ptr) return;
    setVars(v => v.map(x => x.name === ptr ? { ...x, value: x.value + 1 } : x));
    setLog(l => [...l, `(*p)++;  // ${vars.find(x => x.name === ptr)?.name} is now ${(vars.find(x => x.name === ptr)?.value || 0) + 1}`]);
  };

  const reset = () => {
    setVars([{ name: "a", value: 42, addr: "0x1A4C" }, { name: "b", value: 17, addr: "0x1A50" }, { name: "c", value: 99, addr: "0x1A54" }]);
    setPtr(null);
    setLog(["// Reset. Click a variable to start."]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Pointer Playground</h3>
          <p className="text-xs text-[rgb(var(--muted-fg))]">Click a variable to point to it, then modify via pointer</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Memory layout */}
      <div className="grid grid-cols-3 gap-3">
        {vars.map(v => (
          <motion.button key={v.name} onClick={() => pointTo(v.name)}
            whileTap={{ scale: 0.97 }}
            className={cn("p-4 rounded-xl border-2 text-center transition-all",
              ptr === v.name ? "border-purple-500 bg-purple-500/10" : "border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.5)]")}>
            <div className="text-[10px] font-mono text-[rgb(var(--muted-fg))] mb-1">{v.addr}</div>
            <div className="text-2xl font-bold font-mono text-purple-300">{v.value}</div>
            <div className="text-xs font-mono mt-1">int {v.name}</div>
            {ptr === v.name && (
              <div className="mt-2 text-[10px] text-purple-400 font-mono animate-pulse">← p points here</div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Pointer display */}
      {ptr && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 font-mono text-sm text-purple-300">
          <span className="text-[rgb(var(--muted-fg))]">int* p = </span>&amp;{ptr}
          <span className="text-[rgb(var(--muted-fg))]"> = </span>
          {vars.find(v => v.name === ptr)?.addr}
          <span className="text-[rgb(var(--muted-fg))]"> | *p = </span>
          {vars.find(v => v.name === ptr)?.value}
        </motion.div>
      )}

      <button onClick={derefModify} disabled={!ptr}
        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 disabled:opacity-30 transition-opacity">
        Execute: (*p)++
      </button>

      {/* Console */}
      <div className="rounded-xl bg-[#0F051D] border border-purple-500/20 p-3 max-h-40 overflow-y-auto">
        {log.map((l, i) => (
          <div key={i} className={cn("text-xs font-mono", l.startsWith("//") ? "text-[rgb(var(--muted-fg))]" : "text-purple-300")}>{l}</div>
        ))}
      </div>
    </div>
  );
}

// ── Recursion Tree ───────────────────────────────────────────────
interface TreeNode { val: number; left?: TreeNode; right?: TreeNode; }

function buildFibTree(n: number, depth = 0): TreeNode {
  if (n <= 1 || depth > 5) return { val: n };
  return { val: n, left: buildFibTree(n - 1, depth + 1), right: buildFibTree(n - 2, depth + 1) };
}

function TreeViz({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const colors = ["text-purple-400", "text-blue-400", "text-emerald-400", "text-yellow-400", "text-orange-400", "text-pink-400"];
  const color = colors[depth % colors.length];
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: depth * 0.1 }}
        className={cn("w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold font-mono", color, "border-current bg-[rgb(var(--muted)/0.4)]")}>
        f({node.val})
      </motion.div>
      {(node.left || node.right) && (
        <div className="flex gap-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-[rgb(var(--border))]" />
          {node.left  && <TreeViz node={node.left}  depth={depth + 1} />}
          {node.right && <TreeViz node={node.right} depth={depth + 1} />}
        </div>
      )}
    </div>
  );
}

function RecursionTree() {
  const [n, setN] = useState(4);
  const [showTree, setShowTree] = useState(true);
  const tree = buildFibTree(n);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold">Recursion Tree Visualizer</h3>
        <p className="text-xs text-[rgb(var(--muted-fg))]">Visualize Fibonacci recursion tree expansion</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">fib(n) where n =</label>
        <input type="range" min={1} max={6} value={n} onChange={e => { setN(+e.target.value); setShowTree(false); setTimeout(() => setShowTree(true), 100); }}
          className="flex-1" />
        <span className="w-8 text-center font-bold font-mono text-[rgb(var(--primary))]">{n}</span>
        <button onClick={() => { setShowTree(false); setTimeout(() => setShowTree(true), 100); }}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]">
          <Play className="w-3 h-3" /> Draw
        </button>
      </div>
      <div className="rounded-xl bg-[#0F051D] border border-purple-500/20 p-4 overflow-auto min-h-48 flex items-start justify-center">
        {showTree && <TreeViz node={tree} />}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="theme-card p-3">
          <p className="text-xs text-[rgb(var(--muted-fg))]">Result</p>
          <p className="font-bold font-mono text-emerald-400">fib({n}) = {tree.val <= 1 ? tree.val : (() => { const f = (x: number): number => x <= 1 ? x : f(x-1)+f(x-2); return f(n); })()}</p>
        </div>
        <div className="theme-card p-3">
          <p className="text-xs text-[rgb(var(--muted-fg))]">Time Complexity</p>
          <p className="font-bold font-mono text-red-400">O(2ⁿ)</p>
        </div>
      </div>
    </div>
  );
}

// ── Array Engine ─────────────────────────────────────────────────
function ArrayEngine() {
  const [size, setSize]       = useState(6);
  const [arr, setArr]         = useState([42, 17, 8, 99, 33, 75]);
  const [selected, setSelected] = useState<number | null>(null);
  const [sorted, setSorted]   = useState(false);
  const [log, setLog]         = useState<string[]>(["// Array Engine ready"]);
  const [animating, setAnimating] = useState(false);
  const [swapping, setSwapping]   = useState<[number, number] | null>(null);

  const randomize = () => {
    const a = Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);
    setArr(a);
    setSorted(false);
    setLog(l => [...l, `// Array randomized: [${a.join(", ")}]`]);
  };

  const bubbleSort = async () => {
    setAnimating(true);
    setSorted(false);
    let a = [...arr];
    const newLog = [...log, "// Starting bubble sort…"];
    let pass = 0;
    for (let i = 0; i < a.length - 1; i++) {
      for (let j = 0; j < a.length - 1 - i; j++) {
        setSwapping([j, j + 1]);
        await new Promise(r => setTimeout(r, 300));
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          setArr([...a]);
          newLog.push(`  Swap arr[${j}]=${a[j+1]} ↔ arr[${j+1}]=${a[j]}`);
          pass++;
        }
      }
    }
    setSwapping(null);
    setSorted(true);
    setAnimating(false);
    setLog([...newLog, `// Sorted in ${pass} swaps`]);
  };

  const MAX_H = 100;
  const maxVal = Math.max(...arr);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Array Engine</h3>
          <p className="text-xs text-[rgb(var(--muted-fg))]">Dynamic memory visualization & sorting</p>
        </div>
        <div className="flex gap-2">
          <button onClick={randomize} disabled={animating}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] disabled:opacity-40">
            <RotateCcw className="w-3 h-3" /> Randomize
          </button>
          <button onClick={bubbleSort} disabled={animating || sorted}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 disabled:opacity-40">
            <Play className="w-3 h-3" /> Bubble Sort
          </button>
        </div>
      </div>

      {/* Size control */}
      <div className="flex items-center gap-3 text-sm">
        <span>Array size:</span>
        <input type="range" min={3} max={10} value={size} onChange={e => { setSize(+e.target.value); setArr(Array.from({ length: +e.target.value }, () => Math.floor(Math.random() * 100) + 1)); setSorted(false); }}
          className="flex-1" disabled={animating} />
        <span className="font-mono w-4">{size}</span>
      </div>

      {/* Visual bars */}
      <div className="rounded-xl bg-[#0F051D] border border-purple-500/20 p-4">
        <div className="flex items-end gap-2 h-32 justify-center">
          {arr.map((v, i) => {
            const h = Math.max(8, (v / maxVal) * MAX_H);
            const isSwapping = swapping && (swapping[0] === i || swapping[1] === i);
            const isSel = selected === i;
            return (
              <motion.div key={i} layout onClick={() => setSelected(isSel ? null : i)}
                animate={{ height: `${h}%` }} transition={{ duration: 0.15 }}
                className={cn("flex-1 min-w-0 rounded-t-md flex flex-col items-center justify-end cursor-pointer relative",
                  isSwapping ? "bg-red-500" : isSel ? "bg-yellow-400" : sorted ? "bg-emerald-500" : "bg-[rgb(var(--primary))]")}>
                <span className="text-[9px] font-bold text-white pb-0.5 truncate">{v}</span>
              </motion.div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2 justify-center">
          {arr.map((v, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-[rgb(var(--muted-fg))] font-mono">[{i}]</div>
          ))}
        </div>
      </div>

      {selected !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-sm font-mono text-yellow-400">
          arr[{selected}] = {arr[selected]} | address: 0x{(0x1000 + selected * 4).toString(16).toUpperCase()}
        </motion.div>
      )}

      {/* Log */}
      <div className="rounded-xl bg-[#0F051D] border border-purple-500/20 p-3 max-h-28 overflow-y-auto">
        {log.slice(-8).map((l, i) => (
          <div key={i} className={cn("text-xs font-mono", l.startsWith("//") ? "text-[rgb(var(--muted-fg))]" : "text-emerald-400")}>{l}</div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function VisualLabsPage() {
  const [active, setActive] = useState<Lab>("pointer");

  const LABS: { id: Lab; label: string; icon: string; desc: string }[] = [
    { id: "pointer",   label: "Pointer Playground", icon: "🔮", desc: "Visualize memory addresses and pointer dereferencing" },
    { id: "recursion", label: "Recursion Tree",     icon: "🌳", desc: "Watch recursive calls expand as a live tree" },
    { id: "array",     label: "Array Engine",       icon: "📊", desc: "Dynamic memory allocation and sorting visualization" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
          <Cpu className="w-5 h-5 text-[rgb(var(--primary))]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Visual Labs</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">Interactive visualizations for complex CS concepts</p>
        </div>
      </div>

      {/* Lab selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LABS.map(lab => (
          <button key={lab.id} onClick={() => setActive(lab.id)}
            className={cn("p-4 rounded-xl border text-left transition-all",
              active === lab.id ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.08)]" : "border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.4)]")}>
            <div className="text-2xl mb-2">{lab.icon}</div>
            <p className={cn("font-semibold text-sm", active === lab.id && "text-[rgb(var(--primary))]")}>{lab.label}</p>
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">{lab.desc}</p>
          </button>
        ))}
      </div>

      {/* Active lab */}
      <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="theme-card p-6">
        {active === "pointer"   && <PointerPlayground />}
        {active === "recursion" && <RecursionTree />}
        {active === "array"     && <ArrayEngine />}
      </motion.div>
    </div>
  );
}
