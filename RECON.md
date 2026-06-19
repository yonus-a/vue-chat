# Reconnaissance Notes: PHC chat × @behayand/chat integration

Generated: 2026-06-19  
Scope: Task 1 (Phase A) — locks the two cross-boundary contracts needed by
Tasks 11, 13, and 15.

---

## 1. Attachment payload contract (library side)

### Where the blob lives

Non-text `Message` objects are constructed in **two paths** inside the library:

**Path A — image / file picks** (`InputAttachement.vue → ChatInput.vue`):

1. `v-image-pick` directive (`app/directives/imagePicker.ts:31-33`) creates a
   `blob:` URL via `URL.createObjectURL(file)` and passes `{ file, path }` objects
   to `handleMediaSelected`.
2. `v-file-pick` directive (`app/directives/filePicker.ts:23-28`) does the same
   and passes `{ file, name, path, format, size }` objects to `handleFilesSelected`.
3. `InputAttachement.vue:sendMessages` (lines 152–184) builds the emit payload:

   ```js
   // image
   { type: 'image', imageUrl: selectedMedia.value.map(m => m.path), files: selectedMedia.value.map(m => m.file) }

   // file
   { type: 'file', fileUrl: fileData.path, file: fileData.file, fileName: fileData.name }
   ```

4. `ChatInput.vue:handleAttachments` (lines 289–306) strips the raw `file`/`files`
   fields and maps only typed URL fields into a `Message`:

   ```js
   if (payload.type === 'image') msg.imageUrl = payload.imageUrl;   // string[] of blob: URLs
   if (payload.type === 'file')  msg.fileUrl  = payload.fileUrl;    // single blob: URL
   ```

   The `Message` that reaches `chatActionStore.sendMessage` therefore carries
   **blob: URLs** in `imageUrl`/`fileUrl` — the raw `File` objects are silently
   dropped at the `handleAttachments` boundary.

**Path B — voice / video recordings** (`ChatInput.vue:onSend`, lines 163–175):

   ```js
   msg.type = secondaryMessageType.value as any; // 'voice' | 'video'
   if (msg.type === 'voice') msg.voiceUrl = finalUrl;   // string returned by useChatRecording
   if (msg.type === 'video') msg.videoUrl = finalUrl;
   ```

   `finalUrl` comes from `useChatRecording`'s `onSend` callback — its nature
   (blob: URL, data: URL, or placeholder string) depends on that composable's
   implementation, but it arrives at `sendMessage` already as a string on the
   typed `Message` field.

### Summary: what `adapter.chatAction.sendMessage(msg)` receives

| msg.type | field populated | value type | raw File available? |
|----------|-----------------|------------|---------------------|
| `'image'` | `msg.imageUrl: string[]` | array of `blob:` URLs | **No** — dropped by handleAttachments |
| `'file'`  | `msg.fileUrl: string`    | single `blob:` URL    | **No** — dropped by handleAttachments |
| `'voice'` | `msg.voiceUrl: string`   | URL from useChatRecording | unknown at this layer |
| `'video'` | `msg.videoUrl: string`   | URL from useChatRecording | unknown at this layer |

**No `attachments` field** exists on `Message` — the spec's assumed
`(libMessage as any).attachments: { buffer, fileName, title, type }[]` shape
does NOT exist in this library.

### Key files

- `app/types/chat.ts:9-25` — `Message` interface (canonical field list)
- `app/directives/imagePicker.ts:31-33` — blob URL creation for images
- `app/directives/filePicker.ts:23-28` — blob URL creation for files
- `app/components/chat/chat-input/InputAttachement.vue:152-184` — sendMessages (blob URL in payload, raw File included here)
- `app/components/chat/ChatInput.vue:289-306` — handleAttachments (raw File stripped, only URL fields passed to sendMessage)
- `app/stores/createStores.ts:426-472` — sendMessage (calls adapter with the Message)
- `app/adapter/ports/ChatActionAdapter.ts:16` — `sendMessage(msg: Message, opts?)` adapter port

---

## 2. PHC call signaling wire format

Source files:
- `examples/phc-frontend/app/utils/enums/conjoint/channels/chat.enum.ts` — enum values
- `examples/phc-frontend/app/utils/types/chat.ts` — `CallMessageSchema` discriminated union
- `examples/phc-frontend/app/components/chat/Call.vue` — all publish() call sites
- `examples/phc-frontend/app/components/chat/VideoGrid.vue` — **no socket.publish calls**

