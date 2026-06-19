import type { Clinic } from "~/types/clinic";
import type { Provider, Service, Fellowship } from "~/types/service";

const FELLOWSHIPS: Fellowship[] = [
  { id: "101", title: "فلوشیپ اینترونشنال کاردیولوژی" },
  { id: "102", title: "فلوشیپ اکوکاردیوگرافی" },
  { id: "103", title: "فلوشیپ جراحی زانو" },
  { id: "104", title: "فلوشیپ سم‌شناسی" },
];

const CLINICS: Clinic[] = [
  { id: "501", title: 120, latitude: 35.7219, longitude: 51.3347 },
  { id: "502", title: 130, latitude: 35.7, longitude: 51.4 },
];

const FIRST_NAMES = [
  "Amir",
  "Sara",
  "Mohammad",
  "Elena",
  "Mehdi",
  "Zahra",
  "Arash",
  "Niloufar",
];
const LAST_NAMES = [
  "Safari",
  "Rossi",
  "Ahmadi",
  "Bianchi",
  "Kermani",
  "Ricci",
  "Hosseini",
];
const IMAGES = [
  "https://i.pravatar.cc/150?u=1",
  "https://i.pravatar.cc/150?u=2",
  "https://i.pravatar.cc/150?u=3",
  "https://i.pravatar.cc/150?u=4",
  "https://i.pravatar.cc/150?u=5",
];

export const seedServices = (): Service[] => [
  {
    id: "1",
    label: "پزشک قلب",
    expertiseLevel: "speciality",
    fellowships: [FELLOWSHIPS[0]!, FELLOWSHIPS[1]!],
    price: 100000,
  },
  {
    id: "2",
    label: "پزشک متخصص ریه",
    expertiseLevel: "speciality",
    fellowships: [],
    price: 200000,
  },
  {
    id: "3",
    label: "متخصص ارتوپدی",
    expertiseLevel: "sub-speciality",
    fellowships: [FELLOWSHIPS[2]!],
    price: 300000,
  },
  {
    id: "4",
    label: "متخصص مغز و اعصاب",
    expertiseLevel: "speciality",
    fellowships: [],
    price: 100000,
  },
  {
    id: "5",
    label: "متخصص گوش، حلق و بینی",
    expertiseLevel: "speciality",
    fellowships: [],
    price: 200000,
  },
  {
    id: "6",
    label: "چشم پزشک",
    expertiseLevel: "speciality",
    fellowships: [FELLOWSHIPS[3]!],
    price: 400000,
  },
];

export interface ProvidersSeedParams {
  serviceId: string;
  page: number;
  pageSize: number;
  search?: string;
}

const MAX_PAGES = 5;

export const seedProviders = (
  params: ProvidersSeedParams,
): { data: Provider[]; hasNextPage: boolean } => {
  const { serviceId, page, pageSize } = params;
  if (page > MAX_PAGES) return { data: [], hasNextPage: false };

  const services = seedServices();
  const service = services.find((s) => s.id === serviceId) ?? services[0]!;

  const data: Provider[] = Array.from({ length: pageSize }).map(() => ({
    id: String(Math.floor(Math.random() * 10000)),
    name: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]!,
    lastName: LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]!,
    isOnline: Math.random() > 0.5,
    lastSeen: new Date(),
    imageUrl: IMAGES[Math.floor(Math.random() * IMAGES.length)]!,
    phoneNumber: "0913" + Math.floor(1000000 + Math.random() * 9000000),
    isActive: true,
    birthDate: new Date(1990, 0, 1),
    unreadCount: 0,
    serviceType: "chat",
    userType: ["business"],
    expertise: service.label,
    type: "public",
    service,
    clinics: [CLINICS[0]!],
    fellowships: service.fellowships,
  }));

  return { data, hasNextPage: page < MAX_PAGES };
};
