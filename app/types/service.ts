import type { Contact } from "./chat";
import type { Invoice } from "./invoice";
import type { Clinic } from "./clinic";
import type { Illness } from "./medic";

export type InsitutionType = "public" | "private" | "semi-public";

export interface Fellowship {
  id: string;
  title: string;
}

export interface Provider extends Contact {
  expertise: string;
  service: Service;
  clinics: Clinic[];
  fellowships: Fellowship[];
  type: InsitutionType;
  illnesses?: Illness[];
}

export interface Service {
  id: string;
  icon?: string;
  label: string;
  fellowships: Fellowship[];
  expertiseLevel: "speciality" | "sub-speciality";
  price: number;
}
