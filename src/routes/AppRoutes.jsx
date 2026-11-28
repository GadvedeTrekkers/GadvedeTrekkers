import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { getEmployeeSession } from "../data/employeePortalStorage";

/* ── Employee-only route guard ────────────────────────────── */
function EmployeeRoute({ children }) {
  const location = useLocation();
  if (!getEmployeeSession()) {
    return <Navigate to={`/employee-login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return children;
}
import Home from "../pages/Home";
import ContentPage from "../pages/ContentPage";
import Contact from "../pages/Contact";

/* ================= ADMIN / BACKEND ================= */
const AdminLogin = lazy(() => import("../backend/AdminLogin"));
const AdminLayout = lazy(() => import("../backend/AdminLayout"));
const Dashboard = lazy(() => import("../backend/Dashboard"));
const ManageTreks = lazy(() => import("../backend/ManageTreks"));
const ManageTours = lazy(() => import("../backend/ManageTours"));
const ManageHeritage = lazy(() => import("../backend/ManageHeritage"));
const ManageCamping = lazy(() => import("../backend/ManageCamping"));
const ManageRentals = lazy(() => import("../backend/ManageRentals"));
const ManageVendors = lazy(() => import("../backend/ManageVendors"));
const ManageBookings = lazy(() => import("../backend/ManageBookings"));
const ManageTransactions = lazy(() => import("../backend/ManageTransactions"));
const ManageCustomers = lazy(() => import("../backend/ManageCustomers"));
const ManageReports = lazy(() => import("../backend/ManageReports"));
const ManageMarketing = lazy(() => import("../backend/ManageMarketing"));
const ManageFeedback = lazy(() => import("../backend/ManageFeedback"));
const ManageEarnings = lazy(() => import("../backend/ManageEarnings"));
const ManageEmployees = lazy(() => import("../backend/ManageEmployees"));
const ManageTraining = lazy(() => import("../backend/ManageTraining"));
const EmployeeOnboarding = lazy(() => import("../backend/EmployeeOnboarding"));
const EmployeeLogin = lazy(() => import("../pages/Employee/EmployeeLogin"));
const EmployeePortal = lazy(() => import("../pages/Employee/EmployeePortal"));
const DirectBookingForm = lazy(() => import("../pages/Employee/DirectBookingForm"));
const AddNew = lazy(() => import("../backend/AddNew"));
const ManageBlogPosts = lazy(() => import("../backend/blog/ManageBlogPosts"));   // AI blog/SEO writer (replaces the old browser-only ManageBlogs)
const ManageEnquiries = lazy(() => import("../backend/ManageEnquiries"));
const ActivityLogs = lazy(() => import("../backend/ActivityLogs"));
const ManageDocs = lazy(() => import("../backend/ManageDocs"));
const ManageBookingForm = lazy(() => import("../backend/ManageBookingForm"));
const EmailTemplates = lazy(() => import("../backend/EmailTemplates"));
const ManageEvents = lazy(() => import("../backend/ManageEvents"));
const AddEventPage = lazy(() => import("../backend/AddEventPage"));
const ManagePropertyListings = lazy(() => import("../backend/ManagePropertyListings"));
const ManageCampsiteListings = lazy(() => import("../backend/ManageCampsiteListings"));
const ManageVillas = lazy(() => import("../backend/ManageVillas"));
const ManagePaymentRegistrations = lazy(() => import("../backend/ManagePaymentRegistrations"));
const ProfileSetup = lazy(() => import("../backend/ProfileSetup"));
const SiteContentAdmin = lazy(() => import("../backend/SiteContent"));
const AutomationSettings = lazy(() => import("../backend/settings/sections/AutomationSettings"));
const IntegrationSettings = lazy(() => import("../backend/settings/sections/IntegrationSettings"));
const ManageIV = lazy(() => import("../backend/ManageIV"));

/* ================= TREK PAGES ================= */
import Trek           from "../pages/Treks/Trek";
import TrekDetails    from "../pages/Treks/TrekDetails";
import BookOnWhatsApp from "../pages/Booking/BookOnWhatsApp"; // /book: WhatsApp landing (the old on-site desk, pages/Booking/Booking.jsx, is no longer routed)
import BookingSuccess from "../pages/Booking/BookingSuccess";

/* ================= TOUR PAGES ================= */
import Tours               from "../pages/Tours/Tours";
import TourDetails         from "../pages/Tours/TourDetails";

/* ================= HERITAGE PAGES ================= */
import Heritage        from "../pages/HeritageWalk/Heritage";
import HeritageDetails from "../pages/HeritageWalk/HeritageDetails";

/* ================= CAMPING PAGES ================= */
import Camping        from "../pages/Camping/Camping";
import CampingDetails from "../pages/Camping/CampingDetails";

/* ================= RENTAL PAGES ================= */
import Rental        from "../pages/Rentals/Rental";
import RentalDetails from "../pages/Rentals/RentalDetails";

/* ================= LEADER TRAINING ================= */
const LeaderTraining = lazy(() => import("../pages/LeaderTraining/LeaderTraining"));
const TrainingModules = lazy(() => import("../pages/LeaderTraining/TrainingModules"));
const TrainingTest = lazy(() => import("../pages/LeaderTraining/TrainingTest"));
const LeaderCertification = lazy(() => import("../pages/LeaderTraining/LeaderCertification"));

/* ================= CORPORATE ================= */
const Corporate = lazy(() => import("../pages/Corporate/Corporate"));
const IndustrialVisits = lazy(() => import("../pages/IndustrialVisits/IndustrialVisits"));

/* ================= VILLAS ================= */
import Villas from "../pages/Villas/Villas";

/* ================= OPPORTUNITIES / FEEDBACK / TICKET ================= */
const VendorRegister = lazy(() => import("../pages/Opportunities/VendorRegister"));
const PartnerApply = lazy(() => import("../pages/Opportunities/PartnerApply"));
const ListProperty = lazy(() => import("../pages/Opportunities/ListProperty"));
const ListCampsite = lazy(() => import("../pages/Opportunities/ListCampsite"));
const ListEvent = lazy(() => import("../pages/Opportunities/ListEvent"));
const FeedbackForm = lazy(() => import("../pages/Feedback/FeedbackForm"));
const TicketPage = lazy(() => import("../pages/Ticket/TicketPage"));
import WeekendTrips from "../components/WeekendTrips";
import Trips from "../pages/Trips/Trips";
const PaymentRegistration = lazy(() => import("../pages/PaymentRegistration/PaymentRegistration"));
import BlogList from "../pages/Blog/BlogList";
import BlogPost from "../pages/Blog/BlogPost";
import DestinationHub from "../pages/Hubs/DestinationHub";
import { DESTINATION_HUBS } from "../../shared/destinationHubs.js";
import { SEO_REDIRECTS } from "../../shared/seoRedirects.js";
import SeoRedirect from "../components/SeoRedirect";
import NotFound from "../pages/NotFound";

function RouteFallback() {
  return <div className="container py-5 text-center text-muted" data-testid="route-loading">Loading…</div>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* ================= MAIN PAGES ================= */}
      <Route path="/"        element={<Home />} />
      {/* Content pages: words from Admin → Settings → Site Content; unpublished = 404 page (t129u) */}
      <Route path="/about"   element={<ContentPage contentKey="pages.about" />} />
      <Route path="/faq"     element={<ContentPage contentKey="pages.faq" />} />
      <Route path="/terms"   element={<ContentPage contentKey="pages.terms" />} />
      <Route path="/contact" element={<Contact />} />

      {/* ================= TREKS ================= */}
      <Route path="/trips"                    element={<Trips />} />
      <Route path="/trips/:hubSlug"           element={<Trips />} />
      {/* Destination hubs (SEO landing pages, data-driven) */}
      {DESTINATION_HUBS.map((hub) => (
        <Route key={hub.slug} path={hub.path} element={<DestinationHub slug={hub.slug} />} />
      ))}
      {/* Duplicate URLs → their main page (client-side, canonical + noindex) */}
      {Object.entries(SEO_REDIRECTS).map(([from, to]) => (
        <Route key={from} path={from} element={<SeoRedirect to={to} />} />
      ))}
      <Route path="/treks"                    element={<Trek />} />
      <Route path="/treks/:id"                   element={<TrekDetails />} />
      <Route path="/book"             element={<BookOnWhatsApp />} />
      <Route path="/booking/success"  element={<BookingSuccess />} />
      {/* t81u: customers who paid by bank transfer / UPI register the payment */}
      <Route path="/register"              element={<PaymentRegistration />} />
      <Route path="/blog"                  element={<BlogList />} />
      <Route path="/blog/:slug"            element={<BlogPost />} />
      <Route path="/payment-registration"  element={<PaymentRegistration />} />

      {/* ================= TOURS ================= */}
      <Route path="/tours"                              element={<Tours />} />
      <Route path="/tours/:id"                         element={<TourDetails />} />

      {/* ================= HERITAGE ================= */}
      <Route path="/heritage"     element={<Heritage />} />
      <Route path="/heritage/:id" element={<HeritageDetails />} />

      {/* ================= CAMPING ================= */}
      <Route path="/camping"     element={<Camping />} />
      <Route path="/camping/:id" element={<CampingDetails />} />

      {/* ================= RENTALS ================= */}
      <Route path="/rentals"     element={<Rental />} />
      <Route path="/rentals/:id" element={<RentalDetails />} />

      {/* ================= EMPLOYEE PORTAL ================= */}
      <Route path="/employee-login"  element={<EmployeeLogin />} />
      <Route path="/employee/direct-booking" element={<EmployeeRoute><DirectBookingForm /></EmployeeRoute>} />
      <Route path="/employee/*"      element={<EmployeePortal />} />

      {/* ================= OPPORTUNITIES ================= */}
      <Route path="/vendor-register" element={<VendorRegister />} />
      <Route path="/partner"         element={<PartnerApply />} />
      <Route path="/list-property"   element={<ListProperty />} />
      <Route path="/list-campsite"   element={<ListCampsite />} />
      <Route path="/list-event"      element={<ListEvent />} />

      {/* ================= FEEDBACK (public) ================= */}
      <Route path="/feedback" element={<FeedbackForm />} />

      {/* ================= TICKET (public) ================= */}
      <Route path="/ticket" element={<TicketPage />} />

      {/* ================= QA / TEST ROUTES ================= */}
      <Route path="/qa/weekend-trips" element={<WeekendTrips />} />

      {/* ================= POLICIES ================= */}
      <Route path="/cancellation-policy" element={<ContentPage contentKey="pages.cancellation" />} />
      <Route path="/privacy" element={<ContentPage contentKey="pages.privacy" path="/privacy-policy" />} />
      <Route path="/privacy-policy" element={<ContentPage contentKey="pages.privacy" />} />

      {/* ================= VILLAS ================= */}
      <Route path="/villas" element={<Villas />} />

      {/* ================= INDUSTRIAL VISITS ================= */}
      <Route path="/industrial-visits" element={<IndustrialVisits />} />

      {/* ================= LEADER TRAINING (employee only) ================= */}
      <Route path="/leader-training"                  element={<EmployeeRoute><LeaderTraining /></EmployeeRoute>} />
      <Route path="/leader-training/module/:moduleId" element={<EmployeeRoute><TrainingModules /></EmployeeRoute>} />
      <Route path="/leader-training/test"             element={<EmployeeRoute><TrainingTest /></EmployeeRoute>} />
      <Route path="/leader-training/certification"    element={<EmployeeRoute><LeaderCertification /></EmployeeRoute>} />

      {/* ================= CORPORATE ================= */}
      <Route path="/corporate"            element={<Corporate />} />
      <Route path="/corporate/trek"       element={<Corporate />} />
      <Route path="/corporate/camping"    element={<Corporate />} />
      <Route path="/corporate/team-building" element={<Corporate />} />

      {/* ================= ADMIN / BACKEND ================= */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/*" element={<AdminLayout />}>
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="add-new"      element={<AddNew />} />
        <Route path="blogs"        element={<ManageBlogPosts />} />
        <Route path="treks"        element={<ManageTreks />} />
        <Route path="tours"        element={<ManageTours />} />
        <Route path="heritage"     element={<ManageHeritage />} />
        <Route path="camping"      element={<ManageCamping />} />
        <Route path="rentals"      element={<ManageRentals />} />
        <Route path="vendors"      element={<ManageVendors />} />
        <Route path="bookings"     element={<ManageBookings />} />
        <Route path="enquiries"    element={<ManageEnquiries />} />
        <Route path="booking-form" element={<ManageBookingForm />} />
        <Route path="transactions" element={<ManageTransactions />} />
        <Route path="customers"    element={<ManageCustomers />} />
        <Route path="reports"      element={<ManageReports />} />
        <Route path="marketing"    element={<ManageMarketing />} />
        <Route path="feedback"     element={<ManageFeedback />} />
        <Route path="earnings"     element={<ManageEarnings />} />
        <Route path="employees"    element={<ManageEmployees />} />
        <Route path="training"     element={<ManageTraining />} />
        <Route path="onboarding"   element={<EmployeeOnboarding />} />
        <Route path="logs"         element={<ActivityLogs />} />
        <Route path="docs"         element={<ManageDocs />} />
        <Route path="email-templates" element={<EmailTemplates />} />
        <Route path="events"            element={<ManageEvents />} />
        <Route path="events/new"        element={<AddEventPage />} />
        <Route path="property-listings" element={<ManagePropertyListings />} />
        <Route path="campsite-listings" element={<ManageCampsiteListings />} />
        <Route path="villas"            element={<ManageVillas />} />
        <Route path="payment-registrations" element={<ManagePaymentRegistrations />} />
        <Route path="profile-setup" element={<ProfileSetup />} />
        <Route path="site-content" element={<SiteContentAdmin />} />
        <Route path="automations" element={<AutomationSettings />} />
        <Route path="integrations" element={<IntegrationSettings />} />
        <Route path="industrial-visits" element={<ManageIV />} />
      </Route>

      {/* ================= 404 ================= */}
      {/* Unknown URLs (e.g. /blogs) show a real not-found page. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

export default AppRoutes;
