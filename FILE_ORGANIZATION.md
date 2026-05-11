# File Organization - Frontend vs Backend

## 🎯 Project Structure Overview

```
Gadvede Trekkers/
├── 📁 Frontend (Public Website)
│   └── Deployed to: www.gadvede.com
│
└── 📁 Backend (Admin Panel + API)
    └── Deployed to: admin.gadvede.com
```

---

## 📂 FRONTEND FILES (Public Website)

### Root Files
```
├── index.html                    # Main HTML entry point
├── package.json                  # Frontend dependencies
├── vite.config.js               # Vite build config for frontend
├── .env                         # Frontend environment variables
├── .env.example                 # Frontend env template
└── netlify.toml                 # Netlify config (if using)
```

### Source Files (`src/`)

#### Core Files
```
src/
├── main.jsx                     # React entry point
├── App.jsx                      # Main app component
├── App.css                      # Global styles
└── index.css                    # Base styles
```

#### Public Pages (`src/pages/`)
```
src/pages/
├── Home.jsx                     # Homepage
├── About.jsx                    # About page
├── Contact.jsx                  # Contact page
├── CancellationPolicy.jsx       # Policy page
│
├── Treks/                       # Trek pages
│   ├── Treks.jsx
│   ├── TrekDetails.jsx
│   └── TrekBooking.jsx
│
├── Tours/                       # Tour pages
│   ├── Tours.jsx
│   ├── TourDetails.jsx
│   └── TourBooking.jsx
│
├── HeritageWalk/               # Heritage walk pages
│   ├── HeritageWalk.jsx
│   └── HeritageDetails.jsx
│
├── Camping/                    # Camping pages
│   ├── Camping.jsx
│   └── CampingDetails.jsx
│
├── Rentals/                    # Rental pages
│   ├── Rentals.jsx
│   └── RentalDetails.jsx
│
├── Villas/                     # Villa pages
│   ├── Villas.jsx
│   └── VillaDetails.jsx
│
├── IndustrialVisits/          # Industrial visit pages
│   ├── IndustrialVisits.jsx
│   └── IVDetails.jsx
│
├── Corporate/                  # Corporate pages
│   └── Corporate.jsx
│
├── LeaderTraining/            # Training pages
│   ├── LeaderTraining.jsx
│   └── TrainingDetails.jsx
│
├── Opportunities/             # Career pages
│   └── Opportunities.jsx
│
├── Booking/                   # Booking pages
│   ├── BookingPage.jsx
│   └── BookingConfirmation.jsx
│
├── Ticket/                    # Ticket pages
│   └── Ticket.jsx
│
└── Feedback/                  # Feedback pages
    └── Feedback.jsx
```

#### Components (`src/components/`)
```
src/components/
├── Header.jsx                  # Site header
├── Footer.jsx                  # Site footer
├── HeroCarousel.jsx           # Homepage carousel
├── WeekendTrips.jsx           # Weekend trips section
├── BookingCTA.jsx             # Booking call-to-action
├── EnquiryModal.jsx           # Enquiry form modal
├── BackButton.jsx             # Navigation back button
├── DownloadButton.jsx         # Download button
├── ProductCardSkeleton.jsx    # Loading skeleton
├── Toast.jsx                  # Toast notifications
├── ConfirmModal.jsx           # Confirmation modal
├── ErrorBoundary.jsx          # Error boundary
├── HistoricTicket.jsx         # Ticket component
├── KalsubaiRouteMap.jsx       # Trek route map
├── HarishchandragadRouteMap.jsx # Trek route map
└── WebsiteNotificationBridge.jsx # Notifications
```

#### API Client (`src/api/`)
```
src/api/
├── backendClient.js           # API client utility
├── getAll.js                  # Fetch all products
├── getById.js                 # Fetch by ID
├── products.api.js            # Product API calls
├── bookings.api.js            # Booking API calls
└── enquiries.api.js           # Enquiry API calls
```

