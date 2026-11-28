# Gadvede Trekkers — API Reference

> **Last updated:** March 2026
> **Base URL (dev):** `http://localhost:5173`
> **Backend API:** `http://localhost:4000/api`

---

## Overview

Gadvede Trekkers uses a hybrid data model:

| Layer | Description |
|-------|-------------|
| **Frontend localStorage** | Primary data store for bookings, enquiries, customers, employees, transactions. All data operations go through helper modules in `/src/data/`. |
| **Backend Express API** | Thin Express server on port 4000 — currently serves product listings from Supabase. All other data is local. |
| **WhatsApp Integration** | Outbound only — uses `wa.me` links with pre-filled messages for enquiry follow-ups and customer contact. |

---

## Frontend Data Modules (localStorage)

### Bookings — `src/data/bookingStorage.js`

| Function | Description |
|----------|-------------|
| `generateBookingId()` | Returns next sequential ID in `GT-YYYY-XXXXXX` format |
| `saveBookingRecord(record)` | Persists booking with CONFIRMED status. Idempotent by bookingId. |
| `getAllBookings()` | Returns all bookings (confirmed + cancelled) |
| `updateBookingStatus(bookingId, status)` | Updates to `CONFIRMED` or `CANCELLED` |
| `getBookingById(id)` | Lookup by bookingId or enhancedBookingId |
| `queryBookings({paymentOption, status, fromDate, toDate, search, sortBy})` | Filtered + sorted list |

**Key localStorage:** `gt_bookings`, `gt_booking_counter`

**Booking Record Fields:**

```json
{
  "bookingId": "GTK-12345678",
  "enhancedBookingId": "GT-2026-000001",
  "customerId": "CUST-...",
  "firstName": "Arjun",
  "lastName": "Sharma",
  "email": "arjun@gmail.com",
  "contactNumber": "9876543210",
  "whatsappNumber": "9876543210",
  "trekName": "Kalsubai Trek",
  "eventName": "Kalsubai Trek",
  "eventCategory": "Trek",
  "tickets": 2,
  "departureOrigin": "Pune",
  "pickupLocation": "McDonald's, Deccan",
  "travelDate": "2026-04-05",
  "paymentOption": "UPI",
  "baseAmount": 2198,
  "taxAmount": 110,
  "totalAmount": 2308,
  "payableNow": 2308,
  "remainingAmount": 0,
  "bookingStatus": "CONFIRMED",
  "taxExempt": false,
  "manualBooking": false,
  "collectedOffline": false,
  "savedAt": "2026-03-28T10:00:00.000Z"
}
```

> **Direct/UPI Bookings** (via staff form): `taxExempt: true`, `manualBooking: true`, `collectedOffline: true`, `taxAmount: 0`.

---

### Enquiries — `src/data/enquiryStorage.js`

| Function | Description |
|----------|-------------|
| `saveEnquiry(enquiry)` | Creates new enquiry, enriches with booking match, saves to customer record, fires alert |
| `getEnquiries({includeArchived})` | Returns active enquiries (archived excluded by default) |
| `updateEnquiry(id, updates)` | Generic updater — auto-sets firstResponseAt and convertedAt timestamps |
| `setEnquiryStatus(id, status)` | Move enquiry through pipeline |
| `setEnquiryTags(id, tags[])` | Set tags (e.g. `["High Intent"]`) |
| `setEnquiryAssignment(id, assignee)` | Assign to a sales person |
| `archiveEnquiry(id)` | Soft-delete — sets archivedAt, never physically removed |
| `syncEnquiriesWithBookings()` | Auto-converts enquiries to CONVERTED when phone/email matches a booking |
| `getEnquiryInsights(items[])` | Returns `{ topLocation, bestPage, avgResponseMs, conversionRate, total, converted }` |
| `getAssignableSalesPeople()` | Returns approved employees for sales assignment dropdown |

**Enquiry Statuses:** `NEW_LEAD` → `CONTACTED` → `QUOTED` → `CONVERTED` → `LOST`

**Tags:** `["High Intent"]`

**Key localStorage:** `gt_enquiries`

