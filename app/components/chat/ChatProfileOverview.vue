<template>
    <div class="  transition-none md:transition-all duration-300 ease-in-out h-full overflow-hidden rtl:border-l-surface-variant ltr:border-surface-variant ltr:border-r rtl:border-l bg-surface shrink-0"
        :class="[isOpen ? ' w-dvw md:w-80' : 'w-0 border-none!']">
        <div class=" w-full h-full flex flex-col">
            <div class=" flex flex-col md:pt-16.5 md:px-2 w-full h-full">
                <div class=" shrink-0 w-full  relative">
                    <div class=" w-full h-29">
                        <BImage
                            class=" md:rounded-xl overflow-hidden w-full h-full max-w-full min-w-full max-h-full min-h-full"
                            :src="profileBackground">
                            <div class=" w-full h-full p-2">
                                <BIcon icon="PhX" class=" fill-white w-5 h-5 cursor-pointer" @click="closeSidebar" />
                            </div>
                        </BImage>
                    </div>
                    <div class=" w-full absolute z-20 flex justify-center items-center -translate-y-1/2">
                        <div class=" w-25 h-25 rounded-full overflow-hidden">
                            <ContactAvatar v-if="profile" :contact="profile" />
                        </div>
                    </div>
                    <div class=" h-12.5 w-full"></div>
                </div>
                <div class=" shrink-0 w-full mt-2 flex flex-col items-center select-none justify-center gap-y-2">
                    <div v-loading="isLoading" class=" text-title-md text-on-surface">{{ localProfile.name }}</div>
                    <BLabel v-loading="isLoading" color="primary" :text="t('chat.online')"
                        v-if="localProfile.isOnline" />
                </div>
                <div class=" shrink-0 w-full px-6">
                    <div class=" w-full py-4 flex items-center justify-center gap-x-2">
                        <div v-loading="isLoading" @click="handleAction(action)"
                            class=" w-15.5 aspect-square flex items-center flex-col gap-y-0.5 justify-center rounded-xl bg-surface-variant transition-all duration-200 ease-in-out"
                            v-for="action in actionButtons" :key="action.key"
                            :class="[action.active ? 'opacity-100 cursor-pointer' : ' cursor-not-allowed opacity-50']">
                            <BIcon :class="[action.color === 'error' ? 'fill-error' : 'fill-primary']" class="  w-6 h-6"
                                :icon="action.icon" weight="fill" />
                            <div class=" text-center text-on-surface text-[10px] select-none">{{ action.title }}
                            </div>
                        </div>
                    </div>
                    <div class=" w-full ">
                        <div class=" h-0.5 bg-surface-variant rounded-full w-full"></div>
                    </div>
                    <div class=" w-full flex flex-col gap-y-4 py-4">
                        <div v-for="(info, index) in displayedInfo" :key="index"
                            class=" w-full flex flex-col select-none gap-y-1">
                            <div v-loading="isLoading" class=" text-body-sm text-on-surface/50">{{ info.title }}</div>
                            <div v-loading="isLoading" class=" text-body-md text-on-surface">{{ info.value }}</div>
                        </div>
                    </div>
                </div>
                <div class=" w-full flex-1 flex flex-col min-h-0 select-none">
                    <div v-if="!shouldShowTabs" class=" flex min-h-0 flex-col gap-y-1 w-full h-full">
                        <div v-if="fileAttachements.length > 0" class=" w-full shrink-0 flex flex-col gap-y-1">
                            <div class=" text-on-surface/50 text-body-sm">{{ t('chat.info.files') }}</div>
                            <FileDisplay :loading="isLoadingAttachements" v-for="(file, index) in fileAttachements"
                                :key="index" :url="file" />
                        </div>
                        <div v-if="mediaAttachements.length > 0" class=" flex-1 flex-col gap-y-1">
                            <div class=" shrink-0 text-on-surface/50 text-body-sm">{{ t('chat.info.media') }}</div>
                            <div class=" flex-1 w-full " ref="imagesSection">
                                <div class=" w-full grid grid-cols-4 gap-x-4 gap-y-3 ">
                                    <div v-for="(media, index) in mediaAttachements" :key="index"
                                        class=" aspect-square md:w-14 md:h-14 overflow-hidden rounded-xl">
                                        <BImage :src="media"
                                            class=" w-full h-full min-w-full max-w-full max-h-full min-h-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class=" w-full min-h-0 h-full flex flex-col gap-y-2">
                        <BTab v-model="currentTab" :tabs="tabs" class="min-h-0 shrink-0" />
                        <div class=" w-full overflow-hidden flex-1 min-h-0">
                            <div :class="[currentTab === 0 ? ' translate-x-0' : ' ltr:-translate-x-1/2 rtl:translate-x-1/2']"
                                class=" flex transition-all min-h-0 duration-200 ease-in-out w-[200%] h-full">

                                <div class=" h-full min-h-0 w-1/2 px-1">
                                    <BVirtualVerticalList :items="chunkedMedia" :loading="isLoadingMedia"
                                        :has-next-page="hasMediaNextPage" @load-more="fetchMoreMedia">
                                        <template #item="{ item: row }">
                                            <div class="w-full grid grid-cols-4 gap-4 pb-3">
                                                <div v-for="(media, idx) in row" :key="idx"
                                                    class=" aspect-square md:w-14 md:h-14 overflow-hidden rounded-xl">
                                                    <BImage :src="media"
                                                        class="w-full h-full min-w-full max-w-full max-h-full min-h-full" />
                                                </div>
                                            </div>
                                        </template>
                                    </BVirtualVerticalList>
                                </div>

                                <div class=" h-full min-h-0 w-1/2 px-1">
                                    <BVirtualVerticalList :items="fileAttachements" :loading="isLoadingAttachements"
                                        :has-next-page="hasFileNextPage" @load-more="fetchMoreFiles">
                                        <template #item="{ item: file }">
                                            <div class="pb-2">
                                                <FileDisplay :loading="isLoadingAttachements && currentFilePage === 0"
                                                    :url="file" />
                                            </div>
                                        </template>
                                    </BVirtualVerticalList>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
