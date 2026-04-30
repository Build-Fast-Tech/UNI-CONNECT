"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Calendar, Megaphone, RefreshCw, ArrowLeft,
  Building2, Clock, Image as ImageIcon, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Post {
  id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  event_date: string | null;
  post_type: "announcement" | "event" | "update";
  created_at: string;
  society: {
    id: string;
    name: string;
    logo_url: string | null;
    university: { short_name: string } | null;
  } | null;
  author: { full_name: string; avatar_url: string | null } | null;
}

const POST_TYPE_CONFIG = {
  event:        { label: "Event",        icon: Calendar,  color: "text-violet-400 bg-violet-400/10" },
  announcement: { label: "Announcement", icon: Megaphone, color: "text-blue-400 bg-blue-400/10" },
  update:       { label: "Update",       icon: Zap,       color: "text-amber-400 bg-amber-400/10" },
};

const PAGE_SIZE = 10;

export default function SocietiesFeedPage() {
  const supabase = createClient();
  const { userId, loaded } = useCurrentUser();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [followedCount, setFollowedCount] = useState<number | null>(null);
  const cursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchPosts = useCallback(async (cursor: string | null, append: boolean) => {
    if (!userId) return;
    if (append) setLoadingMore(true); else setLoading(true);

    // Get followed society IDs first
    const { data: followed } = await (supabase as any)
      .from("society_followers")
      .select("society_id")
      .eq("user_id", userId);

    const societyIds = ((followed ?? []) as { society_id: string }[]).map(f => f.society_id);
    setFollowedCount(societyIds.length);

    if (societyIds.length === 0) {
      setPosts([]);
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    let q = (supabase as any)
      .from("society_posts")
      .select(`
        id, title, content, image_url, event_date, post_type, created_at,
        society:societies!society_id(id, name, logo_url, university:universities!university_id(short_name)),
        author:profiles!author_id(full_name, avatar_url)
      `)
      .in("society_id", societyIds)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      q = q.lt("created_at", cursor);
    }

    const { data, error } = await q;
    if (!error && data) {
      const typed = data as Post[];
      if (append) {
        setPosts(prev => [...prev, ...typed]);
      } else {
        setPosts(typed);
      }
      setHasMore(typed.length === PAGE_SIZE);
      if (typed.length > 0) {
        cursorRef.current = typed[typed.length - 1].created_at;
      }
    }

    setLoading(false);
    setLoadingMore(false);
  }, [userId, supabase]);

  // Initial load
  useEffect(() => {
    if (!loaded || !userId) return;
    cursorRef.current = null;
    fetchPosts(null, false);
  }, [loaded, userId, fetchPosts]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        fetchPosts(cursorRef.current, true);
      }
    }, { rootMargin: "200px" });
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, fetchPosts]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/societies" className="p-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors text-[rgb(var(--muted-fg))]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-[rgb(var(--primary))]" /> Society Feed
          </h1>
          <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">Posts from societies you follow</p>
        </div>
        <button
          onClick={() => { cursorRef.current = null; fetchPosts(null, false); }}
          disabled={loading}
          className="p-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors text-[rgb(var(--muted-fg))] disabled:opacity-40"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Not following any societies */}
      {!loading && followedCount === 0 && (
        <div className="theme-card p-12 text-center">
          <Zap className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
          <p className="font-semibold mb-1">Your feed is empty</p>
          <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">
            Follow societies to see their posts and events here.
          </p>
          <Link
            href="/societies"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Browse Societies
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="theme-card p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[rgb(var(--muted))]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-[rgb(var(--muted))] rounded w-1/3" />
                  <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/4" />
                </div>
              </div>
              <div className="h-4 bg-[rgb(var(--muted))] rounded w-3/4" />
              <div className="h-3 bg-[rgb(var(--muted))] rounded w-full" />
              <div className="h-3 bg-[rgb(var(--muted))] rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {/* Posts */}
      {!loading && posts.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {posts.map((post, i) => {
              const typeCfg = POST_TYPE_CONFIG[post.post_type] ?? POST_TYPE_CONFIG.update;
              const TypeIcon = typeCfg.icon;
              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="theme-card p-5 space-y-3"
                >
                  {/* Society info */}
                  <div className="flex items-center gap-3">
                    <Link href={`/societies/${post.society?.id}`} className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                        {post.society?.logo_url
                          ? <img src={post.society.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                          : post.society?.name.charAt(0) ?? "?"}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/societies/${post.society?.id}`} className="font-semibold text-sm hover:text-[rgb(var(--primary))] transition-colors">
                          {post.society?.name}
                        </Link>
                        {post.society?.university && (
                          <span className="flex items-center gap-0.5 text-[11px] text-[rgb(var(--muted-fg))]">
                            <Building2 className="w-3 h-3" />
                            {post.society.university.short_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", typeCfg.color)}>
                          <TypeIcon className="w-3 h-3" />
                          {typeCfg.label}
                        </span>
                        <span className="text-[11px] text-[rgb(var(--muted-fg))]">
                          {formatRelativeTime(post.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post content */}
                  {post.title && (
                    <h3 className="font-semibold text-base leading-snug">{post.title}</h3>
                  )}
                  <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Event date */}
                  {post.event_date && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--muted))] text-sm">
                      <Calendar className="w-4 h-4 text-[rgb(var(--primary))] flex-shrink-0" />
                      <span className="font-medium">
                        {new Date(post.event_date).toLocaleDateString("en-PK", {
                          weekday: "long", day: "numeric", month: "long",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {/* Image */}
                  {post.image_url && (
                    <div className="rounded-xl overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title ?? "Post image"}
                        className="w-full object-cover max-h-72"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[rgb(var(--border))]">
                    <span className="text-[11px] text-[rgb(var(--muted-fg))]">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(post.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <Link
                      href={`/societies/${post.society?.id}`}
                      className="ml-auto flex items-center gap-1 text-[11px] text-[rgb(var(--primary))] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> View Society
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <RefreshCw className="w-5 h-5 text-[rgb(var(--muted-fg))] animate-spin" />
        </div>
      )}

      {/* End of feed */}
      {!loading && !loadingMore && !hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-[rgb(var(--muted-fg))] py-4">
          You&apos;ve reached the end of your feed
        </p>
      )}
    </div>
  );
}