**Auto-conversion:** When a customer with the same phone or email completes a booking, `syncEnquiriesWithBookings()` automatically moves matching enquiries to `CONVERTED`.

---

### Customers — `src/data/customerStorage.js`

| Function | Description |
|----------|-------------|
| `getAllCustomers()` | All customers |
| `findOrCreateCustomer({name, phone, email})` | Upsert by phone (primary) or email |
| `upsertCustomerActivity({name, phone, email, enquiry?, booking?})` | Links enquiries and bookings to customer timeline |
| `searchCustomers(query)` | Search by name, phone, email |

**Key localStorage:** `gt_customers`

---

### Transactions — `src/data/transactionStorage.js`

| Function | Description |
|----------|-------------|
| `createTransaction({bookingId, customerId, customerName, paymentMode, grossAmount, tax, netAmount, transactionStatus})` | Creates a transaction record |
| `getAllTransactions()` | All transactions |
| `queryTransactions({status, paymentMode, fromDate, toDate, search, sortBy})` | Filtered list |
| `updateTransactionStatus(transactionId, status)` | Update to `SUCCESS` / `FAILED` / `REFUNDED` |
| `createRefund({transactionId, amount})` | Issues refund, marks transaction `REFUNDED` |
| `getTransactionStats()` | Returns `{ total, success, failed, refunded, revenue }` |

**Payment Modes:** `UPI`, `Debit Card / Credit Card`, `Net Banking`, `Partial Payment`, `CASH`

**Key localStorage:** `gt_transactions`, `gt_refunds`

---

### Employees — `src/data/employeeStorage.js`

| Function | Description |
|----------|-------------|
| `getAllEmployees()` | All employee records |
| `saveEmployee(emp)` | Create or update employee |
| `deleteEmployee(id)` | Remove employee |
| `queryEmployees({search, role, status, expertise})` | Filtered list |
| `getAllAssignments()` | Trek/event assignments |
| `saveAssignment(asgn)` | Create or update assignment |

**Key localStorage:** `gt_employees`, `gt_assignments`, `gt_expenses`

**Management users with special access:**
- `pratik.ubhe` — Sales Manager (sees all assigned enquiries)
- `rohit.panhalkar` — Operations Head
- `akshay.kangude` — Marketing Head

---

### Employee Portal Credentials — `src/data/employeePortalStorage.js`

| Function | Description |
|----------|-------------|
| `employeeLogin(username, password)` | Returns `{ ok, cred }` — validates onboarding status |
| `setEmployeeSession(cred)` | Saves session to `sessionStorage` |
| `getEmployeeSession()` | Returns current session or `null` |
| `clearEmployeeSession()` | Logout |
| `createEmployeeCredentials({employeeId, fullName})` | Generates username + default password |
| `approveOnboarding(employeeId)` | Only Pratik/Akshay/admin can approve |

**Key sessionStorage:** `gt_emp`

**Demo credentials:**

| Name | Username | Password |
|------|----------|----------|
| Pratik Ubhe | `pratik.ubhe` | _set on server (ADMIN_USERS)_ |
| Rohit Panhalkar | `rohit.panhalkar` | _set on server (ADMIN_USERS)_ |
| Akshay Kangude | `akshay.kangude` | _set on server (ADMIN_USERS)_ |
| Rahul Patil | `rahul.patil` | _set on server (ADMIN_USERS)_ |

---

### Booking Form Config — `src/data/bookingFormStorage.js`

| Function | Description |
|----------|-------------|
| `getBookingFormConfig()` | Returns all editable form config |
| `saveBookingFormConfig(config)` | Saves config to localStorage |

**Configurable fields (editable from Admin → Booking Desk):**
- `paymentOptions` — payment methods (one per line)
- `departureOptions` — departure cities (one per line)
- `pickupOptions` — JSON map of city → pickup points array
- `manualCategoryOptions` — event categories for staff form
- `manualSourceOptions` — lead source options
- `manualPaymentMethodOptions` — payment methods for staff form
- `manualStatusOptions` — booking statuses for staff form
- `manualEventOptions` — custom event names for staff form

---

## WhatsApp Integration — `src/utils/leadActions.js`