#### Services (`src/services/`)
```
src/services/
├── product.service.js         # Product service
├── booking.service.js         # Booking service
├── enquiry.service.js         # Enquiry service
├── payment.service.js         # Payment service
├── productCatalogSync.service.js # Catalog sync
└── realtimeSync.service.js    # Realtime updates
```

#### Data/Storage (`src/data/`)
```
src/data/
├── treks.js                   # Trek data
├── toursData.js               # Tour data
├── heritageData.js            # Heritage data
├── campingData.js             # Camping data
├── campingDetailsData.js      # Camping details
├── rentalsData.js             # Rental data
├── industrialVisitsData.js    # IV data
├── richTrekDetails.js         # Trek details
├── kalsubaiDetails.js         # Trek details
├── harishchandragadDetails.js # Trek details
├── manaliTourDetails.js       # Tour details
├── additionalTourDetails.js   # Tour details
├── trekPickupLocations.js     # Pickup locations
├── bookingStorage.js          # Booking storage
├── enquiryStorage.js          # Enquiry storage
├── customerStorage.js         # Customer storage
└── featureFlags.js            # Feature flags
```

#### Utilities (`src/utils/`)
```
src/utils/
├── downloadUtils.js           # Download utilities
├── errorMessage.js            # Error handling
├── siteConfig.js              # Site configuration
├── eventDepartureConfig.js    # Event config
└── supabase/
    └── client.js              # Supabase client
```

#### Configuration (`src/config/`)
```
src/config/
└── bookingConfig.js           # Booking configuration
```

#### Routing (`src/routes/`)
```
src/routes/
└── AppRoutes.jsx              # Frontend routes only
```

### Public Assets (`public/`)
```
public/
├── gadvedelogo.png
├── robots.txt
├── sitemap.xml
├── TrekImages/
├── TourImages/
├── HeritageImages/
└── itineraries/
```

---

## 📂 BACKEND FILES (Admin Panel + API)

### Root Files
```
backend/
├── package.json               # Backend dependencies
├── .env                       # Backend environment variables
├── .env.example              # Backend env template
├── node                       # Node binary (if included)
└── eslint.config.js          # ESLint config
```

### Source Files (`backend/src/`)

#### Core Files
```
backend/src/
├── server.js                  # Server entry point
└── app.js                     # Express app configuration
```

#### Admin Panel Pages (`src/backend/`)
```
src/backend/
├── AdminLogin.jsx             # Admin login page
├── AdminLayout.jsx            # Admin layout wrapper
├── Dashboard.jsx              # Admin dashboard
├── AddNew.jsx                 # Add new product
│
├── ManageTreks.jsx           # Manage treks
├── ManageTours.jsx           # Manage tours
├── ManageHeritage.jsx        # Manage heritage walks
├── ManageCamping.jsx         # Manage camping
├── ManageRentals.jsx         # Manage rentals
├── ManageVillas.jsx          # Manage villas
├── ManageIV.jsx              # Manage industrial visits
├── ManageEvents.jsx          # Manage events
├── AddEventPage.jsx          # Add event page
│
├── ManageBookings.jsx        # Manage bookings
├── ManageBookingForm.jsx     # Booking form
├── ManageCustomers.jsx       # Manage customers
├── ManageEnquiries.jsx       # Manage enquiries
├── ManageTransactions.jsx    # Manage transactions
├── ManageEarnings.jsx        # Payments & earnings
│
├── ManageVendors.jsx         # Manage vendors
├── ManagePropertyListings.jsx # Property listings
├── ManageCampsiteListings.jsx # Campsite listings
│
├── ManageEmployees.jsx       # Manage employees
├── EmployeeOnboarding.jsx    # Employee onboarding
├── ManageTraining.jsx        # Training management
│
├── ManageReports.jsx         # Reports
├── ManageMarketing.jsx       # Marketing
├── ManageFeedback.jsx        # Feedback
├── ActivityLogs.jsx          # Activity logs
├── ManageDocs.jsx            # Documentation
├── EmailTemplates.jsx        # Email templates
├── ManageBlogs.jsx           # Blog management
└── ManagePage.jsx            # Generic page manager
```