### Enum values (verbatim)

```ts
export const enum CallMessageType {
  Signal    = 'signal',
  Join      = 'join',
  TrackType = 'track_type',
  Call      = 'call',
  Hangup    = 'hangup',
}
```

### Published message shapes (verbatim from publish() call sites)

**`type: 'call'`** — outgoing ring (callOtherSide, lines 388–402):
```json
{ "type": "call", "payload": { "from": "<userId>", "name": "<firstName lastName>", "channel": "<roomId>", "avatar": "<base64 data-url or undefined>" } }
```

**`type: 'join'`** — on mount after media init (lines 472–484):
```json
{ "type": "join", "payload": { "from": "<userId>", "name": "<firstName lastName>" } }
```

**`type: 'join'`** — also re-published on peer error (lines 344–357):
```json
{ "type": "join", "payload": { "from": "<userId>", "name": "<firstName lastName>" } }
```

**`type: 'signal'`** — WebRTC SDP/ICE signaling (peer 'signal' event, lines 312–327):
```json
{ "type": "signal", "payload": { "from": "<userId>", "to": "<remoteUserId>", "signal": "<SimplePeer SignalData>", "name": "<firstName lastName>" } }
```
Note: `signal` is a `SignalData` object from `simple-peer` (contains `sdp` for offer/answer, or ICE candidate fields). PHC uses a single `'signal'` type for both SDP offers/answers and ICE candidates — there is **no separate** `'offer'`, `'answer'`, or `'ice'` type string.

**`type: 'track_type'`** — announces local stream composition (lines 250–263, 434–447, 577–589):
```json
{ "type": "track_type", "payload": { "from": "<userId>", "types": [{ "id": "<streamId>", "type": "webcam|screen|audio|webcam_audio" }] } }
```
Published: on media init, in response to a `join` from a peer, and when screen share starts.

**`type: 'hangup'`** — end call (endCall, lines 681–693):
```json
{ "type": "hangup", "payload": { "from": "<userId>", "channel": "<roomId>" } }
```

### Type strings cheat-sheet

| Purpose | type string | payload keys |
|---|---|---|
| Outgoing ring | `'call'` | from, name, channel, avatar |
| Peer joined room | `'join'` | from, name |
| WebRTC signal (offer/answer/ICE) | `'signal'` | from, to, signal (SignalData), name |
| Announce stream tracks | `'track_type'` | from, types[]{id, type} |
| Hang up | `'hangup'` | from, channel |

All messages are JSON-serialized and published via `socket.publish(topic, JSON.stringify({...}))`.
The `topic` is the channel's MQTT topic (from `socketTopic()`).

---

## 3. Implications for downstream tasks

**Task 11 (ChatActionAdapter — `sendMessage`):**
The PHC adapter receives `msg.imageUrl: string[]` (blob: URLs) and `msg.fileUrl: string`
(blob: URL) — NOT an `attachments: { buffer, fileName, title, type }[]` array.
The spec's C1 mapper assumption is wrong. The adapter must fetch each blob URL
(`fetch(blobUrl).then(r => r.blob())`) or re-think how to get the raw binary.
For voice/video, `msg.voiceUrl` / `msg.videoUrl` arrive as strings (likely blob: URLs
from useChatRecording). The PHC upload endpoint expects binary data; the adapter must
convert blob: URL → `ArrayBuffer` or `Blob` before uploading.

**Task 13 (ChatActionAdapter — message type mapping):**
The Message types are `'text' | 'image' | 'file' | 'voice' | 'video'` (from
`app/types/chat.ts:4`). The adapter's type-mapping logic maps these to PHC's own
`ChatMessageType` enum (`'message'`, etc.). For media types, the adapter needs
to handle the blob URL fields as described above.

**Task 15 (CallAdapter — wire format):**
Use exactly five type strings: `'call'`, `'join'`, `'signal'`, `'track_type'`, `'hangup'`.
There is no separate offer/answer/ICE type — all WebRTC signaling uses `'signal'`
with the SimplePeer `SignalData` opaquely embedded in `payload.signal`.
The `'call'` type initiates the ring (carries `avatar` as base64 data-URL).
The `'track_type'` type must be forwarded faithfully (the remote peer uses it to
distinguish webcam from screen-share streams).