### `buildWhatsAppMessage({ packageName, location, category, customerName?, customerPhone?, customerEmail?, pax?, preferredDate? })`

Builds the standard WhatsApp message:

```
Hi 👋

I'm interested in:

📍 Location: {location}
📦 Package: {packageName}
👥 Type: {category}

Please share price and details.
```

### `createWhatsAppInquiryUrl({ packageName, location, category, phoneNumber? })`

Returns a `wa.me` URL with the pre-built message. Default phone: `919856112727`.

### `handleWhatsAppLead({ packageName, location, category, ... })`

Full lead workflow:
1. Saves enquiry to localStorage
2. Posts to `/api/leads` (non-blocking, 2.5s timeout)
3. Opens WhatsApp with pre-filled message

---

## Backend Express API — `http://localhost:4000/api`

> The backend currently serves product data from Supabase. All CRM/booking/enquiry data is client-side.

### `GET /api/products`

Returns all products from Supabase.

**Query params:**
- `type` — filter by type (e.g. `trek`, `tour`)

**Response:**
```json
{
  "data": [ { "id": "...", "name": "...", "slug": "..." } ]
}
```

### `GET /api/products/:slug`

Returns a single product by slug.

---

## Trek-Specific Pickup Locations — `src/utils/eventDepartureConfig.js`

When a trek is selected in the booking form (frontend or staff form), departure and pickup options automatically update to show only what's relevant to that trek.

```js
getEventDepartureConfig({
  category: "Trek",
  eventName: "Kalsubai Trek",
  fallbackDepartureOptions: [...],
  fallbackPickupMap: { ... },
})
// Returns { departureOptions: [...], pickupMap: { ... } }
```

If no trek-specific config is found, it falls back to the global pickup options from Admin → Booking Desk.

---

## Admin Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/dashboard` | Dashboard | KPIs, financial health, trek timeline |
| `/admin/bookings` | ManageBookings | All bookings with filters and actions |
| `/admin/enquiries` | ManageEnquiries | Lead pipeline with Kanban board |
| `/admin/booking-form` | ManageBookingForm | Configure dropdowns and staff form |
| `/admin/customers` | ManageCustomers | Customer CRM |
| `/admin/transactions` | ManageTransactions | Payment records |
| `/admin/employees` | ManageEmployees | Staff management |
| `/admin/earnings` | ManageEarnings | Financial analytics |

## Employee Portal Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/employee-login` | EmployeeLogin | Staff login |
| `/employee/*` | EmployeePortal | Dashboard, enquiries, treks, earnings |
| `/employee/direct-booking` | DirectBookingForm | Staff direct payment form (UPI/cash) |

---

## Error Handling

- **WhatsApp lead posting**: Silently fails if `/api/leads` is down — enquiry is always saved to localStorage first.
- **JSON parsing errors**: All localStorage operations use try/catch and return empty arrays on failure.
- **Pickup location mismatch**: If a saved pickup doesn't match the current departure options, it resets to the first available option automatically.
- **Enquiry deletion**: Enquiries are never deleted — use `archiveEnquiry()` for soft-delete.

---

## Data Flow: New Booking

```
Customer fills form
  ↓
findOrCreateCustomer() — creates/updates customer record
  ↓
generateBookingId() — GT-YYYY-XXXXXX
  ↓
saveBookingRecord() — saves to gt_bookings
  ↓
upsertCustomerActivity() — links booking to customer
  ↓
syncEnquiriesWithBookings() — auto-converts matching enquiries
  ↓
createTransaction() — payment record in gt_transactions
  ↓
createIncentive() — if referral code was used
  ↓
createAlert() + recordEmailAlertAttempt() — admin notifications
```

## Data Flow: New Enquiry (WhatsApp button)

```
Customer clicks WhatsApp button
  ↓
buildWhatsAppMessage() — formats message
  ↓
handleWhatsAppLead() called
  ↓
saveEnquiry() — saves to gt_enquiries
  ↓
upsertCustomerActivity() — links enquiry to customer
  ↓
createAlert() — fires NEW_ENQUIRY alert for admin
  ↓
postLeadToApi() — async POST to /api/leads (non-blocking)
  ↓
Opens WhatsApp with pre-filled message
```
