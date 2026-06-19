import type { Contact, FilterKeys, Message, MessageType } from "~/types/chat";

const now = new Date();

const getRandomBirthDate = (): Date => {
  const yearsAgo = Math.floor(Math.random() * (50 - 18 + 1)) + 18;
  const d = new Date();
  d.setFullYear(now.getFullYear() - yearsAgo);
  d.setMonth(Math.floor(Math.random() * 12));
  d.setDate(Math.floor(Math.random() * 28) + 1);
  return d;
};

const buildPool = (currentUserId: string): Contact[] => {
  const basePool: Contact[] = [
    {
      id: "1",
      name: "امیر",
      lastName: "سعیدی",
      isOnline: true,
      lastSeen: now,
      imageUrl: "https://i.pravatar.cc/150?u=1",
      isActive: false,
      unreadCount: 2,
      serviceType: "chat",
      userType: ["user"],
      birthDate: getRandomBirthDate(),
      phoneNumber: "09134168227",
      nationalCode: "1235678901",
      lastMessage: {
        id: "101",
        conversationId: "1",
        date: new Date(now.getTime() - 1000 * 60 * 5),
        type: "text",
        text: "سلام، وقت بخیر؟",
        senderId: "1",
        isEdited: false,
        isSent: true,
        isRead: false,
      } as Message,
    },
    {
      id: "2",
      name: "سارا",
      lastName: "احمدی",
      isOnline: false,
      lastSeen: new Date(now.getTime() - 3600000),
      imageUrl: "https://i.pravatar.cc/150?u=2",
      isActive: true,
      unreadCount: 0,
      serviceType: "voice-call",
      userType: ["user"],
      birthDate: getRandomBirthDate(),
      phoneNumber: "09134168227",
      nationalCode: "1235678901",
      lastMessage: {
        id: "102",
        conversationId: "2",
        date: new Date(now.getTime() - 1000 * 3600 * 2),
        type: "text",
        text: "بله، فایل رو بررسی کردم.",
        senderId: currentUserId,
        isEdited: false,
        isSent: true,
        isRead: true,
      } as Message,
    },
  ];

  const pool: Contact[] = [];
  for (let i = 0; i < 70; i++) {
    const template = basePool[i % basePool.length] as Contact;
    const uniqueId = i + 1;
    const messageDate = new Date(
      now.getTime() - Math.floor(Math.random() * 10000) * 60000,
    );
    pool.push({
      ...template,
      id: String(uniqueId),
      name: `${template.name} ${uniqueId}`,
      lastMessage: template.lastMessage
        ? ({
            ...template.lastMessage,
            id: String(10000 + uniqueId),
            conversationId: String(uniqueId),
            date: messageDate,
          } as Message)
        : undefined,
    });
  }
  return pool;
};

export interface ContactsSeedParams {
  filter: FilterKeys;
  page: number;
  pageSize: number;
  search?: string;
  currentUserId?: string;
}

export const seedContacts = (
  params: ContactsSeedParams,
): { data: Contact[]; hasNextPage: boolean } => {
  const { filter, page, pageSize, search, currentUserId = "1" } = params;
  const pool = buildPool(currentUserId);

  let filtered = pool;
  if (search) {
    const q = search.toLowerCase();
    filtered = pool.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q),
    );
  }
  if (filter === "online") filtered = filtered.filter((c) => c.isOnline);
  if (filter === "active") filtered = filtered.filter((c) => c.isActive);
  if (filter === "ended") filtered = filtered.filter((c) => !c.isActive);

  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, hasNextPage: data.length >= pageSize };
};

export interface MessagesSeedParams {
  conversationId: string;
  page: number;
  pageSize: number;
  currentUserId?: string;
}

export const seedMessages = (params: MessagesSeedParams): Message[] => {
  const { conversationId, page, pageSize, currentUserId = "1" } = params;
  const out: Message[] = [];
  const scenarios: MessageType[] = ["text", "text", "text", "image"];

  for (let i = 0; i < pageSize; i++) {
    const globalIndex = (page - 1) * pageSize + i;
    const id = String(parseInt(conversationId, 10) * 1000 + globalIndex);
    const isMe = Math.floor(globalIndex / 2) % 2 === 0;
    const senderId = isMe ? currentUserId : "2";
    const scenario = scenarios[globalIndex % scenarios.length]!;
    const messageDate = new Date(Date.now() - globalIndex * 5 * 60 * 1000);

    out.push({
      id,
      conversationId,
      date: messageDate,
      type: scenario,
      text:
        scenario === "text"
          ? `Message ${id}: ${isMe ? "Sent by me." : "Received from them."}`
          : undefined,
      imageUrl:
        scenario === "image"
          ? [`https://picsum.photos/600/600?sig=${id}`]
          : undefined,
      isEdited: parseInt(id, 10) % 8 === 0,
      senderId,
      isSent: true,
      isRead: isMe ? true : globalIndex > 3,
    } as Message);
  }
  return out;
};
