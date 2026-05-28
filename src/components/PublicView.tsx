import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getCanonicalUrl } from "../utils";
import { localStorageDb } from "../utils/localStorageDb";
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

  // Monetag dynamic ad and download management states
  const [unlockingLink, setUnlockingLink] = useState<{ id: string; title: string; url: string } | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showBottomAd, setShowBottomAd] = useState(true);

  // Private navigation helper to static pages for beautiful layout
  const navigate = (pathStr: string) => {
    window.history.pushState(null, "", pathStr);
    window.dispatchEvent(new Event("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Load public hub on mount or slug parameter change
  useEffect(() => {
    fetchCollection();
  }, [slug]);

  // SEO & Schema enhancement dynamically based on current page metadata
  useEffect(() => {
    if (collection) {
      // Dynamic Document Title
      document.title = `${collection.title} - Shared Link Hub | Cinemood URLs`;
      
      // Dynamic Meta Description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', `${collection.title} is a curated cinematic multi-link staging hub built securely on Cinemood URLs.`);

      // Dynamic Canonical link representation
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', getCanonicalUrl(slug));

      // Structured Data Schema markup
      let schemaScript = document.getElementById("json-ld-schema") as HTMLScriptElement;
      if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.id = "json-ld-schema";
        schemaScript.type = "application/ld+json";
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": collection.title,
        "url": getCanonicalUrl(slug),
        "description": `Interactive link collection crafted securely using Cinemood URLs.`,
        "provider": {
          "@type": "Organization",
          "name": "Cinemood URLs",
          "url": "https://cinemoodurls.site"
        }
      });
    }
  }, [collection, slug]);

  // Monetag Scripts and Soft Interaction Popunder Loaders Hook
  useEffect(() => {
    if (!collection) return;

    // 1. In-page push ad loading script (Sticky Push Overlay tags)
    const pushScript = document.createElement("script");
    pushScript.dataset.zone = "11068563";
    pushScript.src = "https://nap5k.com/tag.min.js";
    pushScript.async = true;
    
    const existingPush = document.querySelector('script[data-zone="11068563"]');
    if (!existingPush) {
      document.body.appendChild(pushScript);
    }

    // 2. Soft Popunder loader on user interaction (Only Once per session)
    const handlePopunderInteraction = () => {
      const isPopLoaded = sessionStorage.getItem("cinemood_pop_loaded");
      if (!isPopLoaded) {
        const popScript = document.createElement("script");
        popScript.dataset.zone = "11068559";
        popScript.src = "https://al5sm.com/tag.min.js";
        popScript.async = true;
        
        const existingPop = document.querySelector('script[data-zone="11068559"]');
        if (!existingPop) {
          document.body.appendChild(popScript);
        }
        sessionStorage.setItem("cinemood_pop_loaded", "true");
      }
      
      // Remove triggers immediately to avoid overhead
      document.removeEventListener("click", handlePopunderInteraction);
      document.removeEventListener("touchstart", handlePopunderInteraction);
    };

    document.addEventListener("click", handlePopunderInteraction);
    document.addEventListener("touchstart", handlePopunderInteraction);

    return () => {
      if (document.body.contains(pushScript)) {
        try {
          document.body.removeChild(pushScript);
        } catch (_) {}
      }
      document.removeEventListener("click", handlePopunderInteraction);
      document.removeEventListener("touchstart", handlePopunderInteraction);
    };
  }, [collection]);

  // Countdown timer clock interval for Smart Unlock system
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (unlockingLink && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (unlockingLink && countdown === 0) {
      setIsUnlocked(true);
    }
    return () => clearTimeout(timer);
  }, [unlockingLink, countdown]);

  const fetchCollection = () => {
    try {
      setLoading(true);
      setError("");

      const col = localStorageDb.get(slug);
      if (!col) {
        throw new Error("Collection not found.");
      }

      // Increment view metrics locally
      localStorageDb.incrementViews(slug);

      if (col.isPasswordProtected) {
        // Exclude links list from state until correct passcode is verified
        const { links, ...partialCol } = col;
        setCollection(partialCol as any);
      } else {
        setCollection(col);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load Cinemood Collection.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    try {
      const col = localStorageDb.get(slug);
      if (!col) {
        throw new Error("Collection not found.");
      }

      if (col.password === passwordInput) {
        // Successfully unlocked, store full collection
        setCollection(col);
      } else {
        throw new Error("Incorrect password.");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Access Denied.");
    }
  };

  const handleLinkClick = (lnk: { id: string; title: string; url: string }) => {
    try {
      // Increment click count locally
      localStorageDb.incrementClickCount(slug, lnk.id);
    } catch (e) {
      console.error("Failed to track click:", e);
    }

    // Open Smart Link immediately in new tab
    try {
      window.open("https://omg10.com/4/11068547", "_blank");
    } catch (err) {
      console.error("Popup block bypass active:", err);
    }

    // Open original page countdown overlay locks
    setUnlockingLink(lnk);
    setCountdown(3);
    setIsUnlocked(false);
  };

  const handleCopyPageLink = async () => {
    try {
      const canonicalUrl = getCanonicalUrl(slug);
      await navigator.clipboard.writeText(canonicalUrl);
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

  const relatedCollections = localStorageDb.getAll()
    .filter(col => col.id !== slug && col.isPublic)
    .slice(0, 3);

  return (
    <div className="w-full min-h-screen flex flex-col justify-between selection:bg-purple-glow/30 selection:text-white pb-0 relative">
      
      {/* PROFESSIONAL STICKY HEADER */}
      <header className="sticky top-0 z-50 w-full bg-[#080808]/85 backdrop-blur-md border-b border-white/5 py-3.5">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <div 
            onClick={() => navigate("/")}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-glow to-blue-accent p-[1px]">
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#080808]">
                <Sparkles className="h-3.5 w-3.5 text-purple-glow animate-pulse" />
              </div>
            </div>
            <span className="font-display text-sm tracking-[1px] text-white">
              CINEMOOD <span className="text-purple-glow">URLS</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="https://t.me/cinemood_channel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-accent/15 hover:bg-blue-accent/25 border border-blue-accent/20 rounded-lg text-white transition-all text-[9.5px] font-mono uppercase"
            >
              <span>Telegram</span>
              <ExternalLink className="h-2.5 w-2.5 text-purple-glow" />
            </a>
          </div>
        </div>
      </header>

      {/* RENDER THE CURRENT PUBLIC PAGE BODY ACCORDING TO USER REQ */}
      <div className="w-full max-w-2xl mx-auto px-4 py-12 relative flex-grow">
        
        {/* GLOW DECORATIONS */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-glow/10 rounded-full filter blur-[120px] pointer-events-none -z-10" />

        {/* FLOATING LIGHT RIPPLE FOR STREAMING EXPERIENCE */}
        <div className="text-center mb-10">
          
          {/* METADATA SUMMARY */}
          <h1 className="font-display text-4xl sm:text-6xl tracking-[2px] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-400 uppercase leading-none mb-6">
            {collection.title}
          </h1>

          {/* VIEW COUNTER & ACTION BARS */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-zinc-500 uppercase">
            
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/[0.02] rounded-md border border-white/5">
              <Eye className="h-3.5 w-3.5 text-zinc-400" />
              <span>{collection.views || 0} total views</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/[0.02] rounded-md border border-white/5">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>{new Date(collection.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>

          </div>

        </div>

        {/* PREMIUM CINEMA MOVIE POSTER & DESCRIPTION BAR */}
        <div className="glass-panel overflow-hidden border border-white/5 rounded-2xl mb-8 flex flex-col md:flex-row gap-6 p-5 sm:p-6 bg-gradient-to-br from-zinc-950 via-[#0a0614] to-black relative">
          
          {/* Glowing particle effect behind poster */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-purple-glow/15 rounded-full filter blur-[60px] pointer-events-none" />

          {/* Styled CSS Poster Thumbnail */}
          <div className="w-full md:w-44 md:h-60 shrink-0 aspect-[2/3] rounded-xl bg-gradient-to-br from-[#1c1236]/85 via-black to-zinc-950 border border-purple-glow/30 flex flex-col justify-between p-4 shadow-xl relative overflow-hidden group">
            
            {/* Gloss shine reflection line */}
            <div className="absolute inset-x-0 top-0 h-[100%] bg-gradient-to-b from-white/[0.04] to-transparent transform -skew-y-12 translate-y-[-50%] group-hover:translate-y-[-40%] transition-transform duration-700" />
            
            {/* Clapperboard / Cinema backdrop graphic */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] text-white">
              <Sparkles className="w-24 h-24 stroke-[1px]" />
            </div>

            {/* Poster Header */}
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[7px] font-mono uppercase tracking-widest text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded border border-[#a855f7]/20 font-bold">
                Cinemood
              </span>
              <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-0.5">
                ✦ 4K UHD
              </span>
            </div>

            {/* Poster Middle Title */}
            <div className="text-center my-auto px-2 relative z-10 py-4">
              <h3 className="font-display text-sm tracking-[0.5px] uppercase text-white/95 leading-tight font-extrabold max-h-24 overflow-hidden text-ellipsis line-clamp-3">
                {collection.title}
              </h3>
              <p className="text-[6px] font-mono text-zinc-500 uppercase tracking-wider mt-1.5">
                Curated Showcase
              </p>
            </div>

            {/* Poster Bottom Footer */}
            <div className="flex justify-between items-center relative z-10 border-t border-white/5 pt-2">
              <span className="text-[6px] font-mono text-purple-glow uppercase tracking-wider font-extrabold">
                Active Staging
              </span>
              <span className="text-[6px] font-mono text-zinc-400 capitalize">
                By {collection.authorName || "Creator"}
              </span>
            </div>

          </div>

          {/* Description & Metadata Panel */}
          <div className="flex flex-col justify-between flex-grow">
            <div>
              <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-glow/10 border border-purple-glow/20 rounded-full text-[8.5px] font-mono uppercase text-purple-glow mb-3 font-semibold">
                <span>Direct Links Overview</span>
              </div>
              <h2 className="font-display text-lg tracking-wider uppercase text-white mb-2.5">
                The Curated Stage
              </h2>
              <p className="font-sans text-xs text-zinc-400 leading-relaxed font-light font-sans max-w-md">
                {collection.description || "Unlock high-fidelity cinema links, trailer databases, movie databases, soundtracks, and interactive streaming resources compiled proudly on Cinemood URLs."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 sm:mt-6 pt-4 border-t border-white/[0.03] text-[9.5px] font-mono text-zinc-500 uppercase">
              <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg">
                <span className="text-[7.5px] text-zinc-600 block mb-0.5">DIRECTOR</span>
                <span className="text-zinc-300 font-bold truncate max-w-xs block">{collection.authorName || "Cinemood Curator"}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg">
                <span className="text-[7.5px] text-zinc-600 block mb-0.5">RATING</span>
                <span className="text-purple-glow font-bold">★★★★★ (10/10)</span>
              </div>
            </div>

          </div>

        </div>

        {/* PLATFORM GLASS LINK MATRIX */}
        <div className="space-y-4 mb-10">
          <div className="p-3 text-[10px] text-zinc-500 font-mono uppercase tracking-[1px] text-center border border-white/5 bg-white/[0.01] rounded-xl mb-2">
            👇 Click any download link below to trigger smart gateway 👇
          </div>

          {collection.links && collection.links.map((lnk) => {
            const platform = detectPlatform(lnk.url);
            const PlatformIcon = platform.icon;

            return (
              <div
                key={lnk.id}
                onClick={() => handleLinkClick(lnk)}
                className={`block glass-panel rounded-xl p-4 sm:p-5 relative overflow-hidden group border border-white/5 transition-all duration-300 hover:border-purple-glow/30 hover:scale-[1.01] hover:bg-white/[0.05] cursor-pointer ${platform.glowClass}`}
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
                      <span className="block text-[8px] font-semibold uppercase tracking-widest text-[#a855f7] font-mono mb-0.5">
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
                      Open Secure Gate
                    </span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* RELATED INTERACTIVE CHANNELS (Trending Cinema Stages) */}
        {relatedCollections.length > 0 && (
          <div className="mt-12 pt-10 border-t border-white/5">
            <div className="flex items-center justify-between mb-5">
              <span className="font-display text-xs tracking-wider text-white uppercase flex items-center space-x-1.5 font-bold">
                <Sparkles className="h-3.5 w-3.5 text-purple-glow animate-pulse" />
                <span>Trending Cinematic Stages</span>
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                Explore More
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedCollections.map((rc) => (
                <div
                  key={rc.id}
                  onClick={() => navigate(`/${rc.id}`)}
                  className="glass-panel p-4 border border-white/5 rounded-xl hover:border-purple-glow/30 hover:scale-[1.01] transition-all cursor-pointer flex justify-between items-center group bg-gradient-to-br from-[#0c0c0c] to-black"
                >
                  <div className="truncate pr-3">
                    <h4 className="font-display text-[11px] uppercase tracking-wider text-white group-hover:text-purple-glow truncate">
                      {rc.title}
                    </h4>
                    <p className="text-[8px] font-mono text-zinc-500 truncate mt-0.5">
                      By {rc.authorName || "Creator"} &bull; {rc.views || 0} views
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-purple-glow group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PUBLIC FOOTER */}
        <div className="flex flex-col items-center justify-center space-y-4 pt-8 border-t border-white/5 mt-12">
          
          <div className="flex gap-4">
            <button
              onClick={handleCopyPageLink}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono border border-white/5 uppercase text-zinc-400 hover:text-white flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span className="text-success font-bold">PAGE COPIED</span>
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
            className="cursor-pointer flex items-center space-x-1.5 text-[10px] text-zinc-600 hover:text-purple-glow font-mono uppercase tracking-wider transition-all font-semibold"
          >
            <span>Powered by Cinemood URLs</span>
            <Sparkles className="h-3 w-3" />
          </div>

        </div>

      </div>

      {/* ULTRA SLICK GLASS SMART UNLOCK MODAL */}
      <AnimatePresence>
        {unlockingLink && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass-panel p-6 sm:p-8 rounded-2xl border border-purple-glow/30 text-center relative overflow-hidden"
            >
              {/* Spinning background neon radial */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-glow/20 rounded-full filter blur-[50px] -z-10 animate-pulse" />

              <div className="mx-auto w-16 h-16 rounded-full bg-[#a855f7]/10 border border-[#a855f7]/20 text-[#a855f7] flex items-center justify-center mb-6 relative">
                {countdown > 0 ? (
                  <div className="absolute inset-0 border-2 border-[#a855f7]/20 border-t-[#a855f7] rounded-full animate-spin" />
                ) : (
                  <div className="absolute inset-0 border-2 border-emerald-500 rounded-full animate-pulse" />
                )}
                {countdown > 0 ? (
                  <Clock className="h-6 w-6 text-purple-glow animate-pulse" />
                ) : (
                  <Unlock className="h-6 w-6 text-emerald-500 animate-bounce" />
                )}
              </div>

              <span className="text-[8px] font-mono uppercase tracking-widest text-[#a855f7] font-bold block mb-1">
                SECURE ACCESS LINK STAGE
              </span>
              <h3 className="font-display text-lg tracking-[0.5px] uppercase text-white mb-2 max-h-16 overflow-hidden text-ellipsis line-clamp-2 leading-snug font-extrabold">
                {unlockingLink.title}
              </h3>
              <p className="text-[10px] font-sans text-zinc-400 max-w-xs mx-auto mb-6 leading-relaxed font-light">
                {countdown > 0 
                  ? "Transmitting secure link files through ad-supported channels..." 
                  : "Link decrypted. Proceed to final download below."}
              </p>

              {countdown > 0 ? (
                <div className="py-4 bg-[#111111]/90 rounded-xl border border-white/5 space-y-2 mb-6">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Unlocking Stage In</span>
                  <span className="block text-4xl font-display text-white tracking-[2px] font-extrabold pr-0.5">{countdown}S</span>
                </div>
              ) : (
                <a
                  href={unlockingLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setUnlockingLink(null)}
                  className="block w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-500 hover:to-emerald-600 text-white font-display text-xs font-black tracking-widest uppercase rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all cursor-pointer mb-6"
                >
                  🚀 GET SECURE PREMIUM LINK 🚀
                </a>
              )}

              <button
                onClick={() => setUnlockingLink(null)}
                className="text-[9px] font-mono text-zinc-600 hover:text-zinc-400 uppercase tracking-wider underline transition-colors cursor-pointer"
              >
                Abandon Signal Transmission
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE STICKY BOTTOM AD BANNER */}
      {showBottomAd && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:max-w-md md:mx-auto bg-black/90 backdrop-blur-md border border-purple-glow/30 p-3.5 rounded-xl shadow-[0_10px_30px_rgba(139,92,246,0.15)] flex items-center justify-between"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-1 px-2 bg-gradient-to-r from-purple-glow to-blue-accent rounded-md text-[8px] font-mono text-white animate-pulse">
              PUSH AD
            </div>
            <div className="text-left">
              <p className="text-[10px] font-mono text-zinc-300 font-bold tracking-tight uppercase">⭐ SPONSORED SELECTION ⭐</p>
              <p className="text-[8px] font-sans text-zinc-400 font-light mt-0.5 leading-none">Loads secure high-speed servers. Click [x] to close.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowBottomAd(false)}
            className="p-1.5 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}

      {/* PROFESSIONAL BOTTOM FOOTER */}
      <footer className="w-full mt-16 border-t border-white/5 bg-black/45 backdrop-blur-md py-10 relative z-20">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-[9px] uppercase text-zinc-400">
            <a href="/about" onClick={(e) => { e.preventDefault(); navigate("/about"); }} className="hover:text-purple-glow transition-colors font-bold">About Station</a>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate("/privacy"); }} className="hover:text-purple-glow transition-colors font-bold">Privacy Shield</a>
            <a href="/terms" onClick={(e) => { e.preventDefault(); navigate("/terms"); }} className="hover:text-purple-glow transition-colors font-bold">Rules of Use</a>
            <a href="/contact" onClick={(e) => { e.preventDefault(); navigate("/contact"); }} className="hover:text-purple-glow transition-colors font-bold">Sender Support</a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/[0.03] gap-4">
            <div className="text-left font-mono">
              <p className="text-[9px] text-zinc-500 uppercase">
                &copy; 2026 Cinemood URLs. All rights reserved.
              </p>
              <p className="text-[8px] text-zinc-600 uppercase mt-0.5 animate-pulse">
                Made with ❤️ in Bangladesh
              </p>
            </div>

            <a
              href="https://t.me/cinemood_channel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-glow/10 border border-purple-glow/20 hover:bg-purple-glow/20 text-[9px] font-mono text-white rounded-lg transition-all"
            >
              <span>Join @cinemood_channel</span>
              <ExternalLink className="h-2.5 w-2.5 text-purple-glow" />
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}
