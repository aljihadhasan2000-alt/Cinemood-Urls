import { useState, useEffect } from "react";
import { ParticleCanvas } from "./components/ParticleCanvas";
import { Navbar } from "./components/Navbar";
import { CreatorView } from "./components/CreatorView";
import { SuccessView } from "./components/SuccessView";
import { PublicView } from "./components/PublicView";
import { AnalyticsView } from "./components/AnalyticsView";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  // Monitor browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Soft navigator state pusher
  const navigate = (toPath: string) => {
    window.history.pushState(null, "", toPath);
    setPath(toPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Route match parsers
  let content;
  if (path.startsWith("/p/")) {
    const slug = path.substring(3).trim();
    content = <PublicView slug={slug} />;
  } else if (path.startsWith("/success/")) {
    const slug = path.substring(9).trim();
    content = <SuccessView slug={slug} onNavigate={navigate} />;
  } else if (path.startsWith("/analytics/")) {
    const slug = path.substring(11).trim();
    content = <AnalyticsView slug={slug} onNavigate={navigate} />;
  } else {
    // Default to homepage url generator
    content = (
      <CreatorView
        onGenerated={(slug) => {
          navigate(`/success/${slug}`);
        }}
      />
    );
  }

  // Determine if we should show the full header navigation (not needed in beautiful public landers)
  const showNavbar = !path.startsWith("/p/");

  return (
    <div className="relative min-h-screen bg-transparent select-none selection:bg-purple-glow/30 selection:text-white font-sans text-white overflow-hidden pb-16">
      
      {/* BEAUTIFUL STARFIELD PARTICLE BACKGROUND */}
      <ParticleCanvas />

      {/* HEADER NAV */}
      {showNavbar && <Navbar currentPath={path} onNavigate={navigate} />}

      {/* RENDER DYNAMIC PAGE CONTENT */}
      <main className="relative z-10">
        {content}
      </main>

    </div>
  );
}