// @ts-nocheck — grandfathered legacy chat-tree type errors; lift incrementally
import { defineComponent, type PropType, ref, watch, onMounted } from 'vue';
import type { Contact } from '~/types/chat';
import { useDate, useI18n, useCallStore, useChatStore } from '~/nuxt-shims';
import profileBackground from '~/assets/lib-images/chat/profile-background.webp'
import ContactAvatar from './contact/ContactAvatar.vue';
import FileDisplay from './profile/FileDisplay.vue';

interface Action {
    title: string;
    icon: string;
    key: 'end' | 'refer' | 'voice-call' | 'video-call';
    active: boolean | null;
    color?: string;
}

export default defineComponent({
    name: 'ChatProfileOverview',
    props: {
        profile: {
            type: Object as PropType<Contact | null>,
            required: true,
        }
    },
    components: {
        ContactAvatar,
        FileDisplay,
    },
    setup(props) {
        const { getYearsPassed } = useDate()
        const callStore = useCallStore()
        const { t } = useI18n()
        const chatStore = useChatStore()
        const imageList = ref<HTMLElement | null>(null)
        const isLoadingAttachements = ref(false)
        const isLoadingMedia = ref(false)
        const hasMediaNextPage = ref(false)
        const hasFileNextPage = ref(false)
        const currentFilePage = ref(0)
        const currentMediaPage = ref(1)

        const role = computed(() => chatStore.chosenRole)
        const listHeight = computed(() => {
            if (!imageList.value) return 12;
            return imageList.value.clientHeight;
        })
        const maxImageCounts = computed(() => {
            return Math.max(Math.floor(listHeight.value / 62) * 4, 12);
        });
        const imagesPerPage = computed(() => maxImageCounts.value * 4)
        const filesPerPage = computed(() => maxImageCounts.value)
        const maxFileCounts = ref(2)
        const tabs = computed(() => [t('chat.info.media'), t('chat.info.files')])
        const currentTab = ref(0)
        const shouldShowTabs = computed(() => fileAttachements.value.length > maxFileCounts.value || mediaAttachements.value.length > maxImageCounts.value)


        const mockProfile = ref<Contact>(
            {
                id: 1,
                name: "امیر",
                lastName: "سعیدی",
                isOnline: true,
                lastSeen: new Date(),
                imageUrl: "https://i.pravatar.cc/150?u=1",
                isActive: false,
                unreadCount: 2,
                serviceType: "chat",
                birthDate: new Date(),
                phoneNumber: "09134168227",
                nationalCode: "1235678901",
                lastMessage: {
                    id: 101,
                    conversationId: 1,
                    date: new Date(new Date().getTime() - 1000 * 60 * 5),
                    type: "text",
                    text: "سلام، وقت بخیر؟",
                    senderId: 1,
                    isEdited: false,
                    isSent: true,
                    isRead: false,
                },
            },
        )

        const isOpen = ref(false)
        const localProfile = ref<Contact>(
            mockProfile.value
        )


        const isInCall = computed(() => callStore.isActive)

        const actionButtons = computed((): Action[] => [
            {
                title: t('chat.options.end'),
                icon: 'PhX',
                active: localProfile.value == undefined ? false : localProfile.value?.isActive,
                key: 'end',
                color: 'error'
            },
            {
                title: t('chat.options.refer'),
                icon: 'PhTreeStructure',
                active: localProfile.value == undefined ? false : localProfile.value?.isActive,
                key: 'refer'
            },
            {
                title: t('chat.options.voiceCall'),
                icon: 'PhPhoneCall',
                active: localProfile.value == undefined || isInCall.value ? false : localProfile.value?.isActive && (localProfile.value.serviceType !== 'chat'),
                key: 'voice-call'
            },
            {
                title: t('chat.options.videoCall'),
                icon: 'PhVideoCamera',
                active: localProfile.value == undefined || isInCall.value ? false : localProfile.value?.isActive && localProfile.value.serviceType === 'video-call',
                key: 'video-call'
            },
        ])

        // Watch the store to open/close the profile sidebar
        watch(() => chatStore.profileViewOpen, (isProfileOpen) => {
            if (isProfileOpen) {
                // FIX: Populate local data immediately when opening 
                // This prevents the blank screen when reopening the same profile
                if (props.profile) {
                    localProfile.value = props.profile
                }
                isOpen.value = true
            } else {
                isOpen.value = false
                // Wait for animation to finish before clearing local data
                setTimeout(() => {
                    // Only clear if the sidebar is still closed (prevents race conditions)
                    if (!isOpen.value) {
                        localProfile.value = mockProfile.value
                    }
                }, 300)
            }
        }, { immediate: true })

        // Update localProfile if the user switches chats while the sidebar is already open
        watch(() => props.profile, (newVal) => {
            if (newVal) {
                localProfile.value = newVal
            }
        })

        const isLoading = computed(() => props.profile === null)


        const closeSidebar = () => {
            chatStore.closeProfile()
        }


        const fileAttachements = ref<string[]>(new Array(imagesPerPage.value).fill(''));
        const mediaAttachements = ref<string[]>(new Array(filesPerPage.value).fill(''));
        const showPersonalInfo = computed(() => role.value !== 'user')

        const handleAction = (action: Action) => {
            if (!action.active) return
            switch (action.key) {
                case 'end':

                    break;
                case 'refer':

                    break;
                case 'voice-call':
                case 'video-call':
                    callStore.startCall(props.profile, props.profile?.serviceType)
                    break;
            }
        }

        const chunkedMedia = computed(() => {
            const rows = [];
            for (let i = 0; i < mediaAttachements.value.length; i += 4) {
                rows.push(mediaAttachements.value.slice(i, i + 4));
            }
            return rows;
        });

        // Mock API Functions
        const fetchMoreMedia = async () => {
            if (isLoadingMedia.value || !hasMediaNextPage.value) return;
            isLoadingMedia.value = true;

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get the length from the computed property
            const count = imagesPerPage.value

            const newMedia = Array.from({ length: count }).map((_, i) =>
                `https://picsum.photos/id/${110 + (currentMediaPage.value * count) + i}/400/400`
            );

            // If we only have empty strings (initial state), replace them.
            // Otherwise, append the new page.
            if (mediaAttachements.value.length > 0 && mediaAttachements.value.every(i => i === '')) {
                mediaAttachements.value = newMedia;
            } else {
                mediaAttachements.value.push(...newMedia);
            }

            currentMediaPage.value++;
            if (currentMediaPage.value >= 5) hasMediaNextPage.value = false;
            isLoadingMedia.value = false;
        };

        const fetchMoreFiles = async () => {
            if (isLoadingAttachements.value || !hasFileNextPage.value) return;
            isLoadingAttachements.value = true;

            // Mock API Delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const count = filesPerPage.value;

            // Procedurally populate with the same URL as requested
            const newFiles = new Array(count).fill('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

            // Procedural swap if we are in the initial skeleton state
            if (fileAttachements.value === '') {
                fileAttachements.value = newFiles;
            } else {
                fileAttachements.value.push(...newFiles);
            }

            currentFilePage.value++;

            // End pagination after 4 pages
            if (currentFilePage.value >= 4) hasFileNextPage.value = false;
            isLoadingAttachements.value = false;
        };
        onMounted(async () => {
            // Wait for DOM to paint so imageList.value has height
            await nextTick();


            // Populate with empty strings as initial value
            const initialCount = maxImageCounts.value;
            mediaAttachements.value = Array(initialCount).fill('');

            // Trigger the first actual data load
            hasMediaNextPage.value = true;
            hasFileNextPage.value = true;
            fetchMoreMedia();
            fetchMoreFiles()
        });

        const displayedInfo = computed(() => {
            let items = [
                {
                    title: t('chat.info.nationalCode'),
                    value: localProfile.value?.nationalCode,
                    canDisplay: showPersonalInfo.value
                },
                {
                    title: t('chat.info.phoneNumber'),
                    value: localProfile.value?.phoneNumber,
                    canDisplay: showPersonalInfo.value
                },
                {
                    title: t('chat.info.age'),
                    value: getYearsPassed(localProfile.value?.birthDate || new Date()),
                    canDisplay: true
                },
            ]

            return items.filter((item) => item.canDisplay)
        })


        return {
            isOpen,
            localProfile,
            t,
            closeSidebar,
            profileBackground,
            actionButtons,
            handleAction,
            displayedInfo,
            showPersonalInfo,
            isLoading,
            mediaAttachements,
            fileAttachements,
            tabs,
            currentTab,
            imageList,
            shouldShowTabs,
            chunkedMedia,
            fetchMoreMedia,
            fetchMoreFiles,
            isLoadingAttachements,
            isLoadingMedia,
            hasMediaNextPage,
            currentMediaPage,
            currentFilePage,
            hasFileNextPage,
        }

    }
})
</script>
