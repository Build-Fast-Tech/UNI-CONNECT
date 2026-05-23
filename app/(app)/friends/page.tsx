"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, UserMinus, UserCheck, Search,
  Clock, X, Check, Trash2, AlertCircle, Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
  sender?: Profile | null;
  receiver?: Profile | null;
}

export default function FriendsPage() {
  const supabase = createClient();
  const { userId, loaded } = useCurrentUser();

  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "find">("friends");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // States
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [allRequests, setAllRequests] = useState<FriendRequest[]>([]);

  // Search profiles state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // 1. Fetch all friend requests involving user
      const { data: reqsData } = await supabase
        .from("friend_requests")
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          sender:profiles!sender_id(id, full_name, username, avatar_url),
          receiver:profiles!receiver_id(id, full_name, username, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      const requestsList = (reqsData as unknown as FriendRequest[]) ?? [];
      setAllRequests(requestsList);

      // 2. Filter friends (accepted requests)
      const accepted = requestsList.filter(r => r.status === "accepted");
      const friendsList = accepted.map(r => {
        return r.sender_id === userId ? r.receiver! : r.sender!;
      }).filter(p => !!p);
      setFriends(friendsList);

      // 3. Filter incoming requests (pending)
      const incoming = requestsList.filter(r => r.status === "pending" && r.receiver_id === userId);
      setIncomingRequests(incoming);

      // 4. Filter outgoing requests (pending)
      const outgoing = requestsList.filter(r => r.status === "pending" && r.sender_id === userId);
      setOutgoingRequests(outgoing);

    } catch (err) {
      console.error("Error fetching friends data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loaded && userId) {
      fetchData();

      const channel = supabase
        .channel(`friends-realtime-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "friend_requests" },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, loaded]);

  // Handle Search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      if (!userId) return;
      const usernameQuery = query.startsWith("@") ? query.slice(1) : query;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .neq("id", userId)
        .or(`full_name.ilike.%${query}%,username.ilike.%${usernameQuery}%`)
        .limit(10);

      setSearchResults((data as Profile[]) ?? []);
      setSearching(false);
    }, 300);
  };

  // Helper to determine friendship status with a user
  const getFriendshipState = (otherId: string) => {
    const existing = allRequests.find(r => 
      (r.sender_id === userId && r.receiver_id === otherId) || 
      (r.sender_id === otherId && r.receiver_id === userId)
    );

    if (!existing) return { status: "none", requestId: null };
    if (existing.status === "accepted") return { status: "friends", requestId: existing.id };
    if (existing.status === "pending") {
      if (existing.sender_id === userId) {
        return { status: "outgoing", requestId: existing.id };
      } else {
        return { status: "incoming", requestId: existing.id };
      }
    }
    return { status: "none", requestId: null };
  };

  // Friend Actions
  const sendRequest = async (receiverId: string) => {
    if (!userId) return;
    setActionLoading(`send-${receiverId}`);
    try {
      await supabase.from("friend_requests").insert({
        sender_id: userId,
        receiver_id: receiverId,
        status: "pending"
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const acceptRequest = async (requestId: string) => {
    setActionLoading(`accept-${requestId}`);
    try {
      await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const declineOrCancel = async (requestId: string) => {
    setActionLoading(`decline-${requestId}`);
    try {
      await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!loaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[rgb(var(--muted-fg))]">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))]" />
        <span className="text-xs mt-2 font-medium">Loading friends hub…</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--fg))]">Friends Hub</h1>
        <p className="text-sm text-[rgb(var(--muted-fg))]">Manage your connections, pending requests, and discover new friends on campus.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 gap-1 rounded-xl bg-[rgb(var(--muted)/0.45)] border border-[rgb(var(--border))] w-fit">
        <button
          onClick={() => setActiveTab("friends")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5",
            activeTab === "friends"
              ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] shadow-sm"
              : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
          )}
        >
          <Users className="w-4 h-4" />
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5",
            activeTab === "requests"
              ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] shadow-sm"
              : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
          )}
        >
          <Clock className="w-4 h-4" />
          Requests ({incomingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("find")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5",
            activeTab === "find"
              ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] shadow-sm"
              : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
          )}
        >
          <UserPlus className="w-4 h-4" />
          Find People
        </button>
      </div>

      {/* Friends list tab */}
      {activeTab === "friends" && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="theme-card p-16 text-center">
              <Users className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
              <h3 className="text-base font-bold text-[rgb(var(--fg))] mb-1">No friends yet</h3>
              <p className="text-sm text-[rgb(var(--muted-fg))] mb-6 max-w-sm mx-auto">
                Connect with classmates, share notes, and collaborate on campus projects.
              </p>
              <button
                onClick={() => setActiveTab("find")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <UserPlus className="w-4 h-4" /> Find People
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map((friend) => {
                const fs = getFriendshipState(friend.id);
                return (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="theme-card p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                        {friend.avatar_url ? (
                          <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          friend.full_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{friend.full_name}</p>
                        {friend.username && (
                          <p className="text-xs text-[rgb(var(--muted-fg))] font-mono">@{friend.username}</p>
                        )}
                      </div>
                    </div>
                    {fs.requestId && (
                      <button
                        onClick={() => declineOrCancel(fs.requestId!)}
                        disabled={actionLoading === `decline-${fs.requestId}`}
                        className="p-2.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
                        title="Unfriend"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Friend requests tab */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* Incoming requests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[rgb(var(--primary))] uppercase tracking-wider px-1">
              Incoming Requests ({incomingRequests.length})
            </h3>
            {incomingRequests.length === 0 ? (
              <div className="theme-card p-8 text-center text-sm text-[rgb(var(--muted-fg))]">
                No pending incoming requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {incomingRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="theme-card p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                        {req.sender?.avatar_url ? (
                          <img src={req.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          req.sender?.full_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{req.sender?.full_name}</p>
                        {req.sender?.username && (
                          <p className="text-xs text-[rgb(var(--muted-fg))] font-mono">@{req.sender.username}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => acceptRequest(req.id)}
                        disabled={actionLoading === `accept-${req.id}`}
                        className="p-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 transition-opacity disabled:opacity-50"
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => declineOrCancel(req.id)}
                        disabled={actionLoading === `decline-${req.id}`}
                        className="p-2 rounded-xl border border-[rgb(var(--border))] text-red-400 hover:bg-red-500/10 hover:border-transparent transition-colors disabled:opacity-50"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing requests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[rgb(var(--muted-fg))] uppercase tracking-wider px-1">
              Sent Requests ({outgoingRequests.length})
            </h3>
            {outgoingRequests.length === 0 ? (
              <div className="theme-card p-8 text-center text-sm text-[rgb(var(--muted-fg))]">
                No pending sent requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {outgoingRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="theme-card p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                        {req.receiver?.avatar_url ? (
                          <img src={req.receiver.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          req.receiver?.full_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{req.receiver?.full_name}</p>
                        {req.receiver?.username && (
                          <p className="text-xs text-[rgb(var(--muted-fg))] font-mono">@{req.receiver.username}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => declineOrCancel(req.id)}
                      disabled={actionLoading === `decline-${req.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Find people tab */}
      {activeTab === "find" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name or username (e.g. @john)..."
              className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]"
            />
          </div>

          {/* Search results */}
          {searching ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--primary))]" />
            </div>
          ) : searchQuery.trim() && searchResults.length === 0 ? (
            <div className="theme-card p-12 text-center text-sm text-[rgb(var(--muted-fg))]">
              No matching profiles found for &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : searchQuery.trim() ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResults.map((user) => {
                const friendship = getFriendshipState(user.id);
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="theme-card p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.full_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{user.full_name}</p>
                        {user.username && (
                          <p className="text-xs text-[rgb(var(--muted-fg))] font-mono">@{user.username}</p>
                        )}
                      </div>
                    </div>

                    {/* Action button based on state */}
                    {friendship.status === "none" && (
                      <button
                        onClick={() => sendRequest(user.id)}
                        disabled={actionLoading === `send-${user.id}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Friend
                      </button>
                    )}
                    {friendship.status === "outgoing" && (
                      <button
                        onClick={() => declineOrCancel(friendship.requestId!)}
                        disabled={actionLoading === `decline-${friendship.requestId}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
                      >
                        Cancel Sent
                      </button>
                    )}
                    {friendship.status === "incoming" && (
                      <button
                        onClick={() => acceptRequest(friendship.requestId!)}
                        disabled={actionLoading === `accept-${friendship.requestId}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        Accept Request
                      </button>
                    )}
                    {friendship.status === "friends" && (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        Friends
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="theme-card p-12 text-center text-sm text-[rgb(var(--muted-fg))]">
              Start typing above to find classmates and friends.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
