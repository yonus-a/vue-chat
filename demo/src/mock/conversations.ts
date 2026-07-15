// ============= TYPES =============
export type MessageType = "text" | "image" | "file" | "voice" | "video";
export type status = "pending" | "approved" | "rejected" | "expired";
export type ServicePresence = "online" | "on-site";
export type UserRoleKey = "user" | "employee" | "business" | "support";
export type StateKeys = "" | "online" | "ended" | "active";

export interface Message {
  id: string;
  conversationId: string;
  date: Date;
  type: MessageType;
  text?: string;
  imageUrl?: string[];
  fileUrl?: string;
  voiceUrl?: string;
  videoUrl?: string;
  isEdited: boolean;
  senderId: string;
  isSent: boolean;
  isRead: boolean;
  repliedTo?: Message;
  request?: string;
}

export interface Contact {
  id: string;
  name: string;
  lastName: string;
  isOnline: boolean;
  lastSeen: Date;
  imageUrl: string;
  nationalCode?: string;
  phoneNumber?: string;
  isActive: boolean;
  birthDate: Date;
  lastMessage?: Message;
  unreadCount?: number;
  serviceType?: "video-call" | "voice-call" | "chat";
  userType: UserRoleKey[];
}

export interface FetchContactsParams {
  page: number;
  pageSize: number;
  state: StateKeys;
  search?: string;
}

export interface ContactsPage {
  data: Contact[];
  hasNextPage: boolean;
}

// ============= SEED-BASED RANDOM =============
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return this.seed / 2147483647;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// ============= DATA POOLS =============
const FIRST_NAMES = [
  "علی",
  "محمد",
  "حسین",
  "رضا",
  "امیر",
  "سعید",
  "مهدی",
  "احمد",
  "فاطمه",
  "زهرا",
  "مریم",
  "سارا",
  "نازنین",
  "لیلا",
  "شیما",
  "مهسا",
  "پویا",
  "آرش",
  "نیما",
  "دانیال",
  "الهام",
  "نسرین",
  "پریسا",
  "مینا",
] as const;

const LAST_NAMES = [
  "محمدی",
  "حسینی",
  "رضایی",
  "احمدی",
  "کریمی",
  "موسوی",
  "هاشمی",
  "جعفری",
  "صادقی",
  "نوری",
  "عباسی",
  "امیری",
  "اکبری",
  "فرهادی",
  "بهرامی",
  "قاسمی",
  "طاهری",
  "نجفی",
  "مرادی",
  "یوسفی",
] as const;

const TEXT_MESSAGES = [
  "سلام، وقت بخیر",
  "ممنون بابت پیگیری",
  "بله، مشکلی نیست",
  "لطفاً زمان بیشتری بدید",
  "فایل رو فرستادم، چک کنید",
  "جلسه فردا سر ساعت ۱۰ برگزار میشه",
  "آیا امکان تغییر زمان وجود داره؟",
  "پروژه آماده است و میتونید بررسی کنید",
  "لطفاً صورت‌حساب رو ارسال کنید",
  "با تشکر از همکاری خوبتون",
  "سلام، وضعیت سفارش من چیه؟",
  "من منتظر پاسخ شما هستم",
  "آیا این محصول موجود هست؟",
  "قیمت نهایی چقدر میشه؟",
  "لطفاً آدرس رو بفرستید",
  "مورد تایید شد",
  "نیاز به revision بیشتری داره",
  "خسته نباشید",
  "ممنون، عالی بود",
  "فردا تماس میگیرم",
] as const;

const IMAGE_URLS = [
  "https://picsum.photos/seed/img1/400/300",
  "https://picsum.photos/seed/img2/400/300",
  "https://picsum.photos/seed/img3/400/300",
  "https://picsum.photos/seed/img4/400/300",
  "https://picsum.photos/seed/img5/400/300",
] as const;

const FILE_NAMES = [
  "report.pdf",
  "invoice.xlsx",
  "contract.docx",
  "design.fig",
  "presentation.pptx",
  "data.csv",
  "proposal.pdf",
] as const;

const AVATAR_URLS = Array.from(
  { length: 20 },
  (_, i) => `https://i.pravatar.cc/150?img=${i + 1}`,
);

const USER_TYPES: readonly UserRoleKey[] = [
  "user",
  "employee",
  "business",
  "support",
] as const;

const SERVICE_TYPES: readonly ("chat" | "video-call" | "voice-call")[] = [
  "chat",
  "video-call",
  "voice-call",
] as const;

const PHONE_PREFIXES = [
  "0912",
  "0919",
  "0935",
  "0936",
  "0937",
  "0921",
  "0922",
] as const;

// ============= GENERATORS =============

function generateNationalCode(rng: SeededRandom): string {
  return Array.from({ length: 10 }, () => rng.nextInt(0, 9)).join("");
}

function generatePhoneNumber(rng: SeededRandom): string {
  const prefix = rng.pick(PHONE_PREFIXES);
  const suffix = Array.from({ length: 7 }, () => rng.nextInt(0, 9)).join("");
  return `${prefix}${suffix}`;
}

