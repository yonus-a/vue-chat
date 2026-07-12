import type { Contact } from "./chat";

export type ShareTypes = "viewer" | "owner" | "editor";
export type EventCategory = "task" | "medicine" | "event" | "service";
export type RepetitionCycleType = "day" | "hour" | "custom";
export type RepetitionEndType = "date" | "times";

export type CalendarBusPayload =
  | { type: "delete"; id: number }
  | { type: "edit-event"; event: CalendarEventPayload }
  | { type: "share-event"; event: CalendarEventPayload }
  | { type: "share-calendar" }
  | {
      type: "update-event-access-master";
      eventId: number;
      userId: number;
      newAccess: any;
    }
  | { type: "remove-event-access-master"; eventId: number; userId: number }
  | { type: "add-event-access-master"; eventId: number; record: any }
  | { type: "remove-event-user-ui"; id: number };

export interface EventChecklistItem {
  id?: number;
  text: string;
  isChecked: boolean;
}

// Strictly types Step 3 Data
export interface EventRepetitionConfig {
  repetitionStart: string | Date;
  repetitionType: RepetitionCycleType;
  repeatTimeCycle: number;
  selectedDays?: number[]; // e.g., for Sunday, Tuesday, Thursday
  wholeDay: boolean;
  chosenTime: string;
  isReminder: boolean;
  selectedReminder?: number; // Minutes before
  repeatitionEnd: RepetitionEndType;
  repetitionAmount: string | number; // Date string if 'date', number if 'times'
}

// The Final Combined Payload from MainPopup.vue
export interface CalendarEventPayload {
  id?: number;

  // --- Step 1: Details ---
  eventType: EventCategory;
  title: string;
  description: string;
  // if a "user" was viewing the calendar use number[] but for provider users use Contact[]
  selectedUsers?: number[] | Contact[]; // Array of Contact IDs
  attachement?: string;
  color?: string;
  checkList?: EventChecklistItem[];

  // --- Step 2: Timing ---
  date: string | Date;
  time: string;
  isFullDay: boolean;
  hasRepetition: boolean;

  // --- Step 3: Repetition (Optional) ---
  repetition?: EventRepetitionConfig;
  endDate?: Date;
  duration?: number;
  accesss?: EventAccess[];
}

export interface EventAccess {
  id: number;
  user: Contact;
  accessType: ShareTypes;
}

export interface CalendarAccess extends Contact {
  accessType: ShareTypes;
}

export interface CalendarSettingsPayload {
  calendar: "jalaali" | "georgian" | "islamic";
  startOfWeek: string;
  timeZone: string;
  showHolidays: boolean;
  showAi: boolean;
  showMedicine: boolean;
  showServices: boolean;
  showTasks: boolean;
}
