const n="gt_booking_form",e={heroKicker:"Secure Trek Booking",heroTitle:"Payment And Traveler Details",heroSubtitle:"Your trek is locked to the selected destination. Add each traveler and choose where they want to join from.",leadSectionTitle:"Lead Traveler Details",leadSectionSubtitle:"The selected trek is fixed based on the trek the customer clicked.",summaryTitle:"Payment Summary",summarySubtitle:"5% tax is applied on every booking.",manualFormTitle:"Direct Payment Booking Desk",manualFormSubtitle:"Use this staff form when a customer pays directly through UPI or offline instead of the website checkout. These bookings stay tax-free and still get saved in CRM, customers, and bookings.",manualFormNote:"This staff form is meant for employee/admin use only. Manual direct-payment entries are saved with zero tax.",emailNote:"Ticket email delivery still needs backend email integration. The front-end booking and ticket flow is ready, but actual email sending is not configured yet.",backLinkLabel:"Back To Treks",paymentOptions:`Debit Card / Credit Card
UPI
Net Banking
Partial Payment`,manualPaymentMethodOptions:`UPI
Cash
Bank Transfer
Card Machine
Partial Payment`,departureOptions:`Pune
Mumbai
Kasara
Base Village`,manualCategoryOptions:`Trek
Tour
Camping
Rental
Heritage Walk
Corporate
Industrial Visit`,manualSourceOptions:`Employee Portal
Admin Desk
Direct UPI
Walk-in
WhatsApp`,manualStatusOptions:`CONFIRMED
CANCELLED`,manualEventOptions:`Goa Backpacking
Malvan Tarkarli with Scuba Diving and Watersports
Hampi Tour
Corporate Outing Near Pune/Mumbai`,pickupOptions:JSON.stringify({Pune:["McDonald's, Deccan","New Shivaji Nagar (Mari Aai Gate / Wakadewadi)","Nashik Phata (Kasarwadi Police Station)","Wakad Bridge / Rajyog Hotel","Hinjewadi Chowk","Pirangut Chowk (Hinjewadi Phase 3)","Inorbit Mall, Viman Nagar","Chandni Chowk"],Mumbai:["CSMT","Byculla","Dadar","Kurla","Ghatkopar","Thane","Dombivali","Kalyan","Borivali National Park Gate","Virwani Bus Stop, Goregaon","Gundavali Bus Stop, Andheri East","Kalanagar Bus Stop, Bandra","Everard Nagar Bus Stop, Sion","Diamond Garden, Chembur","Vashi Plaza","McDonald's, Kalamboli"],Kasara:["Kasara Railway Station (Ticket Counter)","Kasara Bus Stop"],"Base Village":["Direct At Base Village","Nirgudpada Village","Bhira Base Village","Kotamwadi Junction"]},null,2),consentRules:"I have read and accepted the trek rules, safety instructions, and reporting time.",consentFitness:"I confirm that I and my group members are medically fit for this trek activity.",consentCancellation:"I understand the cancellation policy, tax applicability, and partial payment conditions."};function i(){try{const a=JSON.parse(localStorage.getItem(n)||"null");return{...e,...a||{}}}catch{return{...e}}}function o(a){const t={...e,...a};return localStorage.setItem(n,JSON.stringify(t)),t}export{e as D,i as g,o as s};
