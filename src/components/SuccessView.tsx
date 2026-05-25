import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getCanonicalUrl } from "../utils";
import {
  Check,
  Copy,
  QrCode,
  Share2,
  Trash2,
  LineChart,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Twitter,
  Send,
  MessageCircle,
  Mail,
  Lock,
  Unlock,
  AlertTriangle
} from "lucide-react";

interface SuccessViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function SuccessView({ slug, onNavigate }: SuccessViewProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const publicUrl = getCanonicalUrl(slug);
  const analyticsUrl = `/analytics/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Could not copy:", e);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError("");

      const res = await fetch(`/api/collections/${slug}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Could not delete collection from server.");
      }

      // Return back home on successful delete
      onNavigate("/");
    } catch (error: any) {
      setDeleteError(error.message || "Failed to teardown.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Precomputed share paths
  const twitterShare = `https://twitter.com/intent/tweet?text=Check%20out%20my%20Cinemood%20links%20hub!%20${encodeURIComponent(publicUrl)}`;
  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=Check%20out%20my%20Cinemood%20links%20hub!`;
  const whatsappShare = `https://api.whatsapp.com/send?text=Check%20out%20my%20Cinemood%20links%20hub!%2520${encodeURIComponent(publicUrl)}`;
  const mailShare = `mailto:?subject=My%20Cinemood%20Links&body=Check%20it%20out%20here:%20${encodeURIComponent(publicUrl)}`;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12 relative">
      
      {/* GLOW DECORATIONS */}
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-success/10 rounded-full filter blur-[100px] pointer-events-none -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Animated Checkmark Badge */}
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-success/10 border border-success/30 text-success mb-6 relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Check className="h-10 w-10" />
          </motion.div>
          {/* Sparkles */}
          <Sparkles className="h-4 w-4 text-purple-glow absolute -top-1 -right-1 animate-bounce" />
        </div>

        <h1 className="font-display text-4xl sm:text-6xl tracking-[2px] text-white uppercase mb-4">
          YOUR CINEMOOD URL IS <span className="text-success text-neon-pulse">LIVE</span>
        </h1>
        
        <p className="font-sans text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mb-10 font-light">
          Your futuristic, mobile-first links lander has been compiled successfully. Share the unique cinematic link with your audience across socials!
        </p>

        {/* MAIN URL CARD */}
        <div className="glass-panel rounded-2xl p-6 mb-8 text-left relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-glow to-blue-accent" />
          
          <label className="block text-[10px] font-mono tracking-widest text-[#8B5CF6] uppercase font-semibold mb-2">
            YOUR GENERATED ADDRESS
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 font-mono text-xs sm:text-sm text-white select-all break-all overflow-hidden flex items-center justify-between">
              <span>{publicUrl}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-5 py-3.5 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl font-display text-xs tracking-wider uppercase text-white flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-success">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-zinc-400" />
                    <span>COPY LINK</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  window.history.pushState(null, "", `/p/${slug}`);
                  window.dispatchEvent(new Event("popstate"));
                }}
                className="p-3.5 bg-purple-glow/20 hover:bg-purple-glow/30 active:scale-95 border border-purple-glow/30 rounded-xl text-purple-glow transition-all cursor-pointer"
                title="Launch Live View"
              >
                <ExternalLink className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ACTION CARDS BENTO BLOCK */}
        <div className="max-w-md mx-auto mb-10 text-left">
          
          {/* QR CODE CARD */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between hover:border-purple-glow/20 transition-all">
            <div>
              <div className="p-2.5 rounded-lg bg-purple-glow/10 border border-purple-glow/20 w-fit text-purple-glow mb-4">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg tracking-wider text-white uppercase mb-1">
                Shareable QR Poster
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans font-light leading-relaxed mb-4">
                Show customized modern QR-Code for physical print materials, presentations, and offline scans.
              </p>
            </div>
            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full py-2.5 bg-purple-glow/10 hover:bg-purple-glow/20 rounded-xl border border-purple-glow/20 text-white font-display text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{showQr ? "Hide QR Code" : "Reveal QR Card"}</span>
            </button>
          </div>

        </div>

        {/* COLLAPSIBLE QR DISPLAY SECTION */}
        <AnimatePresence>
          {showQr && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="glass-panel rounded-2xl p-6 w-fit mx-auto text-center flex flex-col items-center border border-purple-glow/20">
                <span className="text-[10px] font-mono tracking-widest text-purple-glow uppercase mb-3">Scan Code to Visit</span>
                <div className="p-3 bg-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}&color=080808&bgcolor=ffffff`}
                    alt="Cinemood QR Code"
                    className="w-44 h-44 border-0"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 font-sans mt-3">
                  Right-click or hold to save QR graphic
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SOCIAL SHARE BUTTON CHANNELS */}
        <div className="glass-panel rounded-2xl p-6 mb-10">
          <span className="block text-[10px] font-mono text-center tracking-widest text-zinc-500 uppercase font-semibold mb-4">
            VIRAL PLATFORM SHARING
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={twitterShare}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-lg bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 text-[#1DA1F2] text-xs font-medium flex items-center space-x-2 transition-colors"
            >
              <Twitter className="h-4 w-4" />
              <span>Twitter / X</span>
            </a>
            <a
              href={telegramShare}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-lg bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/20 text-[#229ED9] text-xs font-medium flex items-center space-x-2 transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>Telegram</span>
            </a>
            <a
              href={whatsappShare}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] text-xs font-medium flex items-center space-x-2 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>
            <a
              href={mailShare}
              className="px-4 py-2.5 rounded-lg bg-[#EA4335]/10 hover:bg-[#EA4335]/20 border border-[#EA4335]/20 text-[#EA4335] text-xs font-medium flex items-center space-x-2 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* BOTTOM NAVIGATION / DESTRUCTIVE CONTROL PANEL */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
          <button
            onClick={() => onNavigate("/")}
            className="text-zinc-500 hover:text-white font-display text-sm tracking-wider uppercase flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>CREATE NEW COLLECTION</span>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="text-red-500/80 hover:text-red-400 font-display text-xs lg:text-sm tracking-wider uppercase flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>TEARDOWN / DELETE CARD</span>
          </button>
        </div>

        {/* DANGEROUS DISMANTLE CONFIRM OVERLAY CARD */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="glass-panel rounded-2xl max-w-md w-full p-6 text-center border border-red-500/30"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-red-950/50 border border-red-500/30 text-red-500 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                
                <h3 className="font-display text-2xl tracking-wider text-white uppercase mb-2">
                  ARE YOU ABSOLUTELY SURE?
                </h3>
                
                <p className="text-xs text-zinc-400 font-sans font-light leading-relaxed mb-6">
                  This action is irreversible. Shredding the link will immediately delete the page card, access code, statistical database records, and public short routing slug.
                </p>

                {deleteError && (
                  <p className="text-[11px] text-red-400 font-mono font-bold mb-4">{deleteError}</p>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-display text-sm tracking-widest uppercase rounded-lg border border-white/10 cursor-pointer"
                  >
                    ABORT
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-red-500/20 hover:bg-red-500 text-white font-display text-sm tracking-widest uppercase rounded-lg border border-red-500/30 font-semibold cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    ) : (
                      <span>SHRED CARD</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>

    </div>
  );
}
