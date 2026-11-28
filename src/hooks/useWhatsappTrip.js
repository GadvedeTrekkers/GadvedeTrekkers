import { useEffect } from "react";
import { clearWhatsappTrip, setWhatsappTrip } from "../config/whatsappTrip";

/**
 * Tell the floating WhatsApp button (and the whatsapp_click event) which trip this page shows.
 * trip = { id, name, type, dates: [labels], pickups: [labels] }; pass null while the data is loading.
 */
export function useWhatsappTrip(trip) {
  const key = trip?.name ? JSON.stringify([trip.id, trip.name, trip.type, trip.dates, trip.pickups]) : "";
  useEffect(() => {
    if (!key) return undefined;
    const t = JSON.parse(key);
    setWhatsappTrip({ id: t[0], name: t[1], type: t[2], dates: t[3], pickups: t[4] });
    return () => clearWhatsappTrip(t[0]);
  }, [key]);
}
