"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, ChevronDown, ChevronUp, Code2, Clock, Star, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type Difficulty = "beginner" | "intermediate" | "advanced";
type Lang = "C++" | "Python" | "Java";

interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedHours: number;
  tags: string[];
  lang: Lang;
  objectives: string[];
  starterCode: string;
}

const PROJECTS: Project[] = [
  {
    id: "p-001",
    title: "Student Grade Calculator",
    lang: "C++",
    difficulty: "beginner",
    estimatedHours: 2,
    tags: ["arrays", "loops", "structs"],
    description: "Build a grade management system that stores student names and marks, calculates average, letter grade (A/B/C/D/F), and prints a formatted report card.",
    objectives: [
      "Use a struct to hold student data (name, marks array, average)",
      "Calculate percentage and map to letter grade",
      "Find the class topper",
      "Print a formatted table with padding",
    ],
    starterCode: `#include<bits/stdc++.h>
using namespace std;

struct Student {
    string name;
    int marks[5]; // 5 subjects
    float average;
    char grade;
};

char getGrade(float avg) {
    // TODO: return 'A' if avg>=90, 'B' if >=80, etc.
}

int main() {
    int n;
    cin >> n;
    vector<Student> students(n);

    for(auto& s : students) {
        cin >> s.name;
        int sum = 0;
        for(int i=0;i<5;i++) { cin>>s.marks[i]; sum+=s.marks[i]; }
        s.average = sum / 5.0f;
        s.grade = getGrade(s.average);
    }

    // TODO: print report card and find topper
    return 0;
}`,
  },

  {
    id: "p-002",
    title: "Bank Account System",
    lang: "C++",
    difficulty: "intermediate",
    estimatedHours: 3,
    tags: ["OOP", "classes", "encapsulation"],
    description: "Implement a BankAccount class with deposit, withdraw, and balance inquiry features. Add a SavingsAccount subclass with interest calculation.",
    objectives: [
      "Encapsulate balance as private with validation in deposit/withdraw",
      "Throw exceptions on invalid operations (overdraft, negative amount)",
      "Derive SavingsAccount with monthly interest rate",
      "Implement an Account manager that handles multiple accounts",
    ],
    starterCode: `#include<bits/stdc++.h>
using namespace std;

class BankAccount {
protected:
    string owner;
    double balance;
    string accountNo;
public:
    BankAccount(string owner, string accNo, double initial=0.0);
    virtual void deposit(double amount);
    virtual bool withdraw(double amount);
    virtual void printStatement() const;
    double getBalance() const { return balance; }
};

class SavingsAccount : public BankAccount {
    double interestRate; // e.g. 0.05 for 5%
public:
    SavingsAccount(string owner, string accNo, double rate, double initial=0.0);
    void applyMonthlyInterest();
};

// TODO: implement all methods
int main() {
    SavingsAccount acc("Ali", "PK-001", 0.05, 1000.0);
    acc.deposit(500);
    acc.applyMonthlyInterest();
    acc.printStatement();
    return 0;
}`,
  },

  {
    id: "p-003",
    title: "Mini Text Adventure Game",
    lang: "C++",
    difficulty: "intermediate",
    estimatedHours: 4,
    tags: ["maps", "structs", "game-logic"],
    description: "Create a text-based adventure game with rooms, items, and simple commands (go, pick, drop, look). Player navigates between rooms and collects items.",
    objectives: [
      "Define Room struct with description, exits map (direction→room id), and items list",
      "Implement a game loop that reads commands",
      "Handle: look, go <direction>, pick <item>, inventory",
      "Add a win condition when the player has all required items",
    ],
    starterCode: `#include<bits/stdc++.h>
using namespace std;

struct Room {
    string name;
    string description;
    map<string,int> exits; // "north"->roomId
    vector<string> items;
};

struct Player {
    int currentRoom;
    vector<string> inventory;
};

void look(const Room& r) {
    // TODO: print room description and exits
}

int main() {
    vector<Room> rooms = {
        {0, "Entrance Hall", "A dusty hall.", {{"north",1}}, {"key"}},
        {1, "Library",       "Books everywhere.", {{"south",0},{"east",2}}, {"map"}},
        {2, "Treasure Room", "Gold glitters!", {{"west",1}}, {"gold"}},
    };

    Player player{0, {}};
    string command;

    cout << "=== UniConnect Adventure ===" << endl;
    look(rooms[player.currentRoom]);

    while(getline(cin, command)) {
        // TODO: parse and handle commands
    }
    return 0;
}`,
  },

  {
    id: "p-004",
    title: "Linked List Implementation",
    lang: "C++",
    difficulty: "intermediate",
    estimatedHours: 3,
    tags: ["DSA", "linked-list", "pointers"],
    description: "Build a singly linked list from scratch with insert, delete, search, reverse, and print operations. Then implement a doubly linked list.",
    objectives: [
      "Implement Node struct and LinkedList class",
      "insertFront, insertBack, insertAt(pos)",
      "deleteByValue, deleteAt(pos)",
      "reverse() in-place with O(n) time, O(1) space",
      "Detect and remove a cycle (bonus)",
    ],
    starterCode: `#include<bits/stdc++.h>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int d): data(d), next(nullptr) {}
};

class LinkedList {
    Node* head;
public:
    LinkedList(): head(nullptr) {}
    ~LinkedList();          // free all nodes

    void insertFront(int val);
    void insertBack(int val);
    void insertAt(int pos, int val);
    bool deleteByValue(int val);
    void reverse();
    void print() const;
    int length() const;
};

// TODO: implement all methods
int main() {
    LinkedList ll;
    ll.insertBack(1);
    ll.insertBack(2);
    ll.insertBack(3);
    ll.insertFront(0);
    ll.print();     // 0 1 2 3
    ll.reverse();
    ll.print();     // 3 2 1 0
    return 0;
}`,
  },

  {
    id: "p-005",
    title: "University Course Scheduler",
    lang: "C++",
    difficulty: "advanced",
    estimatedHours: 5,
    tags: ["graphs", "DSA", "topological-sort"],
    description: "Model courses as a directed graph where an edge A→B means A is a prerequisite for B. Use topological sort to produce a valid course completion order.",
    objectives: [
      "Represent the course dependency graph as adjacency list",
      "Detect cycles (impossible schedule) using DFS",
      "Generate a topological order using Kahn's algorithm",
      "Print all possible semesters if courses are grouped by level",
    ],
    starterCode: `#include<bits/stdc++.h>
using namespace std;

// Returns topological order, or empty vector if cycle exists
vector<int> topoSort(int n, vector<vector<int>>& adj) {
    vector<int> inDegree(n, 0);
    // TODO: compute in-degrees

    queue<int> q;
    // TODO: enqueue nodes with in-degree 0

    vector<int> order;
    while(!q.empty()) {
        // TODO: Kahn's BFS
    }
    if(order.size() != n) return {}; // cycle detected
    return order;
}

int main() {
    // 0=Math101, 1=CS101, 2=DS, 3=Algo, 4=OS
    int n = 5;
    vector<vector<int>> adj(n);
    adj[0].push_back(2); // Math101 → DS
    adj[1].push_back(2); // CS101 → DS
    adj[2].push_back(3); // DS → Algo
    adj[2].push_back(4); // DS → OS

    auto order = topoSort(n, adj);
    if(order.empty()) cout << "Circular dependency!";
    else { cout << "Course order: "; for(int c:order) cout<<c<<" "; }
    return 0;
}`,
  },

  {
    id: "p-006",
    title: "Simple Calculator (Stack-Based)",
    lang: "C++",
    difficulty: "intermediate",
    estimatedHours: 3,
    tags: ["stacks", "DSA", "parsing"],
    description: "Build a calculator that evaluates infix expressions like '3 + 4 * 2' using the Shunting Yard algorithm to convert to postfix, then evaluate.",
    objectives: [
      "Tokenise the input string into numbers and operators",
      "Implement Shunting Yard (infix → postfix) respecting precedence",
      "Evaluate the postfix expression using a stack",
      "Handle parentheses: '(3+4)*2'",
    ],
    starterCode: `#include<bits/stdc++.h>
using namespace std;

int precedence(char op) {
    if(op=='+'||op=='-') return 1;
    if(op=='*'||op=='/') return 2;
    return 0;
}

// Convert infix string to postfix tokens
vector<string> toPostfix(const string& expr) {
    // TODO: Shunting Yard
    return {};
}

// Evaluate postfix tokens
double evalPostfix(const vector<string>& tokens) {
    stack<double> s;
    // TODO: evaluate
    return s.top();
}

int main() {
    string expr;
    getline(cin, expr);
    auto postfix = toPostfix(expr);
    cout << fixed << setprecision(2) << evalPostfix(postfix) << endl;
    return 0;
}`,
  },

  {
    id: "p-007",
    title: "Inventory Management System",
    lang: "C++",
    difficulty: "beginner",
    estimatedHours: 2,
    tags: ["maps", "structs", "file-io"],
    description: "Build a simple shop inventory system. Add/remove products, update stock, search by name, and print a low-stock alert for items below threshold.",
    objectives: [
      "Use map<string, Product> for O(log n) lookup by name",
      "Support: add, remove, update, search commands",
      "Print products sorted by stock (ascending)",
      "Flag items with stock < 5 as LOW STOCK",
    ],
    starterCode: `#include<bits/stdc++.h>
using namespace std;

struct Product {
    string name;
    double price;
    int stock;
};

class Inventory {
    map<string, Product> items;
public:
    void addProduct(const Product& p);
    void removeProduct(const string& name);
    void updateStock(const string& name, int delta);
    void searchProduct(const string& name) const;
    void printAll() const;
    void printLowStock(int threshold=5) const;
};

int main() {
    Inventory inv;
    inv.addProduct({"Laptop",  150000.0, 3});
    inv.addProduct({"Mouse",     1500.0, 20});
    inv.addProduct({"Keyboard",  3000.0, 4});

    inv.printLowStock(); // Laptop & Keyboard
    inv.updateStock("Laptop", 5);
    inv.printAll();
    return 0;
}`,
  },

  {
    id: "p-008",
    title: "Binary Search Tree",
    lang: "C++",
    difficulty: "advanced",
    estimatedHours: 4,
    tags: ["DSA", "trees", "recursion"],
    description: "Implement a full BST with insert, search, delete (all three cases), and all traversals. Then find height, LCA, and k-th smallest element.",
    objectives: [
      "Insert maintaining BST property",
      "Delete: handle leaf, one child, two children (in-order successor)",
      "Inorder, Preorder, Postorder traversals",
      "Height of tree, LCA of two nodes",
      "K-th smallest using inorder traversal",
    ],
    starterCode: `#include<bits/stdc++.h>
using namespace std;

struct Node {
    int val;
    Node *left, *right;
    Node(int v): val(v), left(nullptr), right(nullptr) {}
};

class BST {
    Node* root;

    Node* insert(Node* node, int val);
    Node* remove(Node* node, int val);
    Node* findMin(Node* node);
    void inorder(Node* node, vector<int>& res);
    int height(Node* node);

public:
    BST(): root(nullptr) {}
    void insert(int val)   { root = insert(root, val); }
    void remove(int val)   { root = remove(root, val); }
    vector<int> inorder()  { vector<int> r; inorder(root,r); return r; }
    int height()           { return height(root); }
    int kthSmallest(int k);
};

int main() {
    BST bst;
    for(int v : {5,3,7,1,4,6,8}) bst.insert(v);
    auto io = bst.inorder();
    for(int x : io) cout << x << " "; // 1 3 4 5 6 7 8
    cout << "\nHeight: " << bst.height(); // 3
    return 0;
}`,
  },
];

