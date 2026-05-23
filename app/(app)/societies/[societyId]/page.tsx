"use client";

import { useState, useEffect, useRef, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Calendar, MessageSquare, Plus, Building2, Pin, Trash2, ImageIcon, X, Send, Heart, UserPlus, UserMinus, MessageCircle, Lock, Clock, Check, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Society {
  id: string; name: string; description: string | null;
  category: string; member_count: number; admin_id: string | null;
  logo_url: string | null; cover_url: string | null; visibility: string;
  university: { name: string; short_name: string } | null;
  admin: { full_name: string } | null;
}

interface Post {
  id: string; title: string | null; content: string; type: string; post_type: string;
  event_date: string | null; is_pinned: boolean; likes: number; created_at: string;
  image_url: string | null; image_urls: string[];
  author: { full_name: string; avatar_url: string | null } | null;
}

interface Member {
  id: string; full_name: string; avatar_url: string | null; username: string | null;
}

interface SocietyMember {
  id: string;
  user_id: string;
  role: string;
  status: "pending" | "approved";
  profile: Member | null;
}

const TABS = ["Posts", "Events", "Members"];

export default function SocietyPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = use(params);
  const supabase = createClient();
  const { userId, role } = useCurrentUser();
  const isPlatformAdmin = role === "admin";
  const router = useRouter();

  const [society, setSociety] = useState<Society | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState("Posts");
  const [isMember, setIsMember] = useState(false);
  const [memberStatus, setMemberStatus] = useState<"pending" | "approved" | null>(null);
  const [societyMembers, setSocietyMembers] = useState<SocietyMember[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [posting, setPosting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [postImages, setPostImages] = useState<File[]>([]);
  const [postPreviews, setPostPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchSocietyMembers = async () => {
    const { data } = await supabase
      .from("society_members")
      .select("id, user_id, role, status, profile:profiles!user_id(id, full_name, avatar_url, username)")
      .eq("society_id", societyId);
    if (data) {
      const typed = data as unknown as SocietyMember[];
      setSocietyMembers(typed);
      const approvedOnly = typed
        .filter(m => m.status === "approved" && m.profile)
        .map(m => m.profile!);
      setMembers(approvedOnly);
    }
  };

  useEffect(() => {
    (async () => {
      const [{ data: soc }, { data: postsData }] = await Promise.all([
        supabase
          .from("societies")
          .select("id,name,description,category,member_count,logo_url,cover_url,admin_id,visibility,university:universities!university_id(name,short_name),admin:profiles!admin_id(full_name)")
          .eq("id", societyId)
          .single(),
        supabase
          .from("society_posts")
          .select("id,title,content,type,post_type,event_date,is_pinned,likes,created_at,image_url,image_urls,author:profiles!author_id(full_name,avatar_url)")
          .eq("society_id", societyId)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(50)
      ]);

      setSociety(soc as unknown as Society);
      if (userId && soc) {
        setIsAdmin((soc as any).admin_id === userId);
        // Check if following
        const { data: followData } = await (supabase as any)
          .from("society_followers").select("user_id")
          .eq("society_id", societyId).eq("user_id", userId).maybeSingle();
        setIsFollowing(!!followData);
      }
      setPosts((postsData as unknown as Post[]) ?? []);

      if (userId) {
        const { data: mem } = await supabase
          .from("society_members")
          .select("id, status")
          .eq("society_id", societyId)
          .eq("user_id", userId)
          .maybeSingle();
        setIsMember(!!mem && mem.status === "approved");
        setMemberStatus(mem ? (mem.status as "pending" | "approved") : null);
      }
      await fetchSocietyMembers();
      setLoading(false);
    })();
  }, [societyId, userId]);

  const deletePost = async (postId: string) => {
    await (supabase as any).from("society_posts").delete().eq("id", postId);
    setPosts(p => p.filter(post => post.id !== postId));
  };

  const toggleFollow = async () => {
    if (!userId || !society) return;
    setFollowLoading(true);
    if (isFollowing) {
      await (supabase as any).from("society_followers").delete().eq("society_id", societyId).eq("user_id", userId);
      setIsFollowing(false);
    } else {
      await (supabase as any).from("society_followers").insert({ society_id: societyId, user_id: userId });
      setIsFollowing(true);
    }
    setFollowLoading(false);
  };

  const toggleJoin = async () => {
    if (!userId || !society) return;
    setJoinLoading(true);
    if (memberStatus === "approved") {
      await supabase.from("society_members").delete().eq("society_id", societyId).eq("user_id", userId);
      await supabase.from("societies").update({ member_count: Math.max(0, society.member_count - 1) }).eq("id", societyId);
      setSociety(s => s ? { ...s, member_count: Math.max(0, s.member_count - 1) } : s);
      setIsMember(false);
      setMemberStatus(null);
    } else if (memberStatus === "pending") {
      await supabase.from("society_members").delete().eq("society_id", societyId).eq("user_id", userId);
      setMemberStatus(null);
    } else {
      await supabase.from("society_members").insert({ society_id: societyId, user_id: userId, status: "pending" });
      setMemberStatus("pending");
    }
    await fetchSocietyMembers();
    setJoinLoading(false);
  };

  const approveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("society_members")
      .update({ status: "approved" })
      .eq("id", memberId);
    if (!error) {
      if (society) {
        await supabase.from("societies").update({ member_count: society.member_count + 1 }).eq("id", societyId);
        setSociety(s => s ? { ...s, member_count: s.member_count + 1 } : s);
      }
      await fetchSocietyMembers();
    }
  };

  const rejectMember = async (memberId: string) => {
    const { error } = await supabase
      .from("society_members")
      .delete()
      .eq("id", memberId);
    if (!error) {
      await fetchSocietyMembers();
    }
  };

  const kickMember = async (memberId: string) => {
    const { error } = await supabase
      .from("society_members")
      .delete()
      .eq("id", memberId);
    if (!error) {
      if (society) {
        await supabase.from("societies").update({ member_count: Math.max(0, society.member_count - 1) }).eq("id", societyId);
        setSociety(s => s ? { ...s, member_count: Math.max(0, s.member_count - 1) } : s);
      }
      await fetchSocietyMembers();
    }
  };

  const messageAdmin = async () => {
    if (!userId || !society?.admin_id || society.admin_id === userId) return;
    setMsgLoading(true);
    const adminId = society.admin_id;
    const { data: existing } = await supabase.from("channels").select("id").eq("type", "dm")
      .or(`and(dm_user_a.eq.${userId},dm_user_b.eq.${adminId}),and(dm_user_a.eq.${adminId},dm_user_b.eq.${userId})`)
      .maybeSingle();
    if (existing) {
      router.push(`/chat/${existing.id}`);
    } else {
      const { data: created } = await supabase.from("channels")
        .insert({ type: "dm", dm_user_a: userId, dm_user_b: adminId })
        .select("id").single();
      if (created) router.push(`/chat/${created.id}`);
    }
    setMsgLoading(false);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 30 - postImages.length);
    setPostImages(p => [...p, ...files]);
    setPostPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removePostImage = (i: number) => {
    URL.revokeObjectURL(postPreviews[i]);
    setPostImages(p => p.filter((_, idx) => idx !== i));
    setPostPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const createPost = async () => {
    if (!newContent.trim() || !userId) return;
    setPosting(true);

    // Upload images
    const imageUrls: string[] = [];
    for (const file of postImages) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("society-posts").upload(path, file);
      if (!upErr) imageUrls.push(supabase.storage.from("society-posts").getPublicUrl(path).data.publicUrl);
    }

    const { data } = await (supabase as any)
      .from("society_posts")
      .insert({
        society_id: societyId,
        author_id: userId,
        content: newContent.trim(),
        title: newTitle.trim() || null,
        type: "post",
        post_type: "announcement",
        image_url: imageUrls[0] ?? null,
        image_urls: imageUrls,
      })
      .select("id,title,content,type,post_type,event_date,is_pinned,likes,created_at,image_url,image_urls,author:profiles!author_id(full_name,avatar_url)")
      .single();
    if (data) setPosts(p => [data as unknown as Post, ...p]);
    setNewContent(""); setNewTitle(""); setPostImages([]); setPostPreviews([]);
    setShowPost(false); setPosting(false);
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

  const isEventPost = (p: Post) => p.post_type === "event" || p.type === "event";
  const displayedPosts = tab === "Posts"
    ? posts
    : tab === "Events"
      ? posts.filter(isEventPost)
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
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {society.visibility === "private" && (
            <span className="flex items-center gap-1 text-white/80 text-xs bg-black/40 px-2 py-1 rounded-lg">
              <Lock className="w-3 h-3" /> Private
            </span>
          )}
          <span className="text-white/70 text-xs flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg">
            <Users className="w-3.5 h-3.5" />{society.member_count}
          </span>
        </div>
      </div>

      {/* Action bar */}
      {userId && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Follow */}
          {society.admin_id !== userId && (
            <button onClick={toggleFollow} disabled={followLoading}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50",
                isFollowing
                  ? "bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.25)]"
                  : "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90")}>
              <Heart className={cn("w-4 h-4", isFollowing && "fill-current")} />
              {followLoading ? "…" : isFollowing ? "Following" : "Follow"}
            </button>
          )}
          {/* Join / Leave */}
          {society.admin_id !== userId && (
            <button onClick={toggleJoin} disabled={joinLoading}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50",
                memberStatus === "approved"
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : memberStatus === "pending"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                    : "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 shadow-sm"
              )}>
              {joinLoading ? "…" : (
                memberStatus === "approved" ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Leave
                  </>
                ) : memberStatus === "pending" ? (
                  <>
                    <Clock className="w-4 h-4 animate-pulse" />
                    Pending Approval
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Apply to Post
                  </>
                )
              )}
            </button>
          )}
          {/* Message Admin */}
          {society.admin_id && society.admin_id !== userId && (
            <button onClick={messageAdmin} disabled={msgLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[rgb(var(--muted))] text-[rgb(var(--fg))] hover:bg-[rgb(var(--border))] transition-colors disabled:opacity-50">
              <MessageCircle className="w-4 h-4" />
              {msgLoading ? "…" : `Message ${society.admin?.full_name?.split(" ")[0] ?? "Admin"}`}
            </button>
          )}
          {/* Admin badge */}
          {isAdmin && (
            <span className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-xl bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]">
              You are the Admin
            </span>
          )}
        </div>
      )}

      {society.description && (
        <p className="text-sm text-[rgb(var(--muted-fg))] px-1">{society.description}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[rgb(var(--muted))] w-fit">
        {(isAdmin ? [...TABS, "Society Users"] : TABS).map(t => (
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
      {(isMember || isAdmin || isPlatformAdmin) && tab === "Posts" && (
        <div className="theme-card overflow-hidden">
          {!showPost ? (
            <button onClick={() => setShowPost(true)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--muted)/0.5)] transition-colors">
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-[rgb(var(--primary))]" />
              </div>
              <span className="text-sm text-[rgb(var(--muted-fg))] flex-1 text-left">Share something with the society…</span>
              <Plus className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
            </button>
          ) : (
            <div className="p-4 space-y-3">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title (optional)"
                className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]" />
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={3} placeholder="What's on your mind?"
                className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] resize-none" />

              {/* Image previews */}
              {postPreviews.length > 0 && (
                <div className="grid grid-cols-5 gap-1.5">
                  {postPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[rgb(var(--muted))]">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removePostImage(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {postImages.length < 30 && (
                    <button onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-[rgb(var(--border))] flex items-center justify-center text-[rgb(var(--muted-fg))] hover:border-[rgb(var(--primary)/0.4)] hover:text-[rgb(var(--primary))] transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()} disabled={postImages.length >= 30}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors disabled:opacity-40">
                  <ImageIcon className="w-3.5 h-3.5" /> Add Photos {postImages.length > 0 && `(${postImages.length}/30)`}
                </button>
                <div className="flex-1" />
                <button onClick={() => { setShowPost(false); setPostImages([]); setPostPreviews([]); }}
                  className="px-3 py-1.5 rounded-xl text-xs text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]">Cancel</button>
                <button onClick={createPost} disabled={!newContent.trim() || posting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-xs font-semibold disabled:opacity-40 hover:opacity-90">
                  {posting ? "Posting…" : <><Send className="w-3.5 h-3.5" /> Post</>}
                </button>
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
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
                    <p className="text-sm text-[rgb(var(--muted-fg))] whitespace-pre-line">{post.content}</p>
                    {post.event_date && (
                      <p className="text-xs text-[rgb(var(--primary))] mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.event_date).toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    {/* Image grid */}
                    {(() => {
                      const imgs = post.image_urls?.length ? post.image_urls : (post.image_url ? [post.image_url] : []);
                      if (!imgs.length) return null;
                      const show = imgs.slice(0, 4);
                      const extra = imgs.length - 4;
                      return (
                        <div className={cn("grid gap-0.5 rounded-xl overflow-hidden mt-2", show.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                          {show.map((url, idx) => (
                            <div key={idx} className={cn("relative overflow-hidden bg-[rgb(var(--muted))]", show.length === 1 ? "aspect-[16/9]" : "aspect-square")}>
                              <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                              {idx === 3 && extra > 0 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white text-xl font-bold">+{extra}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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

      {/* Society Users (Admin only review tab) */}
      {tab === "Society Users" && isAdmin && (
        <div className="space-y-6 animate-fade-in">
          {/* Pending Requests Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--primary))] tracking-wide uppercase px-1">
              Pending Requests ({societyMembers.filter(m => m.status === "pending").length})
            </h3>
            {societyMembers.filter(m => m.status === "pending").length === 0 ? (
              <div className="theme-card p-8 text-center text-xs text-[rgb(var(--muted-fg))]">
                No pending requests.
              </div>
            ) : (
              <div className="space-y-2">
                {societyMembers.filter(m => m.status === "pending").map((m) => (
                  <div key={m.id} className="theme-card p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                        {m.profile?.avatar_url ? (
                          <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          m.profile?.full_name?.charAt(0) ?? "?"
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{m.profile?.full_name}</p>
                        {m.profile?.username && (
                          <p className="text-xs text-[rgb(var(--muted-fg))]">@{m.profile.username}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveMember(m.id)}
                        className="text-xs px-3.5 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] font-semibold hover:opacity-90 transition-opacity"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectMember(m.id)}
                        className="text-xs px-3.5 py-1.5 rounded-lg border border-[rgb(var(--border))] text-red-400 hover:bg-red-500/10 hover:border-transparent transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Members Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--muted-fg))] tracking-wide uppercase px-1">
              Active Members ({societyMembers.filter(m => m.status === "approved" && m.user_id !== society.admin_id).length})
            </h3>
            {societyMembers.filter(m => m.status === "approved" && m.user_id !== society.admin_id).length === 0 ? (
              <div className="theme-card p-8 text-center text-xs text-[rgb(var(--muted-fg))]">
                No active members.
              </div>
            ) : (
              <div className="space-y-2">
                {societyMembers.filter(m => m.status === "approved" && m.user_id !== society.admin_id).map((m) => (
                  <div key={m.id} className="theme-card p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                        {m.profile?.avatar_url ? (
                          <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          m.profile?.full_name?.charAt(0) ?? "?"
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{m.profile?.full_name}</p>
                        {m.profile?.username && (
                          <p className="text-xs text-[rgb(var(--muted-fg))]">@{m.profile.username}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => kickMember(m.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-red-400 hover:border-red-500/30 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
