import { useState, useEffect } from "react";
import { ParticleCanvas } from "./components/ParticleCanvas";
import { Navbar } from "./components/Navbar";
import { CreatorView } from "./components/CreatorView";
import { SuccessView } from "./components/SuccessView";
import { PublicView } from "./components/PublicView";
import { AnalyticsView } from "./components/AnalyticsView";
import { AboutView, PrivacyView, TermsView, ContactView } from "./components/StaticPages";
import { Footer } from "./components/Footer";

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
  const cleanPath = path.trim();

  if (cleanPath === "/" || cleanPath === "") {
    // Default to homepage url generator
    content = (
      <CreatorView
        onGenerated={(slug) => {
          navigate(`/success/${slug}`);
        }}
      />
    );
  } else if (cleanPath.startsWith("/success/")) {
    const slug = cleanPath.substring(9).trim();
    content = <SuccessView slug={slug} onNavigate={navigate} />;
  } else if (cleanPath.startsWith("/analytics/")) {
    const slug = cleanPath.substring(11).trim();
    content = <AnalyticsView slug={slug} onNavigate={navigate} />;
  } else if (cleanPath === "/about" || cleanPath === "/about/") {
    content = <AboutView onNavigate={navigate} />;
  } else if (cleanPath === "/privacy" || cleanPath === "/privacy/") {
    content = <PrivacyView />;
  } else if (cleanPath === "/terms" || cleanPath === "/terms/") {
    content = <TermsView />;
  } else if (cleanPath === "/contact" || cleanPath === "/contact/") {
    content = <ContactView />;
  } else {
    // It is a direct public collections slug path, e.g. /[slug] or /p/[slug]
    let slug = cleanPath;
    if (slug.startsWith("/")) {
      slug = slug.substring(1);
    }
    if (slug.startsWith("p/")) {
      slug = slug.substring(2);
    }
    content = <PublicView slug={slug} />;
  }

  // Determine if we should show the full header navigation
  const isStaticOrAppRoute = 
    cleanPath === "/" || 
    cleanPath === "" || 
    cleanPath.startsWith("/success/") || 
    cleanPath.startsWith("/analytics/") ||
    cleanPath === "/about" || cleanPath === "/about/" ||
    cleanPath === "/privacy" || cleanPath === "/privacy/" ||
    cleanPath === "/terms" || cleanPath === "/terms/" ||
    cleanPath === "/contact" || cleanPath === "/contact/";

  const showNavbar = isStaticOrAppRoute;

  return (
    <div className="relative min-h-screen bg-transparent select-none selection:bg-purple-glow/30 selection:text-white font-sans text-white overflow-hidden pb-16">
      
      {/* BEAUTIFUL STARFIELD PARTICLE BACKGROUND */}
      <ParticleCanvas />

      {/* HEADER NAV */}
      {showNavbar && <Navbar currentPath={path} onNavigate={navigate} />}

      {/* RENDER DYNAMIC PAGE CONTENT */}
      <main className="relative z-10 flex-grow min-h-[60vh]">
        {content}
      </main>

      {/* BEAUTIFUL GLASS FOOTER */}
      {showNavbar && <Footer onNavigate={navigate} />}

    </div>
  );
}

