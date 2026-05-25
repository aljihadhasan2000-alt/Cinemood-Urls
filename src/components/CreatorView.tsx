import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Sparkles,
  Lock,
  Globe,
  TrendingUp,
  Eye,
  Link2,
  LockKeyhole,
  Check,
  ChevronRight,
  Send,
  HardDrive,
  QrCode
} from "lucide-react";
import { detectPlatform } from "./LinkDetector";
import { TrendingPage } from "../types";

interface LinkInput {
  id: string;
  title: string;
  url: string;
}

interface CreatorViewProps {
  onGenerated: (slug: string) => void;
}

export function CreatorView({ onGenerated }: CreatorViewProps) {
  // Multiple URL inputs state
  const [links, setLinks] = useState<LinkInput[]>([
    { id: "1", title: "", url: "" }
  ]);

  // Streamlined Title (Remove bio / authorName as requested to focus layout)
  const [title, setTitle] = useState("");

  // Simplified and polished options (Keep custom slug, password protection, and QR)
  const [customSlug, setCustomSlug] = useState("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [enableQr, setEnableQr] = useState(true);

  // Layout processing states
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Trending links list
  const [trending, setTrending] = useState<TrendingPage[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setIsTrendingLoading(true);
      const res = await fetch("/api/trending");
      const data = await res.json();
      setTrending(data);
    } catch (e) {
      console.error("Could not fetch trending lists:", e);
    } finally {
      setIsTrendingLoading(false);
    }
  };

  const handleAddRow = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    setLinks([...links, { id: newId, title: "", url: "" }]);
  };

  const handleRemoveRow = (id: string) => {
    if (links.length === 1) {
      setErrorMessage("You must keep at least one link.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setLinks(links.filter((lnk) => lnk.id !== id));
  };

  const handleLinkChange = (id: string, field: "title" | "url", value: string) => {
    setLinks(
      links.map((lnk) => {
        if (lnk.id === id) {
          const updated = { ...lnk, [field]: value };
          
          // Smart feature: Auto suggest platform name and suggest icon
          if (field === "url" && value) {
            const platform = detectPlatform(value);
            // Suggest name automatically if user hasn't written any custom title yet
            if (platform.name !== "Web Link" && !lnk.title) {
              updated.title = platform.name;
            }
          }
          return updated;
        }
        return lnk;
      })
    );
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage("Please enter a collection title.");
      return;
    }

    const validLinks = links.filter((l) => l.url.trim().length > 0);
    if (validLinks.length === 0) {
      setErrorMessage("Please add at least one link URL.");
      return;
    }

    // Ensure all links have titles (fallback to platform suggestions)
    const linksWithTitles = validLinks.map((lnk) => {
      let t = lnk.title.trim();
      if (!t) {
        const platform = detectPlatform(lnk.url);
        t = platform.name === "Web Link" ? "Visit Website" : platform.name;
      }
      return { ...lnk, title: t };
    });

    try {
      setIsGenerating(true);

      const payload = {
        title: title.trim(),
        description: "", // Removed bio
        authorName: "Cinemood Creator", // Streamlined metadata
        links: linksWithTitles,
        isPasswordProtected,
        password: isPasswordProtected ? password : "",
        customSlug: customSlug.trim() || undefined,
        expiryTime: "none", // Removed toggle
        isPublic: true, // Default public for trending listing
        enableQr,
        enableAnalytics: false // Removed complex stats pages
      };

      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate collection.");
      }

      setSuccessMessage("Cinemood URLs collection generated successfully!");
      setTimeout(() => {
        const targetSlug = data.slug || (data.collection && data.collection.id);
        if (targetSlug) {
          onGenerated(targetSlug);
        } else {
          throw new Error("Invalid API response format");
        }
      }, 800);

    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 relative">
      
      {/* GLOW ATMOSPHERE BACKGROUNDS */}
      <div className="absolute -top-32 -left-20 w-[600px] h-[600px] bg-radial from-purple-glow/15 to-transparent rounded-full pointer-events-none -z-10" />
      <div className="absolute -bottom-32 -right-20 w-[600px] h-[600px] bg-radial from-blue-accent/15 to-transparent rounded-full pointer-events-none -z-10" />

      {/* HOMEPAGE METRICS / HERO CONTAINER FROM DESIGN HTML */}
      <main className="flex flex-col lg:flex-row gap-12 items-center py-8 lg:py-16">
        
        {/* LEFT COMPONENT: INTUITIVE HERO TEXT & CTA IN BOLD DISPLAY TYPE */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center text-left">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-5xl sm:text-7xl leading-none mb-6 text-white uppercase tracking-tight">
              Save & Share All Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-glow to-blue-accent drop-shadow-[0_0_20px_rgba(139,92,246,0.25)]">
                Links
              </span>{" "}
              In One Place
            </h1>
            
            <p className="font-sans text-zinc-400 text-base sm:text-lg font-light leading-relaxed mb-8 max-w-md">
              Create beautiful cinematic link collections instantly for your social media bios, channels, and personal branding with Netflix + Linktree aesthetics.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#link-generator-form"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-glow to-blue-accent font-bold text-xs tracking-wider shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-105 transition-all uppercase font-display cursor-pointer"
              >
                Create My URL
              </a>
              <button
                onClick={() => {
                  document.getElementById("trending-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-xs tracking-wider hover:bg-white/10 transition-all uppercase font-display"
              >
                Explore Trending
              </button>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COMPONENT: PREMIUM GLASS DESIGN INTERACTIVE PANEL */}
        <div id="link-generator-form" className="w-full lg:w-1/2 scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-panel p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative border border-white/10"
          >
            {/* Header detail */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-glow animate-pulse" />
                <h3 className="font-display text-xl tracking-wider text-purple-glow uppercase">Url Creator</h3>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 bg-white/5 px-2.5 py-1 rounded font-mono">
                Live Engine
              </span>
            </div>

            {/* Error Message Box */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-danger/10 border border-danger/20 text-danger text-xs px-4 py-2.5 rounded-lg font-sans"
                >
                  {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form submit handler */}
            <form onSubmit={handleGenerate} className="flex flex-col gap-6">
              
              {/* Main Slogan / Hub Title */}
              <div className="group">
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2 block font-mono font-medium">
                  Collection Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Social Media Hub"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-glow rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition-colors font-sans"
                />
              </div>

              {/* Multiple URL Rows Layout */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 mb-3 block font-mono font-medium">
                  Links Configuration ({links.length})
                </label>
                
                <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {links.map((lnk, idx) => {
                      const platform = detectPlatform(lnk.url);
                      const PlatformIcon = platform.icon;
                      
                      return (
                        <motion.div
                          key={lnk.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 relative group/row hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {/* Icon display + number */}
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded text-xs font-mono text-zinc-400">
                              <span>#{idx + 1}</span>
                              <PlatformIcon className={`h-3.5 w-3.5 ${platform.colorClass}`} />
                            </div>

                            {/* Optional suggested tag badge */}
                            {lnk.url && platform.name !== "Web Link" && (
                              <span className="text-[9px] uppercase tracking-wider text-purple-glow font-mono font-bold bg-purple-glow/10 border border-purple-glow/20 px-2 py-0.5 rounded ml-auto">
                                Detected: {platform.name}
                              </span>
                            )}

                            {/* Trash action */}
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(lnk.id)}
                              className="ml-auto p-1.5 text-zinc-500 hover:text-danger/90 rounded transition-colors"
                              title="Delete URL row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Dual Input grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Title (e.g. My Website)"
                              value={lnk.title}
                              onChange={(e) => handleLinkChange(lnk.id, "title", e.target.value)}
                              className="bg-black/30 border border-white/5 focus:border-purple-glow rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                            />
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Destination URL"
                                value={lnk.url}
                                onChange={(e) => handleLinkChange(lnk.id, "url", e.target.value)}
                                className="w-full bg-black/30 border border-white/5 focus:border-purple-glow rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                              />
                            </div>
                          </div>

                          {/* Auto platform fill suggestion badge helper if platform detected but custom title different */}
                          {lnk.url && platform.name !== "Web Link" && lnk.title !== platform.name && (
                            <button
                              type="button"
                              onClick={() => handleLinkChange(lnk.id, "title", platform.name)}
                              className="text-[10px] text-zinc-500 hover:text-white transition-colors text-left font-mono mt-1 underline decoration-dotted"
                            >
                              Apply suggested name: "{platform.name}"
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Add More Button */}
              <div className="flex justify-center -my-2">
                <motion.button
                  type="button"
                  onClick={handleAddRow}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg hover:rotate-90 transition-transform cursor-pointer"
                  title="Add more links"
                >
                  <Plus className="h-5 w-5 text-white" />
                </motion.button>
              </div>

              {/* Refined Advanced Settings Block (Password, Custom Slug, QR Poster) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                
                {/* Custom Slug input option */}
                <div className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">Custom Slug</span>
                  <div className="relative flex items-center">
                    <span className="text-[10px] font-mono text-zinc-600 mr-1.5">/p/</span>
                    <input
                      type="text"
                      placeholder="custom-path"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      className="w-full bg-transparent border-0 text-xs text-white focus:outline-none placeholder-zinc-600 font-mono"
                    />
                  </div>
                </div>

                {/* QR Code toggle switch option */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">QR Card Poster</span>
                  <div 
                    onClick={() => setEnableQr(!enableQr)}
                    className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${enableQr ? 'bg-purple-glow' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${enableQr ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Password Protection toggle switch option */}
                <div className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">Password Protection</span>
                    <div 
                      onClick={() => setIsPasswordProtected(!isPasswordProtected)}
                      className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${isPasswordProtected ? 'bg-purple-glow' : 'bg-zinc-800'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isPasswordProtected ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isPasswordProtected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-2.5"
                      >
                        <input
                          type="password"
                          required={isPasswordProtected}
                          placeholder="Type access passcode..."
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 focus:border-purple-glow rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* GENERATE SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 font-display text-xl tracking-wider uppercase text-white shadow-[0_0_40px_rgba(139,92,246,0.2)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    <span>Generating Cinemood URL...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-1" />
                    <span>Generate Cinemood URL</span>
                  </>
                )}
              </button>

            </form>

          </motion.div>
        </div>

      </main>

      {/* TRENDING CAROUSEL / BENTO GRID SECTION */}
      <section id="trending-section" className="mt-24 mb-12 scroll-mt-20">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 pb-4 border-b border-white/5 gap-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-glow" />
            <h2 className="font-display text-3xl tracking-wider text-white uppercase">
              Trending CINEMOOD URLS
            </h2>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
            Realtime Popular Collections
          </span>
        </div>

        {isTrendingLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((val) => (
              <div key={val} className="glass-panel h-40 rounded-xl animate-pulse p-4 flex flex-col justify-between">
                <div className="w-12 h-4 bg-white/5 rounded" />
                <div className="w-full h-6 bg-white/5 rounded" />
                <div className="w-1/2 h-3 bg-white/5 rounded" />
                <div className="w-full h-8 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : trending.length === 0 ? (
          <div className="glass-panel rounded-xl py-12 px-6 text-center text-zinc-500 text-xs font-sans">
            No public collections generated yet. Be the first to publish trending URLs!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trending.map((col, idx) => (
              <motion.div
                key={col.id}
                whileHover={{ scale: 1.02 }}
                className="glass-panel rounded-xl p-5 hover:border-purple-glow/40 transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Ranking tag */}
                <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-purple-glow/20 to-transparent border-bl border-white/5 text-[9px] text-purple-glow font-mono font-bold uppercase">
                  Rank #{idx + 1}
                </div>

                <div>
                  <h3 className="font-display text-2xl tracking-wider text-white group-hover:text-purple-glow transition-colors mb-2 mt-4">
                    {col.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                  <div className="flex items-center space-x-3 text-[10px] font-mono text-zinc-500">
                    <span className="flex items-center space-x-1">
                      <Link2 className="h-3.5 w-3.5" />
                      <span>{col.linksCount} links</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{col.views} views</span>
                    </span>
                  </div>

                  <a
                    href={`/p/${col.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState(null, "", `/p/${col.id}`);
                      window.dispatchEvent(new Event("popstate"));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-3 py-1.5 rounded bg-purple-glow/10 border border-purple-glow/20 hover:bg-purple-glow/20 text-[10px] font-bold text-white uppercase flex items-center space-x-1 transition-all"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER ACCORDING TO DESIGN HTML */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500 border-t border-white/5 pt-6 gap-4">
        <div>&copy; 2026 Cinemood Labs</div>
        <div className="flex gap-8">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 
          <span>14,204 Active Nodes</span>
        </div>
      </footer>

    </div>
  );
}
