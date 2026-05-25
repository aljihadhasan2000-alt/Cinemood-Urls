import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Unlock,
  Key,
  Globe,
  Sparkles,
  Eye,
  Calendar,
  User,
  ExternalLink,
  Share2,
  AlertCircle,
  Clock,
  Check,
  Copy,
  ChevronRight
} from "lucide-react";
import { detectPlatform } from "./LinkDetector";
import { Collection } from "../types";

interface PublicViewProps {
  slug: string;
}

export function PublicView({ slug }: PublicViewProps) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Load public hub on mount or slug parameter change
  useEffect(() => {
    fetchCollection();
  }, [slug]);

  const fetchCollection = async (passwordCode?: string) => {
    try {
      setLoading(true);
      setError("");

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (passwordCode) {
        headers["x-cinemood-password"] = passwordCode;
      }

      const res = await fetch(`/api/collections/${slug}`, {
        headers
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 410) {
          throw new Error("This collection has expired.");
        }
        throw new Error(data.error || "Collection not found.");
      }

      setCollection(data);
    } catch (e: any) {
      setError(e.message || "Failed to load Cinemood Collection.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    try {
      const res = await fetch(`/api/collections/${slug}/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: passwordInput })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Incorrect password.");
      }

      // Successfully unlocked, store full collection
      setCollection(data.collection);
    } catch (err: any) {
      setPasswordError(err.message || "Access Denied.");
    }
  };

  const handleLinkClick = async (linkId: string) => {
    try {
      // Incrememnt click count on the server
      fetch(`/api/collections/${slug}/links/${linkId}/click`, {
        method: "POST"
      });
    } catch (e) {
      console.error("Failed to track click:", e);
    }
  };

  const handleCopyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-purple-glow/10 border border-purple-glow/30">
          <div className="absolute w-12 h-12 border-2 border-t-transparent border-purple-glow rounded-full animate-spin" />
          <Sparkles className="h-5 w-5 text-purple-glow animate-pulse" />
        </div>
        <span className="font-display text-xl tracking-[1px] text-zinc-400">Loading Cinemood Stage...</span>
      </div>
    );
  }

  // IF SYSTEM DIRECT ACTION ERROR (Expired, 404, etc.)
  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-950/40 border border-red-500/40 text-red-500 flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="font-display text-3xl tracking-wider text-white uppercase mb-2">Stage Inaccessible</h2>
        <p className="font-sans text-xs text-zinc-400 mb-8 leading-relaxed">
          {error === "This collection has expired." 
            ? "The creator set an expiry period. This Cinemood link stage has closed and its database collection is deleted."
            : "The page link might be typed incorrectly, or has been taken down by the collection administrator."}
        </p>
        <button
          onClick={() => {
            window.history.pushState(null, "", "/");
            window.dispatchEvent(new Event("popstate"));
          }}
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-mono border border-white/10 uppercase transition-all"
        >
          Build a New Hub
        </button>
      </div>
    );
  }

  if (!collection) return null;

  // PASSWORD PROMPT VIEW GATES
  if (collection.isPasswordProtected && !collection.links) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-6 sm:p-8 border border-purple-glow/20 text-center"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-purple-glow/10 border border-purple-glow/30 text-purple-glow flex items-center justify-center mb-6">
            <Lock className="h-6 w-6" />
          </div>

          <h2 className="font-display text-2xl tracking-wider text-white uppercase mb-1">
            PROTECTED STAGE
          </h2>
          <p className="text-[11px] text-zinc-400 font-sans mb-6 font-light">
            This collection is private. Enter the passcode designated by <b>{collection.authorName || "the author"}</b> to retrieve shared links.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-zinc-500">
                <Key className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Passcode Key..."
                className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-purple-glow"
                required
              />
            </div>

            {passwordError && (
              <p className="text-[10px] text-red-400 font-semibold font-mono text-left">{passwordError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-glow to-blue-accent font-display text-sm tracking-wider uppercase text-white shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              UNLOCK CHANNEL
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 relative">
      
      {/* GLOW DECORATIONS */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-glow/10 rounded-full filter blur-[120px] pointer-events-none -z-10" />

      {/* FLOATING LIGHT RIPPLE FOR STREAMING EXPERIENCE */}
      <div className="text-center mb-10">
        
        {/* METADATA SUMMARY */}
        <h1 className="font-display text-5xl sm:text-7xl tracking-[2px] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-400 uppercase leading-none mb-6">
          {collection.title}
        </h1>

        {/* VIEW COUNTER & ACTION BARS */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-zinc-500 uppercase">
          
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/[0.02] rounded-md border border-white/5">
            <Eye className="h-3.5 w-3.5 text-zinc-400" />
            <span>{collection.views} total views</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/[0.02] rounded-md border border-white/5">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            <span>{new Date(collection.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>

        </div>

      </div>

      {/* PLATFORM GLASS LINK MATRIX */}
      <div className="space-y-4 mb-10">
        {collection.links && collection.links.map((lnk, index) => {
          const platform = detectPlatform(lnk.url);
          const PlatformIcon = platform.icon;

          return (
            <a
              key={lnk.id}
              href={lnk.url}
              target="_blank"
              onClick={() => handleLinkClick(lnk.id)}
              rel="noopener noreferrer"
              className={`block glass-panel rounded-xl p-4 sm:p-5 relative overflow-hidden group border border-white/5 transition-all duration-300 hover:border-purple-glow/30 hover:scale-[1.01] hover:bg-white/[0.05] ${platform.glowClass}`}
            >
              {/* Highlight background shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />

              <div className="flex items-center justify-between">
                
                <div className="flex items-center space-x-4">
                  {/* Styled Box For Logo */}
                  <div className={`p-3 rounded-lg bg-white/[0.03] border border-white/5 transition-all text-xl ${platform.colorClass} group-hover:scale-110`}>
                    <PlatformIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <span className="block text-[8px] font-semibold uppercase tracking-widest text-zinc-500 font-mono mb-0.5">
                      {platform.name}
                    </span>
                    <h2 className="font-sans font-medium text-white group-hover:text-purple-glow text-sm sm:text-base leading-tight transition-colors">
                      {lnk.title}
                    </h2>
                  </div>

                </div>

                {/* Animated Right Chevron Indicator */}
                <div className="flex items-center space-x-2 text-zinc-500 group-hover:text-purple-glow group-hover:translate-x-1 transition-all">
                  <span className="hidden sm:inline text-[9px] font-mono uppercase tracking-widest leading-none font-bold">
                    Open
                  </span>
                  <ChevronRight className="h-4.5 w-4.5" />
                </div>

              </div>

            </a>
          );
        })}
      </div>

      {/* PUBLIC FOOTER */}
      <div className="flex flex-col items-center justify-center space-y-4 pt-8 border-t border-white/5">
        
        <div className="flex gap-4">
          <button
            onClick={handleCopyPageLink}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono border border-white/5 uppercase text-zinc-400 hover:text-white flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                <span className="text-success">PAGE COPIED</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>SHARE HUB</span>
              </>
            )}
          </button>
        </div>

        <div
          onClick={() => {
            window.history.pushState(null, "", "/");
            window.dispatchEvent(new Event("popstate"));
          }}
          className="cursor-pointer flex items-center space-x-1.5 text-[10px] text-zinc-600 hover:text-purple-glow font-mono uppercase tracking-wider transition-all"
        >
          <span>Powered by Cinemood URLs</span>
          <Sparkles className="h-3 w-3" />
        </div>

      </div>

    </div>
  );
}
