import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import WebsiteNotificationBridge from "./components/WebsiteNotificationBridge";
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/ConfirmModal";
import { syncAllProductCatalogs } from "./services/productCatalogSync.service";

function AppInner() {
  const { pathname } = useLocation();
  const isAdmin    = pathname.startsWith("/admin");
  const isTicket   = pathname === "/ticket";
  const isEmployee = pathname.startsWith("/employee");

  const hideChrome = isAdmin || isTicket || isEmployee;

  useEffect(() => {
    let syncInFlight = false;

    const runSync = async () => {
      if (syncInFlight || isAdmin) return;
      syncInFlight = true;
      try {
        await syncAllProductCatalogs();
      } finally {
        syncInFlight = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void runSync();
      }
    };

    void runSync();
    window.addEventListener("focus", runSync);
    window.addEventListener("pageshow", runSync);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", runSync);
      window.removeEventListener("pageshow", runSync);
      document.removeEventListener("visibilitychange", handleVisibility);
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
