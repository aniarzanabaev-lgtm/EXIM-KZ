// src/types/index.ts

export type UserRole = "client" | "logist";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: unknown;
}

export type RequestStatus = "pending" | "approved" | "rejected" | "processing";
export type Priority = "normal" | "express" | "economy";

export interface AssignedPlane {
  id: string;
  model: string;
  airline: string;
  flightNumber: string;
  totalCostUSD: number;
  departureTime: string;
  flightDurationHours: number;
  pricePerKg: number;
}

export interface CargoRequest {
  id?: string;
  requestId: string;
  clientUid: string;
  clientName: string;
  clientEmail: string;
  cargoType: string;
  weightKg: number;
  volumeM3?: number | null;
  fromAirport: string;
  toAirport: string;
  desiredDate: string;
  notes?: string;
  priority: Priority;
  budgetUSD?: number | null;
  status: RequestStatus;
  assignedPlane?: AssignedPlane | null;
  logistComment?: string;
  logistName?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface Plane {
  id?: string;
  registrationNumber: string;
  model: string;
  airline: string;
  fromCode: string;
  fromCity: string;
  toCode: string;
  toCity: string;
  maxCapacityKg: number;
  availableCapacityKg: number;
  speedKmh: number;
  rangeKm: number;
  departureTime: string;
  arrivalTime: string;
  flightDurationHours: number;
  pricePerKg: number;
  totalCostUSD: number;
  allowedCargoTypes: string[];
  temperatureControlled: boolean;
  dangerousGoodsAllowed: boolean;
  status: string;
  flightNumber: string;
  createdAt: string;
}
