"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, MessageSquare, Plus, Building2, Pin, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Society {
  id: string; name: string; description: string | null;
  category: string; member_count: number;
  logo_url: string | null; cover_url: string | null;
  university: { name: string; short_name: string } | null;
  admin: { full_name: string } | null;
}

interface Post {
  id: string; title: string | null; content: string; type: string;
  event_date: string | null; is_pinned: boolean; likes: number; created_at: string;
  author: { full_name: string; avatar_url: string | null } | null;
}

interface Member {
  full_name: string; avatar_url: string | null; username: string | null;
}

const TABS = ["Posts", "Events", "Members"];

export default function SocietyPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = use(params);
  const supabase = createClient();
  const { userId, role } = useCurrentUser();
  const isPlatformAdmin = role === "admin";

  const [society, setSociety] = useState<Society | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState("Posts");
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [posting, setPosting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // society admin_id

  useEffect(() => {
    (async () => {
      const [{ data: soc }, { data: postsData }, { data: membersData }] = await Promise.all([
        supabase
          .from("societies")
          .select("id,name,description,category,member_count,logo_url,cover_url,admin_id,university:universities!university_id(name,short_name),admin:profiles!admin_id(full_name)")
          .eq("id", societyId)
          .single(),
        supabase
          .from("society_posts")
          .select("id,title,content,type,event_date,is_pinned,likes,created_at,author:profiles!author_id(full_name,avatar_url)")
          .eq("society_id", societyId)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("society_members")
          .select("profile:profiles!user_id(full_name,avatar_url,username)")
          .eq("society_id", societyId)
          .limit(20),
      ]);

      setSociety(soc as unknown as Society);
      if (userId && soc) setIsAdmin((soc as any).admin_id === userId);
      setPosts((postsData as unknown as Post[]) ?? []);
      setMembers(((membersData ?? []) as unknown as { profile: Member | null }[]).map(m => m.profile).filter((p): p is Member => !!p));

      if (userId) {
        const { data: mem } = await supabase
          .from("society_members")
          .select("id")
          .eq("society_id", societyId)
          .eq("user_id", userId)
          .single();
        setIsMember(!!mem);
      }
      setLoading(false);
    })();
  }, [societyId, userId]);

  const deletePost = async (postId: string) => {
    await (supabase as any).from("society_posts").delete().eq("id", postId);
    setPosts(p => p.filter(post => post.id !== postId));
  };

  const createPost = async () => {
    if (!newContent.trim() || !userId) return;
    setPosting(true);
    const { data } = await supabase
      .from("society_posts")
      .insert({
        society_id: societyId,
        author_id: userId,
        content: newContent.trim(),
        title: newTitle.trim() || null,
        type: "post",
      })
      .select("id,title,content,type,event_date,is_pinned,likes,created_at,author:profiles!author_id(full_name,avatar_url)")
      .single();
    if (data) setPosts(p => [data as unknown as Post, ...p]);
    setNewContent("");
    setNewTitle("");
    setShowPost(false);
    setPosting(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
        <div className="h-48 rounded-2xl bg-[rgb(var(--muted))]" />
        <div className="h-12 rounded-xl bg-[rgb(var(--muted))] w-64" />
      </div>
    );
  }

  if (!society) {
    return <div className="text-center py-20 text-[rgb(var(--muted-fg))]">Society not found.</div>;
  }

  const displayedPosts = tab === "Posts"
    ? posts.filter(p => p.type === "post")
    : tab === "Events"
      ? posts.filter(p => p.type === "event" || p.type === "announcement")
      : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Cover */}
      <div className="relative h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-[rgb(var(--primary)/0.4)] to-[rgb(var(--accent)/0.2)]">
        {society.cover_url && (
          <img src={society.cover_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-5 flex items-end gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {society.logo_url
              ? <img src={society.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              : society.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">{society.name}</h1>
            {society.university && (
              <p className="text-xs text-white/70 flex items-center gap-1">
                <Building2 className="w-3 h-3" />{society.university.short_name}
              </p>
            )}
          </div>
        </div>
        <div className="absolute bottom-4 right-4">
          <span className="text-white/70 text-xs flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg">
            <Users className="w-3.5 h-3.5" />{society.member_count}
          </span>
        </div>
      </div>

      {society.description && (
        <p className="text-sm text-[rgb(var(--muted-fg))] px-1">{society.description}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[rgb(var(--muted))] w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              tab === t ? "bg-[rgb(var(--bg))] shadow-sm" : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* Post composer */}
      {isMember && tab === "Posts" && (
        <div className="theme-card p-4">
          {!showPost ? (
            <button
              onClick={() => setShowPost(true)}
              className="w-full text-left text-sm text-[rgb(var(--muted-fg))] px-3 py-2 bg-[rgb(var(--muted))] rounded-xl hover:bg-[rgb(var(--border))] transition-colors"
            >
              Share something with the society…
            </button>
          ) : (
            <div className="space-y-2">
              <input
                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
              />
              <textarea
                value={newContent} onChange={e => setNewContent(e.target.value)}
                rows={3} placeholder="What's on your mind?"
                className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={createPost}
                  disabled={!newContent.trim() || posting}
                  className="px-4 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-white text-sm font-medium disabled:opacity-40 hover:opacity-90"
                >
                  {posting ? "Posting…" : "Post"}
                </button>
                <button onClick={() => setShowPost(false)} className="px-4 py-1.5 rounded-xl bg-[rgb(var(--muted))] text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Posts / Events */}
      {tab !== "Members" && (
        <div className="space-y-3">
          {displayedPosts.length === 0 ? (
            <div className="theme-card p-10 text-center">
              <MessageSquare className="w-8 h-8 text-[rgb(var(--muted-fg))] mx-auto mb-2 opacity-30" />
              <p className="text-sm text-[rgb(var(--muted-fg))]">No {tab.toLowerCase()} yet</p>
            </div>
          ) : (
            displayedPosts.map((post, i) => (
              <motion.div key={post.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="theme-card p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                    {post.author?.avatar_url
                      ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                      : post.author?.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{post.author?.full_name}</span>
                      {post.is_pinned && <Pin className="w-3 h-3 text-[rgb(var(--primary))] fill-current" />}
                      <span className="text-xs text-[rgb(var(--muted-fg))] ml-auto">{formatRelativeTime(post.created_at)}</span>
                      {(isPlatformAdmin || isAdmin) && (
                        <button onClick={() => deletePost(post.id)}
                          className="p-1 rounded-lg text-[rgb(var(--muted-fg))] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                          title="Delete post">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {post.title && <h3 className="font-semibold mb-1">{post.title}</h3>}
                    <p className="text-sm text-[rgb(var(--muted-fg))]">{post.content}</p>
                    {post.event_date && (
                      <p className="text-xs text-[rgb(var(--primary))] mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.event_date).toLocaleDateString("en-PK", {
                          weekday: "short", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Members */}
      {tab === "Members" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {members.map((m, i) => (
            <div key={i} className="theme-card p-4 flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold overflow-hidden">
                {m.avatar_url
                  ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                  : m.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{m.full_name}</p>
                {m.username && (
                  <p className="text-xs text-[rgb(var(--primary))] font-mono">@{m.username}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
