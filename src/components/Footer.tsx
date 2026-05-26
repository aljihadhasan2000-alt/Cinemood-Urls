import React from "react";
import { Sparkles, ExternalLink, Heart } from "lucide-react";

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };


  return (
    <footer className="relative z-10 w-full mt-24 border-t border-white/5 bg-black/40 backdrop-blur-md py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Logo brand */}
          <div className="text-center md:text-left">
            <div 
              onClick={() => onNavigate("/")}
              className="flex justify-center md:justify-start cursor-pointer items-center space-x-2 mb-2 group"
            >
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-glow to-blue-accent p-[1px]">
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#080808]">
                  <Sparkles className="h-3.5 w-3.5 text-purple-glow animate-pulse" />
                </div>
              </div>
              <span className="font-display text-lg tracking-[1px] text-white">
                CINEMOOD <span className="text-purple-glow">URLS</span>
              </span>
            </div>
            <p className="font-sans text-[11px] text-zinc-500 font-light max-w-xs">
              Directing sleek, fast, decentralized multi-link sharing experiences for films, media, and creator portfolios.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 font-mono text-[10px] uppercase text-zinc-400">
            <a 
              href="/about" 
              onClick={(e) => handleLinkClick(e, "/about")}
              className="hover:text-purple-glow transition-colors"
            >
              About Station
            </a>
            <a 
              href="/privacy" 
              onClick={(e) => handleLinkClick(e, "/privacy")}
              className="hover:text-purple-glow transition-colors"
            >
              Privacy Shield
            </a>
            <a 
              href="/terms" 
              onClick={(e) => handleLinkClick(e, "/terms")}
              className="hover:text-purple-glow transition-colors"
            >
              Terms of Rules
            </a>
            <a 
              href="/contact" 
              onClick={(e) => handleLinkClick(e, "/contact")}
              className="hover:text-purple-glow transition-colors"
            >
              Broadcaster Support
            </a>
          </div>

          {/* Social CTA / Telegram */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <a
              href="https://t.me/cinemood_channel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-accent/10 border border-blue-accent/20 hover:bg-blue-accent/20 text-white rounded-lg transition-all duration-200 active:scale-95 text-[10px] font-mono uppercase"
            >
              <span>Telegram Channel</span>
              <ExternalLink className="h-3 w-3 text-purple-glow" />
            </a>
            <p className="text-[9px] font-mono text-zinc-600">
              Join <span className="text-zinc-500">@cinemood_channel</span> for updates
            </p>
          </div>

        </div>

        {/* copyright metadata */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-8 border-t border-white/5 gap-4">
          <p className="font-mono text-[9px] text-zinc-500 uppercase">
            &copy; {currentYear} Cinemood URLs. All systems operational.
          </p>
          <div className="flex items-center text-[9px] font-mono text-zinc-600 space-x-1 uppercase">
            <span>Crafted with</span>
            <Heart className="h-3 w-3 text-purple-glow fill-purple-glow" />
            <span>for Web Artistry</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
