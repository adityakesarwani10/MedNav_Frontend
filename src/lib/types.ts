export type Role = "user" | "admin";

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: Role;
}

export type AmbulanceStatus = "available" | "on-trip" | "offline";

export interface Ambulance {
  id: string;
  plate: string;
  driver: string;
  driverPhone: string;
  status: AmbulanceStatus;
  type: "Basic" | "Advanced" | "ICU";
  hospital: string;
}

export interface Hospital {
  id: string;
  name: string;
  area: string;
  beds: number;
  bedsFree: number;
  phone: string;
  specialties: string[];
  rating: number;
  distanceKm: number;
}

export type BookingStatus = "pending" | "dispatched" | "on-trip" | "completed" | "cancelled";

export interface Booking {
  id: string;
  patient: string;
  phone: string;
  pickup: string;
  destination: string;
  ambulanceId?: string;
  status: BookingStatus;
  createdAt: string;
  type: "Emergency" | "Scheduled";
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  ambulanceId?: string;
  rating: number;
  trips: number;
}
