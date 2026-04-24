import { Ambulance, Booking, Driver, Hospital } from "./types";

export const ambulances: Ambulance[] = [
  { id: "a1", plate: "MH-01-AB-1234", driver: "Rajesh Kumar", driverPhone: "+919812340001", status: "available", type: "Advanced", hospital: "Apollo Medical Center" },
  { id: "a2", plate: "DL-02-CD-5678", driver: "Amit Singh", driverPhone: "+919812340002", status: "on-trip", type: "ICU", hospital: "Apollo Medical Center" },
  { id: "a3", plate: "KA-03-EF-9012", driver: "Suresh Patil", driverPhone: "+919812340003", status: "available", type: "Basic", hospital: "Fortis Heart Institute" },
  { id: "a4", plate: "TN-04-GH-3456", driver: "Vikram Reddy", driverPhone: "+919812340004", status: "available", type: "Advanced", hospital: "Max Healthcare" },
  { id: "a5", plate: "GJ-05-IJ-7890", driver: "Mohan Desai", driverPhone: "+919812340005", status: "on-trip", type: "ICU", hospital: "Manipal Hospital" },
  { id: "a6", plate: "WB-06-KL-2345", driver: "Pranav Das", driverPhone: "+919812340006", status: "available", type: "Basic", hospital: "AIIMS" },
  { id: "a7", plate: "RJ-07-MN-6789", driver: "Karan Mehta", driverPhone: "+919812340007", status: "offline", type: "Advanced", hospital: "Fortis Heart Institute" },
  { id: "a8", plate: "UP-08-OP-0123", driver: "Sandeep Yadav", driverPhone: "+919812340008", status: "available", type: "Basic", hospital: "Max Healthcare" },
  { id: "a9", plate: "PB-09-QR-4567", driver: "Harpreet Singh", driverPhone: "+919812340009", status: "available", type: "Advanced", hospital: "Manipal Hospital" },
  { id: "a10", plate: "MP-10-ST-8901", driver: "Rahul Verma", driverPhone: "+919812340010", status: "on-trip", type: "ICU", hospital: "AIIMS" },
];

export const hospitals: Hospital[] = [
  { id: "h1", name: "Apollo Medical Center", area: "Bandra West", beds: 240, bedsFree: 32, phone: "+911140402020", specialties: ["Cardiology", "Trauma", "Neurology"], rating: 4.8, distanceKm: 1.2 },
  { id: "h2", name: "Fortis Heart Institute", area: "Vasant Kunj", beds: 180, bedsFree: 24, phone: "+911140402021", specialties: ["Cardiology", "Emergency"], rating: 4.7, distanceKm: 2.4 },
  { id: "h3", name: "Max Healthcare", area: "Saket", beds: 320, bedsFree: 48, phone: "+911140402022", specialties: ["Multi-specialty", "Trauma"], rating: 4.6, distanceKm: 3.1 },
  { id: "h4", name: "Manipal Hospital", area: "Whitefield", beds: 280, bedsFree: 36, phone: "+911140402023", specialties: ["Orthopedics", "Pediatrics"], rating: 4.5, distanceKm: 4.0 },
  { id: "h5", name: "AIIMS", area: "Ansari Nagar", beds: 500, bedsFree: 28, phone: "+911140402024", specialties: ["All Specialties"], rating: 4.9, distanceKm: 5.6 },
  { id: "h6", name: "Medanta Heart", area: "Gurugram", beds: 220, bedsFree: 18, phone: "+911140402025", specialties: ["Cardiology", "Oncology"], rating: 4.7, distanceKm: 6.2 },
  { id: "h7", name: "Lilavati Hospital", area: "Bandra", beds: 200, bedsFree: 6, phone: "+911140402026", specialties: ["Multi-specialty"], rating: 4.4, distanceKm: 7.8 },
  { id: "h8", name: "Kokilaben DAH", area: "Andheri West", beds: 350, bedsFree: 0, phone: "+911140402027", specialties: ["Trauma", "Neurology"], rating: 4.6, distanceKm: 8.3 },
];

export const bookings: Booking[] = [
  { id: "b1", patient: "Anita Sharma", phone: "+919811112222", pickup: "Sector 15, Noida", destination: "Apollo Medical Center", ambulanceId: "a2", status: "on-trip", createdAt: "2 min ago", type: "Emergency" },
  { id: "b2", patient: "Rohit Khanna", phone: "+919811112223", pickup: "DLF Phase 2", destination: "Fortis Heart Institute", ambulanceId: "a5", status: "on-trip", createdAt: "8 min ago", type: "Emergency" },
  { id: "b3", patient: "Meera Iyer", phone: "+919811112224", pickup: "Indiranagar", destination: "Manipal Hospital", status: "pending", createdAt: "1 min ago", type: "Emergency" },
  { id: "b4", patient: "Sanjay Gupta", phone: "+919811112225", pickup: "Connaught Place", destination: "AIIMS", ambulanceId: "a10", status: "dispatched", createdAt: "5 min ago", type: "Emergency" },
  { id: "b5", patient: "Priya Nair", phone: "+919811112226", pickup: "Powai", destination: "Lilavati Hospital", status: "completed", createdAt: "1 hr ago", type: "Scheduled" },
  { id: "b6", patient: "Arjun Malhotra", phone: "+919811112227", pickup: "Koramangala", destination: "Manipal Hospital", status: "completed", createdAt: "2 hr ago", type: "Emergency" },
];

export const drivers: Driver[] = ambulances.map((a, i) => ({
  id: `d${i + 1}`,
  name: a.driver,
  phone: a.driverPhone,
  license: `DL-${1000 + i}-${2020 + (i % 5)}`,
  ambulanceId: a.id,
  rating: 4.2 + ((i * 7) % 8) / 10,
  trips: 120 + i * 47,
}));

// Simple seeded mock OTP
export const MOCK_OTP = "123456";

// Phone numbers that map to admin role; everything else is user.
export const ADMIN_PHONES = new Set(["+919999900000", "9999900000", "+910000000000"]);
