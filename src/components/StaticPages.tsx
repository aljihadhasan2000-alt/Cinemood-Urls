import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  HelpCircle, 
  Info, 
  ShieldCheck, 
  FileText, 
  Send, 
  Mail, 
  MessageSquare, 
  Globe, 
  Heart, 
  Clapperboard, 
  Tv, 
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";

interface PageProps {
  onNavigate: (path: string) => void;
}

// ================= ABOUT PAGE =================
export function AboutView({ onNavigate }: PageProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 relative">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-glow/10 rounded-full filter blur-[130px] pointer-events-none -z-10" />

      {/* Hero Title */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-glow/10 border border-purple-glow/20 rounded-full text-[10px] font-mono uppercase text-purple-glow mb-4">
          <Clapperboard className="h-3.5 w-3.5" />
          <span>Behind The Screen</span>
        </span>
        <h1 className="font-display text-5xl sm:text-7xl tracking-[2px] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-400 uppercase leading-none mb-4">
          CINEMOOD <span className="text-purple-glow">STORY</span>
        </h1>
        <p className="font-sans text-sm text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
          We believe link sharing deserves the silver screen treatment. Cinemood URLs replaces boring plain-text links with interactive, high-fidelity landing portfolios customized specifically for visual stories.
        </p>
      </motion.div>

      {/* Grid of Perks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 border border-white/5 relative overflow-hidden group"
        >
          <div className="p-3 w-12 h-12 rounded-lg bg-purple-glow/10 border border-purple-glow/20 text-purple-glow flex items-center justify-center mb-6">
            <Tv className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl tracking-wider uppercase text-white mb-2">Theater Aesthetics</h3>
          <p className="font-sans text-xs text-zinc-400 leading-relaxed font-light">
            Each collection renders a premium cinematic screen with gorgeous starfield backdrops, glass controls, and auto logo mapping tailored to entertainment apps.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 border border-white/5 relative overflow-hidden group"
        >
          <div className="p-3 w-12 h-12 rounded-lg bg-blue-accent/10 border border-blue-accent/20 text-blue-accent flex items-center justify-center mb-6">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl tracking-wider uppercase text-white mb-2">Zero Intermediaries</h3>
          <p className="font-sans text-xs text-zinc-400 leading-relaxed font-light">
            Built as a serverless static engine. Your data is stored right on your browser, meaning lightning-fast loads, extreme privacy, and zero server outages.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 border border-white/5 relative overflow-hidden group"
        >
          <div className="p-3 w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl tracking-wider uppercase text-white mb-2">Instant Redirection</h3>
          <p className="font-sans text-xs text-zinc-400 leading-relaxed font-light">
            No messy database ids or dynamic redirects. Customize titles to create instant, memorable slugs mapping directly to your brand.
          </p>
        </motion.div>
      </div>

      {/* Action / Call to action */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-panel p-8 border border-purple-glow/10 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-glow/5 to-transparent pointer-events-none" />
        <h2 className="font-display text-2xl sm:text-3xl tracking-wider text-white uppercase mb-2">Ready to Direct Your Stage?</h2>
        <p className="font-sans text-xs text-zinc-400 max-w-lg mx-auto mb-6 leading-relaxed font-light">
          Construct custom lists containing movie databases, YouTube clips, custom reviews, or soundtrack channels in under thirty seconds.
        </p>
        <button
          onClick={() => onNavigate("/")}
          className="px-6 py-3 bg-gradient-to-r from-purple-glow to-blue-accent rounded-xl text-xs font-mono uppercase tracking-wider text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg"
        >
          Generate First Hub
        </button>
      </motion.div>
    </div>
  );
}


// ================= PRIVACY PAGE =================
export function PrivacyView() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-10 border border-white/5"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-glow/10 border border-purple-glow/20 rounded-lg text-purple-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wider text-white uppercase">
            PRIVACY <span className="text-purple-glow">SHIELD</span>
          </h1>
        </div>
        
        <p className="text-[10px] font-mono text-zinc-500 uppercase mb-8">
          Last Revised: May 26, 2026 &bull; Status: Serverless &amp; Encrypted
        </p>

        <div className="font-sans text-xs text-zinc-400 space-y-6 font-light leading-relaxed">
          <section>
            <h3 className="font-display text-lg tracking-wider text-white uppercase mb-2">1. Decentralized Storage</h3>
            <p>
              Cinemood URLs does not run server databases or gather user files behind closed doors. All URLs, custom passcodes, descriptions, and linked assets you configure exist in your sandbox <b>localStorage</b>. Your parameters are strictly under your control.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg tracking-wider text-white uppercase mb-2">2. Zero Tracking Coeffecients</h3>
            <p>
              We do not implant creepy advertisements or fingerprint tracking cookies. Any analytical click counters on Cinemood are computed strictly on the viewer's device inside their browser interface, meaning zero telemetry leak.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg tracking-wider text-white uppercase mb-2">3. Encrypted Credentials</h3>
            <p>
              Protected stages run using standard front-end key evaluations. While perfectly suitable for managing visual link assets, theater streams, and casual lists, we advise against managing highly sensitive passwords or files.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg tracking-wider text-white uppercase mb-2">4. Client Control</h3>
            <p>
              To clear all records compiled within Cinemood, simply empty your browser cache or click the trash icon located beside individual URLs generated in the success view.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}


