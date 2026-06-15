import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Message, Contact, FilterKeys, UserRoleKey } from "~/types/chat";
import { useWindowSize } from "~/composables/useWindowSize";

export const useChatStore = defineStore("chat", () => {
  const { height: windowHeight } = useWindowSize();

  // Dynamic Calculation based on screen height
  const chatsPerPage = computed(() => {
    const h = windowHeight.value || 800; // Fallback for initial SSR load
    return Math.floor((h - 138) / 76) + 1;
  });

  const now = new Date();

  // Helper for "28 years ago and few months/days"
  const getSpecificBirthDate = () => {
    const date = new Date();
    date.setFullYear(now.getFullYear() - 28);
    date.setMonth(now.getMonth() - (Math.floor(Math.random() * 11) + 1));
    date.setDate(now.getDate() - (Math.floor(Math.random() * 28) + 1));
    return date;
  };

  // Helper for random between 18 and 50 years ago
  const getRandomBirthDate = () => {
    const yearsAgo = Math.floor(Math.random() * (50 - 18 + 1)) + 18;
    const date = new Date();
    date.setFullYear(now.getFullYear() - yearsAgo);
    date.setMonth(Math.floor(Math.random() * 12));
    date.setDate(Math.floor(Math.random() * 28) + 1);
    return date;
  };

  // --- STATE ---
  const currentUserId = ref(1);
  const chosenRole = ref<UserRoleKey>("user");
  const currentUserBirthDate = ref<Date | null>(
    new Date("1999-11-25T00:00:00Z"),
  );
  const activeConversationId = ref<number | null>(null);
  const messagesMap = ref<Record<number, Message[]>>({});

  const conversationStates = ref<
    Record<
      FilterKeys,
      {
        data: Contact[];
        loading: boolean;
        page: number;
        hasNextPage: boolean;
      }
    >
  >({
    "": { data: [], loading: false, page: 0, hasNextPage: true },
    online: { data: [], loading: false, page: 0, hasNextPage: true },
    ended: { data: [], loading: false, page: 0, hasNextPage: true },
    active: { data: [], loading: false, page: 0, hasNextPage: true },
  });

  // --- MOCK DATA GENERATORS ---
  const generateManyMockContacts = (
    filter: FilterKeys,
    page: number,
    pageSize: number,
    search: string = "",
  ): Contact[] => {
    const myId = currentUserId.value;
    const now = new Date();

    const basePool: Contact[] = [
      {
        id: 1,
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
          id: 101,
          conversationId: 1,
          date: new Date(now.getTime() - 1000 * 60 * 5),
          type: "text",
          text: "سلام، وقت بخیر؟",
          senderId: 1,
          isEdited: false,
          isSent: true,
          isRead: false,
        },
      },
      // Adding a second fallback so array math works properly
      {
        id: 2,
        name: "سارا",
        lastName: "احمدی",
        isOnline: false,
        lastSeen: new Date(now.getTime() - 3600000),
        imageUrl: "https://i.pravatar.cc/150?u=2",
        isActive: true,
        unreadCount: 0,
        serviceType: "voice-call",
        userType: ["user"],
        birthDate: getSpecificBirthDate(),
        phoneNumber: "09134168227",
        nationalCode: "1235678901",
        lastMessage: {
          id: 102,
          conversationId: 2,
          date: new Date(now.getTime() - 1000 * 3600 * 2),
          type: "text",
          text: "بله، فایل رو بررسی کردم.",
          senderId: myId,
          isEdited: false,
          isSent: true,
          isRead: true,
        },
      },
    ];

    const largePool: Contact[] = [];

    // --- THE LOOP ---
    for (let i = 0; i < 70; i++) {
      // FIX 1: 'as Contact' strips away the strict 'undefined' TS error.
      const template = basePool[i % basePool.length] as Contact;
      const uniqueId = i + 1;
      const messageDate = new Date(
        now.getTime() - Math.floor(Math.random() * 10000) * 60000,
      );

      largePool.push({
        id: uniqueId,
        name: `${template.name} ${uniqueId}`,
        lastName: template.lastName,
        isOnline: template.isOnline,
        lastSeen: template.lastSeen,
        imageUrl: template.imageUrl,
        isActive: template.isActive,
        unreadCount: template.unreadCount,
        serviceType: template.serviceType,
        userType: template.userType,
        phoneNumber: template.phoneNumber,
        nationalCode: template.nationalCode,
        birthDate: template.birthDate,
        lastMessage: template.lastMessage
          ? {
              id: 10000 + uniqueId,
              conversationId: uniqueId,
              date: messageDate,
              type: template.lastMessage.type,
              text: template.lastMessage.text,
              imageUrl: template.lastMessage.imageUrl,
              fileUrl: template.lastMessage.fileUrl,
              voiceUrl: template.lastMessage.voiceUrl,
              isEdited: template.lastMessage.isEdited,
              senderId: template.lastMessage.senderId,
              isSent: template.lastMessage.isSent,
              isRead: template.lastMessage.isRead,
            }
          : undefined,
      });
    } // FIX 2: Loop securely closed here!

    // --- FILTER & RETURN OUTSIDE THE LOOP ---
    let filtered = largePool;
    if (search) {
      const query = search.toLowerCase();
      filtered = largePool.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.lastName.toLowerCase().includes(query),
      );
    }

    if (filter === "online") filtered = largePool.filter((c) => c.isOnline);
    if (filter === "active") filtered = largePool.filter((c) => c.isActive);
    if (filter === "ended") filtered = largePool.filter((c) => !c.isActive);

    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  };

  // --- ACTIONS ---

  const fetchConversations = async (
    filter: FilterKeys = "",
    page: number = 1,
    search: string = "", // Add this parameter
  ) => {
    const state = conversationStates.value[filter];
    if (state.loading) return;

    state.loading = true;
    try {
      await new Promise((r) => setTimeout(r, page === 1 ? 800 : 400));

      // Pass the search query to the generator
      const newData = generateManyMockContacts(
        filter,
        page,
        chatsPerPage.value,
        search, // Pass it down
      );

      if (page === 1) state.data = newData;
      else state.data = [...state.data, ...newData];

      state.page = page;
      state.hasNextPage = newData.length >= chatsPerPage.value;
    } finally {
      state.loading = false;
    }
  };

  const loadNextPage = async (filter: FilterKeys) => {
    const state = conversationStates.value[filter];
    if (state.hasNextPage && !state.loading) {
      await fetchConversations(filter, state.page + 1);
    }
  };

  const getDisplayedContacts = (filter: FilterKeys) => {
    const state = conversationStates.value[filter];

    // Show skeletons only if we haven't successfully loaded the first page yet
    if (state.loading && state.page === 0) {
      return Array.from(
        { length: chatsPerPage.value },
        (_, i) =>
          ({
            id: -i - 1,
            name: "در حال",
            lastName: "بارگذاری...",
            imageUrl: "https://i.pravatar.cc/150?u=loading",
            isOnline: false,
            lastSeen: new Date(),
            isActive: true,
            unreadCount: 0,
            serviceType: "chat",
            userType: ["user"],
            lastMessage: {
              id: -1,
              conversationId: -i - 1,
              date: new Date(),
              type: "text",
              text: "در حال بارگذاری پیام...",
              isEdited: false,
              senderId: -1,
              isSent: true,
              isRead: true,
            },
          }) as Contact,
      );
    }

    // --- SORTING LOGIC ---
    // We create a copy of the array and sort by date descending (Newest first)
    return [...state.data].sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.date).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.date).getTime() : 0;

      return dateB - dateA; // Sort newest to oldest
    });
  };

  const getContactById = (id: number): Contact | null => {
    // We check all categories because the user might have arrived
    // via the "Online" list or the "All" list.
    for (const key in conversationStates.value) {
      const contact = conversationStates.value[key as FilterKeys].data.find(
        (c) => c.id === id,
      );
      if (contact) return contact;
    }
    return null;
  };

  const markAsRead = (conversationId: number) => {
    for (const key in conversationStates.value) {
      const contact = conversationStates.value[key as FilterKeys].data.find(
        (c) => c.id === conversationId,
      );
      if (contact) {
        contact.unreadCount = 0;
        if (contact.lastMessage) {
          contact.lastMessage.isRead = true;
        }
      }
    }
  };

  // 2. Overwrite the last message (used when sending a new message)
  const updateLastMessage = (conversationId: number, message: Message) => {
    for (const key in conversationStates.value) {
      const state = conversationStates.value[key as FilterKeys];
      const contact = state.data.find((c) => c.id === conversationId);
      if (contact) {
        // Reassigning the object ensures Vue's computed sorting picks up the new date
        contact.lastMessage = { ...message };
      }
    }
  };

  // 3. Patch specific properties of the last message (used for edits, deletions, or ID swaps)
  const patchLastMessage = (
    conversationId: number,
    messageId: number,
    updates: Partial<Message>,
  ) => {
    for (const key in conversationStates.value) {
      const contact = conversationStates.value[key as FilterKeys].data.find(
        (c) => c.id === conversationId,
      );
      if (
        contact &&
        contact.lastMessage &&
        contact.lastMessage.id === messageId
      ) {
        contact.lastMessage = { ...contact.lastMessage, ...updates };
      }
    }
  };

  const unreadCount = computed(() => {
    // 1. Create a Set or Map to store unique contact IDs to avoid double-counting
    // across different filters (e.g., a contact appearing in both "All" and "Online")
    const uniqueContacts = new Map<number, Contact>();

    for (const key in conversationStates.value) {
      const state = conversationStates.value[key as FilterKeys];
      state.data.forEach((contact) => {
        if (!uniqueContacts.has(contact.id)) {
          uniqueContacts.set(contact.id, contact);
        }
      });
    }

    // 2. Filter the unique list for conversations where the last message is unread
    return Array.from(uniqueContacts.values()).filter((contact) => {
      return contact.lastMessage && contact.lastMessage.isRead === false;
    }).length;
  });

  return {
    currentUserId,
    chosenRole,
    currentUserBirthDate,
    conversationStates,
    activeConversationId,
    fetchConversations,
    loadNextPage,
    getDisplayedContacts,
    chatsPerPage,
    unreadCount,
    getContactById,
    messagesMap,
    markAsRead,
    updateLastMessage,
    patchLastMessage,
  };
});
