import type { Medication } from "~/types/medication";

const POOL: Medication[] = [
  {
    id: "1",
    title: "استامینوفن",
    englishTitle: "Acetaminophen",
    brands: [
      { id: "101", title: "Calyptol" },
      { id: "102", title: "Panadol" },
    ],
  },
  {
    id: "2",
    title: "ایبوپروفن",
    englishTitle: "Ibuprofen",
    brands: [{ id: "201", title: "Advil" }],
  },
  {
    id: "3",
    title: "آموکسی‌سیلین",
    englishTitle: "Amoxicillin",
    brands: [{ id: "301", title: "Amoxil" }],
  },
  {
    id: "4",
    title: "آتورواستاتین",
    englishTitle: "Atorvastatin",
    brands: [{ id: "401", title: "Lipitor" }],
  },
  {
    id: "5",
    title: "متفورمین",
    englishTitle: "Metformin",
    brands: [{ id: "501", title: "Glucophage" }],
  },
];

export const seedMedications = (): Medication[] => POOL.map((m) => ({ ...m }));

export const seedMedicationSearch = (query: string): Medication[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return POOL.filter(
    (m) =>
      String(m.title).toLowerCase().includes(q) ||
      String(m.englishTitle).toLowerCase().includes(q),
  ).map((m) => ({ ...m }));
};