function generateBirthDate(rng: SeededRandom): Date {
  const jYear = rng.nextInt(1360, 1378);
  const month = rng.nextInt(1, 12);
  const day = rng.nextInt(1, 28);
  return new Date(jYear + 621, month - 1, day);
}

function generateMessage(
  rng: SeededRandom,
  conversationId: string,
  senderId: string,
  date: Date,
): Message {
  const typeRoll = rng.next();

  const base: Message = {
    id: `msg-${conversationId}-${rng.nextInt(10000, 99999)}`,
    conversationId,
    date,
    type: "text" as MessageType,
    isEdited: rng.next() < 0.1,
    senderId,
    isSent: rng.next() < 0.7,
    isRead: rng.next() < 0.5,
  };

  if (typeRoll < 0.65) {
    base.type = "text" as MessageType;
    base.text = rng.pick(TEXT_MESSAGES);
  } else if (typeRoll < 0.75) {
    base.type = "image" as MessageType;
    base.imageUrl = [rng.pick(IMAGE_URLS)];
    base.text = rng.pick(["این عکس رو ببینید", "", "برای بررسی"]);
  } else if (typeRoll < 0.85) {
    base.type = "file" as MessageType;
    const fileName = rng.pick(FILE_NAMES);
    base.fileUrl = `https://example.com/files/${fileName}`;
    base.text = `فایل ${fileName} رو ارسال کردم`;
  } else if (typeRoll < 0.93) {
    base.type = "voice" as MessageType;
    base.voiceUrl = "https://example.com/voice/msg.mp3";
    base.text = "پیام صوتی";
  } else {
    base.type = "video" as MessageType;
    base.videoUrl = "https://example.com/video/msg.mp4";
    base.text = "پیام ویدیویی";
  }

  return base;
}

function generateContact(rng: SeededRandom, index: number): Contact {
  const id = `contact-${index}`;
  const isOnline = rng.next() < 0.4;
  const isActive = rng.next() < 0.8;
  const now = new Date();

  const lastSeenMinutes = isOnline
    ? rng.nextInt(1, 30)
    : rng.nextInt(60, 10080);
  const lastSeen = new Date(now.getTime() - lastSeenMinutes * 60 * 1000);

  const lastMessageMinutes = rng.nextInt(1, 1440);
  const lastMessageDate = new Date(
    now.getTime() - lastMessageMinutes * 60 * 1000,
  );

  return {
    id,
    name: rng.pick(FIRST_NAMES),
    lastName: rng.pick(LAST_NAMES),
    isOnline,
    lastSeen,
    imageUrl: AVATAR_URLS[index % AVATAR_URLS.length] as any,
    nationalCode: generateNationalCode(rng),
    phoneNumber: generatePhoneNumber(rng),
    isActive,
    birthDate: generateBirthDate(rng),
    lastMessage: generateMessage(rng, id, id, lastMessageDate),
    unreadCount: rng.next() < 0.4 ? rng.nextInt(1, 15) : 0,
    serviceType: rng.next() < 0.5 ? rng.pick(SERVICE_TYPES) : undefined,
    userType: [rng.pick(USER_TYPES)],
  };
}

// ============= CONTACT POOL =============

const TOTAL_CONTACTS = 100;
let contactPool: Contact[] | null = null;

function getContactPool(): Contact[] {
  if (!contactPool) {
    contactPool = Array.from({ length: TOTAL_CONTACTS }, (_, i) =>
      generateContact(new SeededRandom(i * 7919 + 1), i),
    );
  }
  return contactPool;
}

export function resetContactPool(): void {
  contactPool = null;
}

// ============= FETCH CONVERSATIONS =============

export function createMockFetchConversations() {
  return async (params: FetchContactsParams): Promise<ContactsPage> => {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));

    const { page, pageSize, state, search } = params;
    console.log(params);

    let filtered = [...getContactPool()];

    // Filter by state
    if (state === "online") {
      filtered = filtered.filter((c) => c.isOnline);
    } else if (state === "ended") {
      filtered = filtered.filter((c) => !c.isActive);
    } else if (state === "active") {
      filtered = filtered.filter((c) => c.isActive);
    }

    // Filter by search
    if (search?.trim()) {
      const q = search.trim();
      filtered = filtered.filter(
        (c) =>
          c.name.includes(q) ||
          c.lastName.includes(q) ||
          `${c.name} ${c.lastName}`.includes(q) ||
          c.phoneNumber?.includes(q) ||
          c.nationalCode?.includes(q) ||
          c.lastMessage?.text?.includes(q),
      );
    }

    // Sort by last message date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.lastMessage?.date ?? 0).getTime() -
        new Date(a.lastMessage?.date ?? 0).getTime(),
    );

    // 1-indexed pagination (matches chatStore's page semantics)
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: filtered.slice(start, end),
      hasNextPage: end < filtered.length,
    };
  };
}

// ============= DELETE CONVERSATION =============

export function createMockDeleteConversation() {
  return async (id: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 150));

    const pool = getContactPool();
    const index = pool.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error(`Conversation "${id}" not found`);
    }

    pool.splice(index, 1);
  };
}

// ============= FACTORY =============

export function createMockChatHelpers() {
  return {
    fetchConversations: createMockFetchConversations(),
    deleteConversation: createMockDeleteConversation(),
  };
}