#### API Routes (`backend/src/routes/`)
```
backend/src/routes/
├── auth.routes.js            # Authentication routes
├── products.routes.js        # Product routes
├── listings.routes.js        # Listing routes
├── bookings.routes.js        # Booking routes
├── customers.routes.js       # Customer routes
├── payments.routes.js        # Payment routes
├── trekPayments.routes.js    # Trek payment routes
├── enquiries.routes.js       # Enquiry routes
├── leads.routes.js           # Lead routes
├── notifications.routes.js   # Notification routes
├── employees.routes.js       # Employee routes
└── vendors.routes.js         # Vendor routes
```

#### API Controllers (`backend/src/controllers/`)
```
backend/src/controllers/
├── auth.controller.js        # Auth controller
├── products.controller.js    # Product controller
├── listings.controller.js    # Listing controller
├── bookings.controller.js    # Booking controller
├── customers.controller.js   # Customer controller
├── payments.controller.js    # Payment controller
├── trekPayments.controller.js # Trek payment controller
├── enquiries.controller.js   # Enquiry controller
├── notifications.controller.js # Notification controller
├── employees.controller.js   # Employee controller
└── vendors.controller.js     # Vendor controller
```

#### Configuration (`backend/src/config/`)
```
backend/src/config/
├── supabasePublicClient.js   # Supabase public client
└── supabaseAdminClient.js    # Supabase admin client
```

#### Middleware (`backend/src/middleware/`)
```
backend/src/middleware/
├── requireAdminApiKey.js     # API key middleware
└── requireAdminJWT.js        # JWT auth middleware
```

#### Services (`backend/src/services/`)
```
backend/src/services/
└── emailService.js           # Email service
```

#### Utilities (`backend/src/utils/`)
```
backend/src/utils/
├── keepAlive.js              # Keep-alive service
├── listingMapper.js          # Listing mapper
└── productMapper.js          # Product mapper
```

#### Tests (`backend/src/__tests__/`)
```
backend/src/__tests__/
├── emailService.test.js
└── notifications.controller.test.js
```

### Admin Panel Build Output
```
backend/admin-dist/           # Built admin panel (generated)
├── index.html
├── assets/
└── ...
```

---

## 📂 SHARED/ADMIN DATA FILES

These files are used by the admin panel:

```
src/data/
├── adminStorage.js           # Admin data storage
├── authStorage.js            # Auth storage
├── permissionStorage.js      # Permission storage
├── activityLogStorage.js     # Activity logs
├── bookingFormStorage.js     # Booking form data
├── transactionStorage.js     # Transaction data
├── earningsStorage.js        # Earnings data
├── employeeStorage.js        # Employee data
├── employeePortalStorage.js  # Employee portal
├── vendorStorage.js          # Vendor data
├── listingSubmissionStorage.js # Listing submissions
├── marketingStorage.js       # Marketing data
├── notificationStorage.js    # Notifications
├── feedbackStorage.js        # Feedback data
├── trainingAdminStorage.js   # Training admin
├── trainingData.js           # Training data
├── leaderStorage.js          # Leader data
├── trekEventStorage.js       # Trek events
├── trekPaymentStorage.js     # Trek payments
├── trekDatesStorage.js       # Trek dates
├── tourDatesStorage.js       # Tour dates
├── rateApprovalStorage.js    # Rate approvals
├── incentiveStorage.js       # Incentives
└── emergencyStorage.js       # Emergency contacts
```

### Admin Hooks (`src/hooks/`)
```
src/hooks/
├── useAdminData.js           # Admin data hook
├── useBookings.js            # Bookings hook
├── useCustomers.js           # Customers hook
├── useEnquiries.js           # Enquiries hook
└── useTransactions.js        # Transactions hook
```

---

## 📂 DOCUMENTATION FILES

