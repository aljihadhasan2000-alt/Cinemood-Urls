import { useState, useEffect, FormEvent } from "react";
import { motion } from "motion/react";
import {
  LineChart,
  Eye,
  MousePointerClick,
  Percent,
  Link2,
  Calendar,
  Lock,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Hourglass,
  RefreshCw,
  User,
  Key
} from "lucide-react";
import { detectPlatform } from "./LinkDetector";
import { Collection } from "../types";
import { localStorageDb } from "../utils/localStorageDb";

interface AnalyticsViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function AnalyticsView({ slug, onNavigate }: AnalyticsViewProps) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, [slug]);

  const fetchAnalytics = () => {
    try {
      setLoading(true);
      setError("");

      const col = localStorageDb.get(slug);
      if (!col) {
        throw new Error("Collection not found.");
      }

      if (col.isPasswordProtected) {
        const { links, ...partialCol } = col;
        setCollection(partialCol as any);
      } else {
        setCollection(col);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load Analytics dashboard.");
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 text-purple-glow animate-spin" />
        <span className="font-display text-xl tracking-[1px] text-zinc-400">LOADING ANALYTICS FEED...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-950/40 border border-red-500/40 text-red-500 flex items-center justify-center mb-6">
          <LineChart className="h-6 w-6" />
        </div>
        <h2 className="font-display text-2xl tracking-wider text-white uppercase mb-2">ACCESS TERMINATED</h2>
        <p className="font-sans text-xs text-zinc-400 mb-6">{error}</p>
        <button
          onClick={() => onNavigate("/")}
          className="px-5 py-2 bg-white/5 border border-white/15 rounded-xl text-xs font-mono uppercase"
        >
          Back To Hub
        </button>
      </div>
    );
  }

  if (!collection) return null;

  // PASSWORD REQUIREMENT GATE (Even for statistics metrics)
  if (collection.isPasswordProtected && !collection.links) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-purple-glow/20 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-purple-glow/10 border border-purple-glow/30 text-purple-glow flex items-center justify-center mb-6">
            <Lock className="h-6 w-6" />
          </div>

          <h2 className="font-display text-2xl tracking-wider text-white uppercase mb-1">
            STATS ENCRYPTION LAYER
          </h2>
          <p className="text-[11px] text-zinc-400 font-sans mb-6 font-light">
            Statistics panel is securely locked. Enter your collection passcode to inspect real-time user flow dashboard.
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-glow to-blue-accent font-display text-sm tracking-wider uppercase text-white shadow-lg hover:opacity-90 transition-all cursor-pointer"
            >
              DECRYPT ANALYTICS
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Precompute aggregations
  const totalViews = collection.views || 0;
  const linksCount = collection.links ? collection.links.length : 0;
  
  let totalClicks = 0;
  if (collection.links) {
    collection.links.forEach((l) => {
      totalClicks += l.clickCount || 0;
    });
  }

  // Click-through rate calculation
  const clickThroughRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  // Find max click to scale SVG bars proportionally
  const maxClickCount = collection.links ? Math.max(...collection.links.map((l) => l.clickCount || 0), 1) : 1;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 relative">

      {/* BACK NAVIGATION HEADER */}
      <button
        onClick={() => onNavigate(`/success/${collection.id}`)}
        className="mb-6 inline-flex items-center space-x-2 text-zinc-500 hover:text-white transition-colors text-xs font-mono uppercase cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Success Plate</span>
      </button>

      {/* DASHBOARD TITLE PROFILE */}
      <div className="flex flex-col md:flex-row items-baseline justify-between mb-8 pb-4 border-b border-white/5 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-purple-glow font-mono font-bold uppercase tracking-widest mb-1.5">
            <Sparkles className="h-4 w-4 animate-spin-slow" />
            <span>METRIC DASHBOARD FEED</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-white uppercase">
            {collection.title} <span className="text-blue-accent">STATS</span>
          </h1>
          <p className="text-xs text-zinc-400 font-sans mt-1">
            Author: <b>{collection.authorName || "Owner"}</b> &bull; Live Shortslug: <span className="font-mono text-zinc-300">/{collection.id}</span>
          </p>
        </div>

        <div className="text-[10px] font-mono text-zinc-500 uppercase flex gap-4">
          <span className="flex items-center space-x-1.5 py-1.5 px-3 bg-white/[0.02] border border-white/5 rounded-lg">
            <Calendar className="h-3.5 w-3.5" />
            <span>Built: {new Date(collection.createdAt).toLocaleDateString()}</span>
          </span>
          {collection.expiresAt && (
            <span className="flex items-center space-x-1.5 py-1.5 px-3 bg-red-950/20 border border-red-500/10 text-red-400 rounded-lg">
              <Hourglass className="h-3.5 w-3.5" />
              <span>Expires</span>
            </span>
          )}
        </div>
      </div>

      {/* SUMMARY KPI CARDS BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
        
        {/* KPI 1: Views */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800">
            <Eye className="h-10 w-10" />
          </div>
          <span className="block text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-semibold mb-2">
            Total Page Views
          </span>
          <span className="block font-display text-4xl sm:text-5xl text-white tracking-wide">
            {totalViews}
          </span>
          <span className="block text-[8px] font-mono text-zinc-500 mt-2 uppercase">
            Net visitor instances
          </span>
        </div>

        {/* KPI 2: Total Links */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800">
            <Link2 className="h-10 w-10" />
          </div>
          <span className="block text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-semibold mb-2">
            Active Outlinks
          </span>
          <span className="block font-display text-4xl sm:text-5xl text-white tracking-wide">
            {linksCount}
          </span>
          <span className="block text-[8px] font-mono text-zinc-500 mt-2 uppercase">
            Curated redirect rows
          </span>
        </div>

        {/* KPI 3: Clicks */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800">
            <MousePointerClick className="h-10 w-10" />
          </div>
          <span className="block text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-semibold mb-2">
            Net Outclicks
          </span>
          <span className="block font-display text-4xl sm:text-5xl text-white tracking-wide">
            {totalClicks}
          </span>
          <span className="block text-[8px] font-mono text-zinc-500 mt-2 uppercase">
            Aggregate link selections
          </span>
        </div>

        {/* KPI 4: CTR */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group border border-purple-glow/15">
          <div className="absolute top-0 right-0 p-3 text-purple-glow/10">
            <Percent className="h-10 w-10" />
          </div>
          <span className="block text-[10px] font-mono tracking-widest text-purple-glow uppercase font-semibold mb-2">
            Click-Through Rate
          </span>
          <span className="block font-display text-4xl sm:text-5xl text-purple-glow tracking-wide">
            {clickThroughRate}%
          </span>
          <span className="block text-[8px] font-mono text-zinc-500 mt-2 uppercase">
            Clicks per view indicator
          </span>
        </div>

      </div>

      {/* CORE REDIRECT DENSITY CHART PLOTS */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 mb-8">
        <h2 className="font-display text-2xl tracking-wider text-white uppercase mb-6 pb-3 border-b border-white/5 flex items-center space-x-2">
          <span>Outlink Click Distributions</span>
        </h2>

        {linksCount === 0 ? (
          <p className="text-zinc-500 text-xs font-sans">No links populated on stats grid.</p>
        ) : (
          <div className="space-y-6">
            {collection.links && collection.links.map((l) => {
              const platform = detectPlatform(l.url);
              const PlatformIcon = platform.icon;
              const clk = l.clickCount || 0;
              
              // Percentage width computation for visual bars
              const pct = maxClickCount > 0 ? (clk / maxClickCount) * 100 : 0;

              return (
                <div key={l.id} className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                    
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded bg-white/5 ${platform.colorClass}`}>
                        <PlatformIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-white truncate max-w-sm">
                        {l.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate max-w-xs font-mono hidden sm:inline">
                        ({l.url})
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <span className="text-white font-bold">{clk}</span>
                      <span className="text-zinc-500">clicks</span>
                      <span className="text-zinc-700">|</span>
                      <span className="text-purple-glow font-bold">
                        {totalViews > 0 ? ((clk / totalViews) * 100).toFixed(0) : 0}%
                      </span>
                      <span className="text-zinc-500">CTR</span>
                    </div>

                  </div>

                  {/* CUSTOM GLOW BAR */}
                  <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-glow to-blue-accent relative"
                    >
                      <div className="absolute inset-0 bg-white/10 animate-pulse" />
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INDIVIDUAL OUTLINK BREAKDOWN CARDS */}
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="font-display text-2xl tracking-wider text-white uppercase mb-4">
          Individual Links breakdown
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                <th className="py-3 px-2">OUTLINK TARGET</th>
                <th className="py-3 px-2">DETECTOR TYPE</th>
                <th className="py-3 px-2 text-center">CLICK COUNTS</th>
                <th className="py-3 px-2 text-right">REDIRECT ACTION</th>
              </tr>
            </thead>
            <tbody>
              {collection.links && collection.links.map((l) => {
                const platform = detectPlatform(l.url);
                const PlatformIcon = platform.icon;
                return (
                  <tr key={l.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all font-sans text-xs sm:text-sm">
                    {/* Title */}
                    <td className="py-4 px-2">
                      <span className="block font-semibold text-white leading-tight">{l.title}</span>
                      <span className="block text-[10px] font-mono text-zinc-500 truncate max-w-xs sm:max-w-md mt-0.5">{l.url}</span>
                    </td>
                    
                    {/* Detector type */}
                    <td className="py-4 px-2">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/5 text-[9px] font-mono uppercase ${platform.colorClass}`}>
                        <PlatformIcon className="h-3 w-3 mr-1" />
                        <span>{platform.name}</span>
                      </span>
                    </td>

                    {/* Counts */}
                    <td className="py-4 px-2 text-center text-xs font-mono text-white font-bold">
                      {l.clickCount || 0}
                    </td>

                    {/* External outlink */}
                    <td className="py-4 px-2 text-right">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-white/5 text-zinc-400 hover:text-white rounded transition-colors inline-block"
                        title="Visit target outlink"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
