import { useState, useEffect, FormEvent } from "react";
import { motion } from "motion/react";
import { getCanonicalUrl } from "../utils";
import { localStorageDb } from "../utils/localStorageDb";
import {
  Lock,
  Key,
  Globe,
  Sparkles,
  Eye,
  Calendar,
  ExternalLink,
  Share2,
  AlertCircle,
  Check,
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
  const [relatedCollections, setRelatedCollections] = useState<Collection[]>([]);

  // Private navigation helper to static pages for beautiful layout
  const navigate = (pathStr: string) => {
    window.history.pushState(null, "", pathStr);
    window.dispatchEvent(new Event("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Load public hub on mount or slug parameter change with instant cached rendering
  useEffect(() => {
    let active = true;
    let hasLocalCache = false;

    async function loadInstantCache() {
      try {
        const cached = await localStorageDb.getLocalOnly(slug);
        if (cached && active) {
          hasLocalCache = true;
          if (cached.isPasswordProtected) {
            const { links, ...partialCol } = cached;
            setCollection(partialCol as any);
          } else {
            setCollection(cached);
          }
          // Display instantly
          setLoading(false);
        }
      } catch (err) {
        // Quiet
      }

      // Background reload / sync check from cloud registry
      if (active) {
        fetchCollection(!hasLocalCache);
      }
    }

    loadInstantCache();

    return () => {
      active = false;
    };
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

  const fetchCollection = async (showLoadingOverlay = true) => {
    try {
      if (showLoadingOverlay) {
        setLoading(true);
      }
      setError("");

      const col = await localStorageDb.get(slug);
      if (!col) {
        throw new Error("Collection not found.");
      }

      // Increment view metrics across cloud registry
      await localStorageDb.incrementViews(slug);

      if (col.isPasswordProtected) {
        // Exclude links list from state until correct passcode is verified
        const { links, ...partialCol } = col;
        setCollection(partialCol as any);
      } else {
        setCollection(col);
      }

      // Load related collections in background
      try {
        const allCols = await localStorageDb.getAll();
        setRelatedCollections(
          allCols.filter(c => c.id !== slug && c.isPublic).slice(0, 3)
        );
      } catch (err) {
        // Quiet
      }
    } catch (e: any) {
      // Only set error block if we don't have local cached representation as fallback
      if (showLoadingOverlay) {
        setError(e.message || "Failed to load Cinemood Collection.");
      }
    } finally {
      if (showLoadingOverlay) {
        setLoading(false);
      }
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    try {
      const col = await localStorageDb.get(slug);
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
      // Increment click count safely in background
      localStorageDb.incrementClickCount(slug, lnk.id).catch(() => {});
    } catch (e) {
      console.error("Failed to track click:", e);
    }

    // Softly handle user-friendly Popunder ONLY once per session after clicking card
    const hasPopunderTriggered = sessionStorage.getItem("cinemood_popunder_triggered") === "true";
    if (!hasPopunderTriggered) {
      sessionStorage.setItem("cinemood_popunder_triggered", "true");
      setTimeout(() => {
        try {
          const s = document.createElement("script");
          s.dataset.zone = "11068559";
          s.src = "https://al5sm.com/tag.min.js";
          const container = [document.documentElement, document.body].filter(Boolean).pop();
          if (container) {
            container.appendChild(s);
          }
        } catch (err) {
          console.error("Failed to softly load popunder:", err);
        }
      }, 700);
    }

    // Handle hidden Smart Link behavior exactly as requested:
    // User clicks episode card -> Smart link opens once in new tab -> Original page remains unchanged -> After short delay continue to real download link
    const hasTriggered = sessionStorage.getItem("cinemood_smartlink_triggered") === "true";
    
    if (!hasTriggered) {
      sessionStorage.setItem("cinemood_smartlink_triggered", "true");
      try {
        window.open("https://omg10.com/4/11068547", "_blank");
      } catch (err) {
        console.error("Popup block bypass active:", err);
      }
      
      // Delay navigation to redirect original tab/page after a short delay
      setTimeout(() => {
        window.location.href = lnk.url;
      }, 1200);
    } else {
      // If already triggered, immediately open/continue to real download link
      window.location.href = lnk.url;
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
    <div className="w-full min-h-screen flex flex-col justify-between selection:bg-purple-glow/30 selection:text-white pb-0 relative bg-black">
      
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
            <span className="font-display text-sm tracking-[1px] text-white uppercase font-black">
              CINEMOOD <span className="text-purple-glow">URLS</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="https://t.me/cinemood_channel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-accent/15 hover:bg-blue-accent/25 border border-blue-accent/20 rounded-lg text-white transition-all text-[9.5px] font-mono uppercase font-bold"
            >
              <span>TELEGRAM</span>
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
          <h1 className="font-display text-4xl sm:text-6xl tracking-[2px] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-400 uppercase leading-none mb-6 font-extrabold">
            {collection.title}
          </h1>

          {/* VIEW COUNTER & ACTION BARS */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-zinc-500 uppercase font-bold">
            
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

        {/* PLATFORM GLASS LINK MATRIX */}
        <div className="space-y-4 mb-10">
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
                    <div className={`p-2.5 rounded-full bg-white/[0.03] border border-white/5 transition-all text-xl ${platform.colorClass} group-hover:scale-110`}>
                      <PlatformIcon className="h-4.5 w-4.5" />
                    </div>

                    <div>
                      <span className="block text-[8.5px] font-semibold uppercase tracking-widest text-zinc-500 font-mono mb-0.5">
                        {platform.name}
                      </span>
                      <h2 className="font-sans font-medium text-white group-hover:text-purple-glow text-sm sm:text-base leading-tight transition-colors font-semibold">
                        {lnk.title}
                      </h2>
                    </div>

                  </div>

                  {/* Animated Right Chevron Indicator */}
                  <div className="flex items-center space-x-2 text-zinc-500 group-hover:text-purple-glow group-hover:translate-x-1 transition-all">
                    <ChevronRight className="h-4.5 w-4.5" />
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* CENTERED SHARE HUB CONTAINER */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleCopyPageLink}
            className="px-6 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-[10px] font-mono border border-white/5 uppercase text-zinc-400 hover:text-white flex items-center space-x-2 transition-all cursor-pointer font-bold"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-bold">PAGE COPIED</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>SHARE HUB</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* PROFESSIONAL BOTTOM FOOTER */}
      <footer className="w-full mt-16 border-t border-white/5 bg-[#050505]/45 backdrop-blur-md py-12 relative z-20">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-8">
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[9.5px] tracking-wider uppercase text-zinc-400">
            <a href="/about" onClick={(e) => { e.preventDefault(); navigate("/about"); }} className="hover:text-purple-glow transition-colors font-bold">About Station</a>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate("/privacy"); }} className="hover:text-purple-glow transition-colors font-bold">Privacy Shield</a>
            <a href="/terms" onClick={(e) => { e.preventDefault(); navigate("/terms"); }} className="hover:text-purple-glow transition-colors font-bold">Rules of Use</a>
            <a href="/contact" onClick={(e) => { e.preventDefault(); navigate("/contact"); }} className="hover:text-purple-glow transition-colors font-bold">Sender Support</a>
          </div>

          <div className="pt-6 border-t border-white/[0.03] space-y-4">
            <div className="space-y-1">
              <p className="text-[9.5px] font-mono tracking-widest text-[#555] uppercase font-bold">
                &copy; 2026 Cinemood URLs. All rights reserved.
              </p>
              <p className="text-[8.5px] font-mono tracking-wider text-[#444] uppercase font-semibold">
                Made with ❤️ in Bangladesh
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <a
                href="https://t.me/cinemood_channel"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-purple-glow/15 border border-purple-glow/20 hover:bg-purple-glow/25 text-[10px] font-mono text-white rounded-lg transition-all tracking-wider font-bold"
              >
                <span>Join @cinemood_channel</span>
                <ExternalLink className="h-3 w-3 text-purple-glow" />
              </a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
