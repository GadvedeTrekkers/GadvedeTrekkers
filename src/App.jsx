import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import WebsiteNotificationBridge from "./components/WebsiteNotificationBridge";
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/ConfirmModal";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { syncAllProductCatalogs } from "./services/productCatalogSync.service";
import { startRealtimeSync, stopRealtimeSync } from "./services/realtimeSync.service";
import { startKeepAlive, stopKeepAlive } from "./services/keepAlive.service";

function AppInner() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");
  const isAdmin    = location.pathname.startsWith("/admin");
  const isTicket   = location.pathname === "/ticket";
  const isEmployee = location.pathname.startsWith("/employee");

  const hideChrome = isAdmin || isTicket || isEmployee;

  // Perfect smooth page transition
  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Start fade out
      setTransitionStage("fadeOut");
      
      // Wait for complete fade out, then switch content
      const fadeOutTimer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage("switching"); // New intermediate state
        // Direct .scrollTop = 0 bypasses CSS scroll-behavior:smooth in App.css.
        // window.scrollTo({behavior:"instant"}) is supposed to override but
        // gets interrupted mid-animation during this transition.
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Start fade in after a brief moment
        setTimeout(() => {
          setTransitionStage("fadeIn");
        }, 40);
      }, 400);

      return () => clearTimeout(fadeOutTimer);
    }
  }, [location, displayLocation]);

  useEffect(() => {
    let syncInFlight = false;

    const runSync = async (force = false) => {
      if (syncInFlight || isAdmin) return;
      syncInFlight = true;
      try {
        await syncAllProductCatalogs({ force });
      } finally {
        syncInFlight = false;
      }
    };

    const runForcedSync = () => runSync(true);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void runSync(true);
      }
    };

    void runSync();
    window.addEventListener("focus", runForcedSync);
    window.addEventListener("pageshow", runForcedSync);
    document.addEventListener("visibilitychange", handleVisibility);

    if (!isAdmin) startRealtimeSync();

    return () => {
      window.removeEventListener("focus", runForcedSync);
      window.removeEventListener("pageshow", runForcedSync);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (!isAdmin) stopRealtimeSync();
    };
  }, [isAdmin]);

  return (
    <div className={hideChrome ? "" : "d-flex flex-column min-vh-100"} key={displayLocation.pathname}>
      <ScrollToTop />
      <WebsiteNotificationBridge />
      {!hideChrome && <Header />}
      <ErrorBoundary>
        {hideChrome ? (
          <div
            style={{
              opacity: transitionStage === "fadeIn" ? 1 : 0,
              transition: transitionStage === "fadeIn" ? "opacity 0.4s ease-out" : "none",
            }}
          >
            <AppRoutes />
          </div>
        ) : (
          <main 
            className="flex-fill"
            style={{
              opacity: transitionStage === "fadeIn" ? 1 : 0,
              transition: transitionStage === "fadeIn" ? "opacity 0.4s ease-out" : "none",
            }}
          >
            <AppRoutes />
          </main>
        )}
      </ErrorBoundary>
      {!hideChrome && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppInner />
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
