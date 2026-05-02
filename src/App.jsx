import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import WebsiteNotificationBridge from "./components/WebsiteNotificationBridge";
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/ConfirmModal";
import { syncAllProductCatalogs } from "./services/productCatalogSync.service";
import { startRealtimeSync, stopRealtimeSync } from "./services/realtimeSync.service";

function AppInner() {
  const { pathname } = useLocation();
  const isAdmin    = pathname.startsWith("/admin");
  const isTicket   = pathname === "/ticket";
  const isEmployee = pathname.startsWith("/employee");

  const hideChrome = isAdmin || isTicket || isEmployee;

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
    <div className="d-flex flex-column min-vh-100">
      <WebsiteNotificationBridge />
      {!hideChrome && <Header />}
      <main className="flex-fill">
        <AppRoutes />
      </main>
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
