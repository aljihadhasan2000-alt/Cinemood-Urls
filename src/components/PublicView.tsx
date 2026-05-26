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

  const handleLinkClick = (linkId: string) => {
    try {
      // Increment click count locally
      localStorageDb.incrementClickCount(slug, linkId);
    } catch (e) {
      console.error("Failed to track click:", e);
    }
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

  return (
    <div className="w-full min-h-screen flex flex-col justify-between selection:bg-purple-glow/30 selection:text-white pb-0">
      
      {/* PROFESSIONAL STICKY HEADER */}
      <header className="sticky top-0 z-50 w-full bg-black/45 backdrop-blur-md border-b border-white/5 py-3">
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
