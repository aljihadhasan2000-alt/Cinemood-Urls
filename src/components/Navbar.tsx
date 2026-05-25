import { useState } from "react";
import { Sparkles, Menu, X, Globe, Eye, Plus, ChevronRight } from "lucide-react";

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "CREATE collection", path: "/" },
    { label: "EXPLORE TRENDING", path: "/?section=trending" },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => handleLinkClick("/")}
            className="flex cursor-pointer items-center space-x-2 group"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-glow to-blue-accent p-[1px] transition-transform group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#080808]">
                <Sparkles className="h-4 w-4 text-purple-glow animate-pulse" />
              </div>
            </div>
            <span className="font-display text-2xl tracking-[1px] text-white">
              CINEMOOD <span className="text-purple-glow">URLS</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.path.includes("trending")) {
                    handleLinkClick("/");
                    setTimeout(() => {
                      document.getElementById("trending-section")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  } else {
                    handleLinkClick(item.path);
                  }
                }}
                className={`font-sans font-medium text-xs tracking-wider uppercase transition-colors ${
                  currentPath === item.path ? "text-purple-glow" : "text-zinc-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => handleLinkClick("/")}
              className="relative inline-flex items-center justify-center p-[1px] rounded-lg overflow-hidden group font-display text-sm tracking-wider"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-glow to-blue-accent rounded-lg transition-all group-hover:opacity-100" />
              <span className="relative px-4 py-1.5 transition-all ease-in duration-75 bg-[#080808] rounded-[7px] group-hover:bg-transparent">
                CREATE UNIQUE URL
              </span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-white/5 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-white/5 bg-[#0a0a0a]/95 px-4 pt-2 pb-4 space-y-2 backdrop-blur-2xl">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.path.includes("trending")) {
                  handleLinkClick("/");
                  setTimeout(() => {
                    document.getElementById("trending-section")?.scrollIntoView({ behavior: "smooth" });
                  }, 150);
                } else {
                  handleLinkClick(item.path);
                }
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-xs font-medium uppercase text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2">
            <button
              onClick={() => handleLinkClick("/")}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-purple-glow to-blue-accent py-2 px-4 shadow-lg text-center text-xs font-bold uppercase text-white hover:opacity-90"
            >
              <span>CREATE NEW</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