const DIFF_STYLE: Record<Difficulty, { label: string; color: string; bg: string; border: string }> = {
  beginner:     { label: "Beginner",     color: "#50FA7B", bg: "rgba(80,250,123,0.1)",  border: "rgba(80,250,123,0.3)"  },
  intermediate: { label: "Intermediate", color: "#FFB86C", bg: "rgba(255,184,108,0.1)", border: "rgba(255,184,108,0.3)" },
  advanced:     { label: "Advanced",     color: "#FF5555", bg: "rgba(255,85,85,0.1)",   border: "rgba(255,85,85,0.3)"   },
};

const FILTERS: { id: Difficulty | "all"; label: string }[] = [
  { id: "all", label: "All Projects" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const ds = DIFF_STYLE[project.difficulty];

  return (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.3)", background: "rgba(15,5,29,0.6)" }}>
      {/* Card header */}
      <button className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <FolderKanban className="w-5 h-5" style={{ color: "#BD93F9" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-sm">{project.title}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ color: ds.color, background: ds.bg, border: `1px solid ${ds.border}` }}>
              {ds.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{ color: "#8BE9FD", background: "rgba(139,233,253,0.08)", border: "1px solid rgba(139,233,253,0.2)" }}>
              {project.lang}
            </span>
          </div>
          <p className="text-xs mt-1 line-clamp-2" style={{ color: "#94A3B8" }}>{project.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "#6272A4" }}>
              <Clock className="w-3 h-3" /> ~{project.estimatedHours}h
            </span>
            <div className="flex gap-1 flex-wrap">
              {project.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(255,255,255,0.15)", color: "#BD93F9", border: "1px solid rgba(255,255,255,0.2)" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: "#6272A4" }} />
                    : <ChevronDown className="w-4 h-4" style={{ color: "#6272A4" }} />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>

              {/* Objectives */}
              <div className="pt-4">
                <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "#BD93F9" }}>
                  <Star className="w-3.5 h-3.5" /> Learning Objectives
                </p>
                <ul className="space-y-1.5">
                  {project.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#CBD5E1" }}>
                      <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{ background: "rgba(255,255,255,0.2)", color: "#BD93F9", border: "1px solid rgba(255,255,255,0.3)" }}>
                        {i + 1}
                      </span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "#8BE9FD" }}>
                  <Tag className="w-3.5 h-3.5" /> Concepts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map(t => (
                    <span key={t} className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: "rgba(139,233,253,0.08)", color: "#8BE9FD", border: "1px solid rgba(139,233,253,0.2)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Starter Code toggle */}
              <div>
                <button onClick={() => setShowCode(s => !s)}
                  className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                  style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#BD93F9" }}>
                  <Code2 className="w-3.5 h-3.5" />
                  {showCode ? "Hide Starter Code" : "Show Starter Code"}
                </button>
                <AnimatePresence>
                  {showCode && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-3 rounded-xl overflow-hidden"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="px-4 py-2 text-[10px] font-mono"
                        style={{ background: "rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#BD93F9" }}>
                        starter_{project.id}.cpp
                      </div>
                      <pre className="px-4 py-3 text-xs font-mono overflow-x-auto leading-5"
                        style={{ background: "#0e0e0e", color: "#E2E8F0", maxHeight: 320 }}>
                        {project.starterCode}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const [filter, setFilter] = useState<Difficulty | "all">("all");

  const visible = filter === "all" ? PROJECTS : PROJECTS.filter(p => p.difficulty === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FolderKanban className="w-5 h-5" style={{ color: "#BD93F9" }} /> Projects
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
          Hands-on projects to cement your skills — from beginner to advanced
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Projects", value: PROJECTS.length, color: "#BD93F9" },
          { label: "Beginner",       value: PROJECTS.filter(p=>p.difficulty==="beginner").length, color: "#50FA7B" },
          { label: "Advanced",       value: PROJECTS.filter(p=>p.difficulty==="advanced").length, color: "#FF5555" },
        ].map(s => (
          <div key={s.label} className="coding-glass p-4 text-center rounded-xl">
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as any)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={filter === f.id ? {
              background: "linear-gradient(135deg,#6C3FD4,#4F46E5)",
              border: "1px solid rgba(255,255,255,0.5)", color: "#fff",
              boxShadow: "0 0 14px rgba(255,255,255,0.35)",
            } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Project cards */}
      <motion.div layout className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visible.map(p => (
            <motion.div key={p.id} layout
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
              <ProjectCard project={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
