import type {
  MediaHandlers,
  MediaDownloadOptions,
} from "../../dist";

export function createMockMediaHandlers(): MediaHandlers {
  return {
    async download(url: string, opts?: MediaDownloadOptions): Promise<Blob> {
      const response = await fetch(url, { signal: opts?.signal });
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);

      const total = parseInt(
        response.headers.get("content-length") || "0",
        10,
      );
      const reader = response.body?.getReader();
      if (!reader) return response.blob();

      let loaded = 0;
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (total && opts?.onProgress) {
            opts.onProgress(Math.round((loaded / total) * 100));
          }
        }
      }
      return new Blob(chunks, {
        type: response.headers.get("content-type") || "application/octet-stream",
      });
    },

    async getFileSize(url: string): Promise<number | null> {
      try {
        const res = await fetch(url, { method: "HEAD" });
        const length = res.headers.get("Content-Length");
        return length ? parseInt(length, 10) : null;
      } catch {
        return null;
      }
    },
  };
}