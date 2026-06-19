export type MedicationPeriodType = "day" | "hour";

export interface MedicationBrand {
  id: string;
  title: String;
}

export interface MedicationUsagePeriod {
  period: MedicationPeriodType;
  amount: number;
}

export interface Medication {
  id: string;
  title: String;
  englishTitle: String;
  brands: MedicationBrand[];
}

export interface PrescribedMedication {
  id: string;
  medication: Medication;
  repetitionAmount: String;
  usageMethod: String;
  dose: String;
  period: MedicationUsagePeriod;
  warning?: String;
}
