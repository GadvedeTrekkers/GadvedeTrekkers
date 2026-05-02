import { apiRequest } from "../api/backendClient";

const STORAGE_KEY_BY_TYPE = {
  event: "gt_event_listings",
  property: "gt_property_listings",
  campsite: "gt_campsite_listings",
};

function getStorageKey(submissionType) {
  return STORAGE_KEY_BY_TYPE[submissionType];
}

function mapLocalSubmissionToSupabase(submissionType, item) {
  return {
    submission_type: submissionType,
    title: item.eventName || item.propertyName || item.campsiteName || "Untitled",
    subtype: item.eventType || item.propertyType || item.type || null,
    status: item.status || "PENDING",
    contact_name: item.organizerName || item.ownerName || "",
    phone: item.phone || "",
    email: item.email || null,
    location: item.location || "",
    event_date: item.eventDate || null,
    expected_attendees: item.expectedAttendees ? Number(item.expectedAttendees) : null,
    entry_fee: item.entryFee ? Number(item.entryFee) : null,
    capacity: item.capacity ? Number(item.capacity) : null,
    price_per_night: item.pricePerNight ? Number(item.pricePerNight) : null,
    price_per_person: item.pricePerPerson ? Number(item.pricePerPerson) : null,
    nearby_trek: item.nearbyTrek || null,
    description: item.description || null,
    pickup_points: item.pickupPoints || [],
    amenities: item.amenities || [],
    facilities: item.facilities || [],
    images: item.images || item.photos || [],
    admin_notes: item.adminNotes || null,
    submitted_at: item.submittedAt || new Date().toISOString(),
  };
}

function itemShapeByType(submissionType, row) {
  if (submissionType === "event") {
    return {
      eventName: row.eventName || row.title || "",
      eventType: row.eventType || row.subtype || "",
      organizerName: row.organizerName || row.contact_name || "",
      phone: row.phone || "",
      email: row.email || "",
      eventDate: row.eventDate || row.event_date || "",
      location: row.location || "",
      expectedAttendees: row.expectedAttendees || row.expected_attendees || "",
      entryFee: row.entryFee || row.entry_fee || "",
      description: row.description || "",
      pickupPoints: row.pickupPoints || row.pickup_points || [],
    };
  }

  if (submissionType === "property") {
    return {
      propertyName: row.propertyName || row.title || "",
      type: row.type || row.subtype || "",
      ownerName: row.ownerName || row.contact_name || "",
      phone: row.phone || "",
      email: row.email || "",
      location: row.location || "",
      capacity: row.capacity || "",
      pricePerNight: row.pricePerNight || row.price_per_night || "",
      description: row.description || "",
      amenities: row.amenities || [],
      photos: row.photos || row.images || [],
    };
  }

  return {
    campsiteName: row.campsiteName || row.title || "",
    ownerName: row.ownerName || row.contact_name || "",
    phone: row.phone || "",
    email: row.email || "",
    location: row.location || "",
    nearbyTrek: row.nearbyTrek || row.nearby_trek || "",
    capacity: row.capacity || "",
    pricePerPerson: row.pricePerPerson || row.price_per_person || "",
    description: row.description || "",
    facilities: row.facilities || [],
    photos: row.photos || row.images || [],
  };
}

function mapRemoteSubmissionToLocal(submissionType, row) {
  return {
    ...itemShapeByType(submissionType, row),
    id: row.id,
    status: row.status || "PENDING",
    submittedAt: row.submittedAt || row.submitted_at || new Date().toISOString(),
    adminNotes: row.adminNotes || row.admin_notes || "",
  };
}

export function getListingSubmissions(submissionType) {
  const key = getStorageKey(submissionType);
  if (!key) return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function saveListingSubmissions(submissionType, items) {
  const key = getStorageKey(submissionType);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(items));
}

export function submitListingSubmission(submissionType, item) {
  const payload = mapLocalSubmissionToSupabase(submissionType, item);
  return apiRequest(`/api/listings/${submissionType}`, {
    method: "POST",
    body: payload,
  })
    .then((remote) => {
      const savedItem = remote?.id
        ? mapRemoteSubmissionToLocal(submissionType, remote)
        : item;
      const current = getListingSubmissions(submissionType);
      saveListingSubmissions(submissionType, [savedItem, ...current]);
      return savedItem;
    })
    .catch((error) => {
      console.warn("Listing submission sync failed", error);
      throw error;
    });
}

export function updateListingSubmission(submissionType, id, updates) {
  const current = getListingSubmissions(submissionType);
  const next = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveListingSubmissions(submissionType, next);
  const updatedItem = next.find((item) => item.id === id);
  return apiRequest(`/api/listings/admin/${id}`, {
    method: "PATCH",
    admin: true,
    body: mapLocalSubmissionToSupabase(submissionType, updatedItem),
  })
    .then(() => updatedItem || null)
    .catch((error) => {
      console.warn("Listing update sync failed", error);
      throw error;
    });
}

export function deleteListingSubmission(submissionType, id) {
  const current = getListingSubmissions(submissionType);
  const next = current.filter((item) => item.id !== id);
  saveListingSubmissions(submissionType, next);
  return apiRequest(`/api/listings/admin/${id}`, {
    method: "DELETE",
    admin: true,
  }).catch((error) => {
    console.warn("Listing delete sync failed", error);
    throw error;
  });
}

export async function hydrateListingSubmissions(submissionType) {
  const remote = await apiRequest(`/api/listings/admin/list?type=${encodeURIComponent(submissionType)}`, {
    admin: true,
  });

  if (!Array.isArray(remote)) return null;

  const mapped = remote.map((row) => mapRemoteSubmissionToLocal(submissionType, row));
  saveListingSubmissions(submissionType, mapped);
  return mapped;
}

export async function fetchPublicListings(submissionType) {
  const remote = await apiRequest(`/api/listings/public/${encodeURIComponent(submissionType)}`);
  if (!Array.isArray(remote)) return [];
  return remote.map((row) => mapRemoteSubmissionToLocal(submissionType, row));
}