// ================= TERMS PAGE =================
export function TermsView() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-10 border border-white/5"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-accent/10 border border-blue-accent/20 rounded-lg text-blue-accent">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wider text-white uppercase">
            RULES of <span className="text-blue-accent">ENGAGEMENT</span>
          </h1>
        </div>

        <p className="text-[10px] font-mono text-zinc-500 uppercase mb-8">
          Last Revised: May 26, 2026 &bull; Terms of Use Agreement
        </p>

        <div className="font-sans text-xs text-zinc-400 space-y-6 font-light leading-relaxed">
          <section>
            <h3 className="font-display text-lg tracking-wider text-white uppercase mb-2">1. Content Ownership</h3>
            <p>
              Creators hold ultimate responsibility for links published via Cinemood. Sharing of viruses, phishing assets, scam credentials, or copyright-infringing streams is strictly prohibited under federal compliance statues.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg tracking-wider text-white uppercase mb-2">2. Non-Liability</h3>
            <p>
              Cinemood provides a public portal engine as-is. Because it runs purely on frontend storage with zero server-side state enforcement, Cinemood holds no responsibility for any accidental data clearing, missing slugs, or browser storage wipes.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg tracking-wider text-white uppercase mb-2">3. Fair Use Slugs</h3>
            <p>
              Slugs are allocated to users on a first-come, first-served basis locally. Branded names or official trademarks should not be occupied with malicious intent.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg tracking-wider text-white uppercase mb-2">4. Platform Updates</h3>
            <p>
              We reserve the right to enrich themes, add visual cards, or update routing mechanics to elevate mobile performance at any interval.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}


// ================= CONTACT PAGE =================
export function ContactView() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("https://formspree.io/f/mykvdbvz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category: category,
          message: message.trim()
        })
      });

      if (response.ok) {
        setSuccess(true);
        // Clear input fields
        setName("");
        setEmail("");
        setMessage("");
      } else {
        const data = await response.json().catch(() => ({}));
        const errMessage = data.error || (data.errors && data.errors.map((err: any) => err.message).join(", ")) || "Failed to transmit message.";
        throw new Error(errMessage);
      }
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 relative">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-glow/5 rounded-full filter blur-[100px] pointer-events-none -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-10 border border-white/5 relative"
      >
        <div className="text-center mb-8">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-accent/10 border border-blue-accent/20 rounded-full text-[10px] font-mono uppercase text-blue-accent mb-3">
            <Mail className="h-3 w-3" />
            <span>Frequencies Online</span>
          </span>
          <h1 className="font-display text-3xl sm:text-5xl tracking-wider text-white uppercase">
            CONTACT <span className="text-purple-glow">TRANSMITTER</span>
          </h1>
          <p className="font-sans text-xs text-zinc-400 font-light mt-1.5">
            Send inquiries, feature suggestions, or DMCA compliance notices straight to our support frequency.
          </p>
        </div>

        {success ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 bg-purple-glow/10 border border-purple-glow/30 rounded-xl text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-purple-glow/20 border border-purple-glow/40 mx-auto flex items-center justify-center text-purple-glow">
              <CheckCircle className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display text-xl tracking-wider text-white uppercase">Transmission Dispatched!</h3>
              <p className="font-sans text-[13px] text-zinc-200 mt-2 max-w-sm mx-auto font-medium">
                Message sent successfully
              </p>
              <p className="font-sans text-[11px] text-zinc-400 mt-1 max-w-sm mx-auto font-light leading-relaxed">
                Our crew will review your support frequency signal and respond back shortly.
              </p>
            </div>
            <div>
              <button 
                onClick={() => setSuccess(false)}
                className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Send Another Transmission
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 font-sans">
            {submitError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-mono text-center">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Your ID / Name</label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Captain Kubrick"
                  className="w-full glass-input rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Contact Channel / Email</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. director@cinema.com"
                  className="w-full glass-input rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Inquiry Broadcast Channel</label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:outline-none focus:border-purple-glow"
              >
                <option value="general">General Broadcast / Inquiries</option>
                <option value="feature">Feature Proposals &amp; Upgrades</option>
                <option value="dmca">Copyright / DMCA Stage Removal</option>
                <option value="business">Affiliate &amp; Cinema Partnerships</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Your Transmission / Message</label>
              <textarea
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Compose your transmitter parameters and details here..."
                className="w-full glass-input rounded-xl p-4 text-xs text-white placeholder-zinc-700 min-h-[100px] focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-purple-glow to-blue-accent text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all outline-none disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>TRANSMITTING LINK...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>DISPATCH SIGNAL</span>
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
