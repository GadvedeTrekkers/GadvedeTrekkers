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
import About from "../pages/About";
import Contact from "../pages/Contact";

/* ================= ADMIN / BACKEND ================= */
import AdminLogin        from "../backend/AdminLogin";
import AdminLayout       from "../backend/AdminLayout";
import Dashboard         from "../backend/Dashboard";
import ManageTreks       from "../backend/ManageTreks";
import ManageTours       from "../backend/ManageTours";
import ManageHeritage    from "../backend/ManageHeritage";
import ManageCamping     from "../backend/ManageCamping";
import ManageRentals     from "../backend/ManageRentals";
import ManageVendors     from "../backend/ManageVendors";
import ManageBookings    from "../backend/ManageBookings";
import ManageTransactions from "../backend/ManageTransactions";
import ManageCustomers   from "../backend/ManageCustomers";
import ManageReports     from "../backend/ManageReports";
import ManageMarketing   from "../backend/ManageMarketing";
import ManageFeedback    from "../backend/ManageFeedback";
import ManageEarnings   from "../backend/ManageEarnings";
import ManageEmployees  from "../backend/ManageEmployees";
import ManageTraining   from "../backend/ManageTraining";
import EmployeeOnboarding from "../backend/EmployeeOnboarding";
import EmployeeLogin  from "../pages/Employee/EmployeeLogin";
import EmployeePortal from "../pages/Employee/EmployeePortal";
import DirectBookingForm from "../pages/Employee/DirectBookingForm";
import AddNew           from "../backend/AddNew";
import ManageBlogs      from "../backend/ManageBlogs";
import ManageEnquiries  from "../backend/ManageEnquiries";
import ActivityLogs     from "../backend/ActivityLogs";
import ManageDocs       from "../backend/ManageDocs";
import ManageBookingForm from "../backend/ManageBookingForm";
import EmailTemplates    from "../backend/EmailTemplates";
import ManageEvents            from "../backend/ManageEvents";
import AddEventPage            from "../backend/AddEventPage";
import ManagePropertyListings  from "../backend/ManagePropertyListings";
import ManageCampsiteListings  from "../backend/ManageCampsiteListings";
import ManageVillas            from "../backend/ManageVillas";
import ManageIV               from "../backend/ManageIV";

/* ================= TREK PAGES ================= */
import Trek           from "../pages/Treks/Trek";
import TrekDetails    from "../pages/Treks/TrekDetails";
import AndharbanTrek  from "../pages/Treks/AndharbanTrek";
import RajmachiTrek   from "../pages/Treks/RajmachiTrek";
import SandhanValley  from "../pages/Treks/SandhanValley";
import DevkundTrek    from "../pages/Treks/DevkundTrek";
import HariharFortTrek from "../pages/Treks/HariharFortTrek";
import Booking       from "../pages/Booking/Booking";
import BookingSuccess from "../pages/Booking/BookingSuccess";

/* ================= TOUR PAGES ================= */
import Tours               from "../pages/Tours/Tours";
import TourDetails         from "../pages/Tours/TourDetails";
import VelasTurtleFestival from "../pages/Tours/VelasTurtleFestival";

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
import LeaderTraining      from "../pages/LeaderTraining/LeaderTraining";
import TrainingModules     from "../pages/LeaderTraining/TrainingModules";
import TrainingTest        from "../pages/LeaderTraining/TrainingTest";
import LeaderCertification from "../pages/LeaderTraining/LeaderCertification";

/* ================= CORPORATE ================= */
import Corporate from "../pages/Corporate/Corporate";
import IndustrialVisits from "../pages/IndustrialVisits/IndustrialVisits";

/* ================= VILLAS ================= */
import Villas from "../pages/Villas/Villas";

/* ================= OPPORTUNITIES / FEEDBACK / TICKET ================= */
import VendorRegister from "../pages/Opportunities/VendorRegister";
import PartnerApply   from "../pages/Opportunities/PartnerApply";
import ListProperty   from "../pages/Opportunities/ListProperty";
import ListCampsite   from "../pages/Opportunities/ListCampsite";
import ListEvent      from "../pages/Opportunities/ListEvent";
import FeedbackForm   from "../pages/Feedback/FeedbackForm";
import TicketPage     from "../pages/Ticket/TicketPage";
import WeekendTrips from "../components/WeekendTrips";
import Trips from "../pages/Trips/Trips";
import CancellationPolicy from "../pages/CancellationPolicy";

function AppRoutes() {
  return (
    <Routes>
      {/* ================= MAIN PAGES ================= */}
      <Route path="/"        element={<Home />} />
      <Route path="/about"   element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* ================= TREKS ================= */}
      <Route path="/trips"                    element={<Trips />} />
      <Route path="/trips/:hubSlug"           element={<Trips />} />
      <Route path="/treks"                    element={<Trek />} />
      <Route path="/treks/andharban-trek-2025"        element={<AndharbanTrek />} />
      <Route path="/treks/rajmachi-fort-trek"         element={<RajmachiTrek />} />
      <Route path="/treks/sandhan-valley-trek"        element={<SandhanValley />} />
      <Route path="/treks/devkund-waterfall-trek"     element={<DevkundTrek />} />
      <Route path="/treks/harihar-fort-trek"          element={<HariharFortTrek />} />
      <Route path="/treks/:id"                   element={<TrekDetails />} />
      <Route path="/book"             element={<Booking />} />
      <Route path="/booking/success"  element={<BookingSuccess />} />

      {/* ================= TOURS ================= */}
      <Route path="/tours"                              element={<Tours />} />
      <Route path="/tours/velas-turtle-festival-2026"  element={<VelasTurtleFestival />} />
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
      <Route path="/cancellation-policy" element={<CancellationPolicy />} />

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
        <Route path="blogs"        element={<ManageBlogs />} />
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
        <Route path="industrial-visits" element={<ManageIV />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
