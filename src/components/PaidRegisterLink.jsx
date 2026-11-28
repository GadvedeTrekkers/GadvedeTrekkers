import { Link } from "react-router-dom";
import "../pages/PaymentRegistration/PaymentRegistration.css";

/** "Already paid by bank transfer / UPI? Register here" → /register (pre-selects the event when a slug is given). */
export default function PaidRegisterLink({ slug = "", className = "", style }) {
  const to = slug ? `/register?event=${encodeURIComponent(slug)}` : "/register";
  return (
    <Link to={to} className={`preg-cta-link ${className}`.trim()} style={style}>
      Already paid by bank transfer / UPI? Register here →
    </Link>
  );
}
