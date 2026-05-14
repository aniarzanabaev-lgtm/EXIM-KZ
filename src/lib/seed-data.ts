// src/lib/seed-data.ts
import { Plane } from "@/types";

const PLANE_MODELS = [
  { model: "Boeing 747-400F", capacity: 110000, speed: 907, range: 8230, airline: "Air Astana Cargo" },
  { model: "Boeing 747-8F", capacity: 137756, speed: 904, range: 8130, airline: "SCAT Air" },
  { model: "Boeing 777F", capacity: 102000, speed: 905, range: 9030, airline: "FlyArystan Cargo" },
  { model: "Airbus A330-200F", capacity: 70000, speed: 871, range: 7400, airline: "Qazaq Air" },
  { model: "Airbus A300-600F", capacity: 53000, speed: 833, range: 4000, airline: "Saumal Air" },
  { model: "Boeing 737-800BCF", capacity: 23900, speed: 842, range: 5765, airline: "Air Astana" },
  { model: "Antonov An-124", capacity: 120000, speed: 865, range: 5400, airline: "Zhetysu Air" },
  { model: "Ilyushin IL-76TD", capacity: 50000, speed: 850, range: 4200, airline: "SCAT Air" },
  { model: "Antonov An-26", capacity: 5500, speed: 440, range: 2550, airline: "Comlux Kazakhstan" },
  { model: "Boeing 767-300F", capacity: 55000, speed: 854, range: 6025, airline: "Air Astana Cargo" },
  { model: "Airbus A320F", capacity: 21000, speed: 833, range: 5700, airline: "FlyArystan" },
  { model: "Embraer ERJ-145", capacity: 3500, speed: 833, range: 2873, airline: "Saumal Air" },
  { model: "ATR 72-600F", capacity: 7500, speed: 510, range: 1528, airline: "Qazaq Air" },
  { model: "Antonov An-12", capacity: 20000, speed: 777, range: 3600, airline: "Zhetysu Air" },
  { model: "Boeing 757-200F", capacity: 39780, speed: 857, range: 7222, airline: "SCAT Air" },
];

const AIRPORTS_FROM = [
  { code: "ALA", city: "Алматы" },
  { code: "NQZ", city: "Астана" },
  { code: "CIT", city: "Шымкент" },
  { code: "GUW", city: "Атырау" },
  { code: "AKX", city: "Актобе" },
  { code: "UKK", city: "Усть-Каменогорск" },
];

const AIRPORTS_TO = [
  { code: "SVO", city: "Москва" },
  { code: "DXB", city: "Дубай" },
  { code: "IST", city: "Стамбул" },
  { code: "PEK", city: "Пекин" },
  { code: "FRA", city: "Франкфурт" },
  { code: "LHR", city: "Лондон" },
  { code: "JFK", city: "Нью-Йорк" },
  { code: "ICN", city: "Сеул" },
  { code: "HKG", city: "Гонконг" },
  { code: "SIN", city: "Сингапур" },
  { code: "CDG", city: "Париж" },
  { code: "AMS", city: "Амстердам" },
];

const CARGO_TYPES = [
  "Электроника","Медикаменты","Продукты питания",
  "Промышленное оборудование","Текстиль","Химикаты","Ценные грузы","Прочее",
];

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randF(min: number, max: number) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function generatePlanes(count = 350): Omit<Plane, "id">[] {
  const planes: Omit<Plane, "id">[] = [];
  for (let i = 0; i < count; i++) {
    const base = PLANE_MODELS[i % PLANE_MODELS.length];
    const from = pick(AIRPORTS_FROM);
    const to = pick(AIRPORTS_TO);
    const speedVar = randF(0.88, 1.12);
    const capVar = randF(0.85, 1.10);
    const pricePerKg = randF(1.2, 8.5);
    const availCap = rand(500, Math.min(Math.round(base.capacity * capVar), base.capacity));
    const flightHours = randF(2, 18);
    const now = new Date();
    const dep = new Date(now.getTime() + rand(0, 30) * 86400000);
    dep.setHours(rand(4, 22), rand(0, 59), 0, 0);
    const arr = new Date(dep.getTime() + flightHours * 3600000);
    const airline = base.airline.split(" ")[0].substring(0, 2).toUpperCase();

    planes.push({
      registrationNumber: `UP-${rand(100,999)}${String.fromCharCode(65+rand(0,25))}${String.fromCharCode(65+rand(0,25))}`,
      model: base.model,
      airline: base.airline,
      fromCode: from.code,
      fromCity: from.city,
      toCode: to.code,
      toCity: to.city,
      maxCapacityKg: Math.round(base.capacity * capVar),
      availableCapacityKg: availCap,
      speedKmh: Math.round(base.speed * speedVar),
      rangeKm: Math.round(base.range * randF(0.9, 1.1)),
      departureTime: dep.toISOString(),
      arrivalTime: arr.toISOString(),
      flightDurationHours: parseFloat(flightHours.toFixed(1)),
      pricePerKg: parseFloat(pricePerKg.toFixed(2)),
      totalCostUSD: Math.round(availCap * pricePerKg),
      allowedCargoTypes: CARGO_TYPES.filter(() => Math.random() > 0.3),
      temperatureControlled: Math.random() > 0.7,
      dangerousGoodsAllowed: Math.random() > 0.6,
      status: "available",
      flightNumber: `${airline}${rand(100, 9999)}`,
      createdAt: new Date().toISOString(),
    });
  }
  return planes;
}
