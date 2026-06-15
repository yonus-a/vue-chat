export type MedicationPeriodType = "day" | "hour";

export interface MedicationBrand {
  id: number;
  title: String;
}

export interface MedicationUsagePeriod {
  period: MedicationPeriodType;
  amount: number;
}

export interface Medication {
  id: number;
  title: String;
  englishTitle: String;
  brands: MedicationBrand[];
}

export interface PrescribedMedication {
  id: number;
  medication: Medication;
  repetitionAmount: String;
  usageMethod: String;
  dose: String;
  period: MedicationUsagePeriod;
  warning?: String;
}