```
Root/
├── README.md                     # Project overview
├── PRODUCTION_DEPLOYMENT.md      # Production deployment guide
├── DUAL_DEPLOYMENT_GUIDE.md      # Dual deployment guide
├── ENVIRONMENT_VARIABLES.md      # Environment variables
├── QUICK_REDEPLOY_GUIDE.md      # Quick redeploy guide
├── RENDER_DEPLOYMENT_GUIDE.md    # Render deployment
└── FILE_ORGANIZATION.md          # This file
```

---

## 📂 CONFIGURATION FILES

```
Root/
├── .gitignore                # Git ignore rules
├── .eslintrc.cjs            # ESLint config
├── eslint.config.js         # ESLint config
├── playwright.config.js     # Playwright config
├── render.yaml              # Render deployment config
├── netlify.toml             # Netlify config
├── vite.config.js           # Vite config (frontend)
└── vite.config.admin.js     # Vite config (admin)
```

---

## 🔄 BUILD OUTPUTS (Generated, Not in Git)

```
dist/                        # Frontend build output
backend/admin-dist/          # Admin panel build output
node_modules/                # Dependencies
backend/node_modules/        # Backend dependencies
```

---

## 🎯 Deployment Mapping

### Frontend Deployment (www.gadvede.com)
**Includes:**
- All files from `src/pages/` (except Employee portal)
- All files from `src/components/`
- Public-facing API clients
- Public services
- Public data files
- Assets from `public/`

**Excludes:**
- `src/backend/` folder
- Admin-specific data files
- Admin hooks
- Backend API routes/controllers

**Build Command:**
```bash
npm run build
```

**Output:**
```
dist/
```

---

### Backend Deployment (admin.gadvede.com)
**Includes:**
- All files from `backend/src/`
- All files from `src/backend/` (admin pages)
- Admin-specific data files
- Admin hooks
- Built admin panel in `backend/admin-dist/`

**Excludes:**
- Public website pages
- Public components (Header, Footer, etc.)

**Build Command:**
```bash
cd .. && npm install && npm run build:admin && cd backend && npm install
```

**Output:**
```
backend/admin-dist/  (admin panel UI)
backend/src/         (API server)
```

---

## 📊 File Count Summary

### Frontend (Public Website)
- Pages: ~50 files
- Components: ~20 files
- Services: ~7 files
- Data: ~15 files
- Total: ~100 files

### Backend (Admin + API)
- Admin Pages: ~35 files
- API Routes: ~12 files
- Controllers: ~11 files
- Services: ~2 files
- Data: ~25 files
- Total: ~85 files

---

## 🔍 How to Identify File Category

### Frontend Files:
✅ Located in `src/pages/` (except Employee)
✅ Located in `src/components/` (public components)
✅ Public-facing functionality
✅ User-facing UI
✅ No admin/auth requirements

### Backend Files:
✅ Located in `backend/src/`
✅ Located in `src/backend/` (admin pages)
✅ Requires authentication
✅ Admin-only functionality
✅ API endpoints
✅ Database operations

### Shared Files:
⚠️ Located in `src/data/` (some used by both)
⚠️ Located in `src/api/` (API client used by both)
⚠️ Located in `src/utils/` (utilities used by both)

---

## 💡 Best Practices

1. **Keep frontend lightweight** - Only include public-facing code
2. **Secure backend** - All admin code stays on backend
3. **Separate builds** - Frontend and admin build separately
4. **Clear naming** - Use descriptive file names
5. **Consistent structure** - Follow established patterns

---

## 🎯 Quick Reference

**Want to add a public page?**
→ Add to `src/pages/`

**Want to add an admin feature?**
→ Add to `src/backend/`

**Want to add an API endpoint?**
→ Add to `backend/src/routes/` and `backend/src/controllers/`

**Want to add a shared utility?**
→ Add to `src/utils/` or `src/data/`

---

This organization ensures clean separation between public website and admin panel! 🚀
