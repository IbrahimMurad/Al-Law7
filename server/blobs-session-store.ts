import { getStore } from "@netlify/blobs";
import session from "express-session";
import type { SessionData } from "express-session";

export class BlobsSessionStore extends session.Store {
  private store: ReturnType<typeof getStore>;
  private storeOptions?: { siteID: string; token: string };

  constructor(options?: { siteID?: string; token?: string }) {
    super();
    this.storeOptions = options?.siteID && options?.token
      ? { siteID: options.siteID, token: options.token }
      : undefined;
    // getStore only takes store name when using Lambda context (connectLambda)
    this.store = getStore("sessions");
  }

  get(sid: string, callback: (err: any, session?: SessionData | null) => void): void {
    this.store.get(`session:${sid}`, { type: "json" })
      .then((session) => {
        callback(null, (session as SessionData) || null);
      })
      .catch((err) => {
        callback(err);
      });
  }

  set(sid: string, session: SessionData, callback?: (err?: any) => void): void {
    (this.store as any).setJSON(`session:${sid}`, session, {
      metadata: {
        expiresAt: session.cookie?.expires
          ? new Date(session.cookie.expires).toISOString()
          : new Date(Date.now() + (session.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000)).toISOString(),
      },
    })
      .then(() => {
        callback?.();
      })
      .catch((err: any) => {
        callback?.(err);
      });
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    this.store.delete(`session:${sid}`)
      .then(() => {
        callback?.();
      })
      .catch((err) => {
        callback?.(err);
      });
  }

  touch(sid: string, session: SessionData, callback?: (err?: any) => void): void {
    this.set(sid, session, callback);
  }

  all(callback: (err: any, obj?: SessionData[] | { [sid: string]: SessionData } | null) => void): void {
    this.store.list()
      .then(({ blobs }) => {
        const sessions: { [sid: string]: SessionData } = {};
        const promises = blobs
          .filter((blob: { key: string }) => blob.key.startsWith("session:"))
          .map(async ({ key }: { key: string }) => {
            const sid = key.replace("session:", "");
            const session = await this.store.get(key, { type: "json" }) as SessionData;
            if (session) {
              sessions[sid] = session;
            }
          });

        Promise.all(promises)
          .then(() => {
            callback(null, sessions);
          })
          .catch((err) => {
            callback(err);
          });
      })
      .catch((err) => {
        callback(err);
      });
  }

  length(callback: (err: any, length?: number) => void): void {
    this.store.list()
      .then(({ blobs }) => {
        const sessionKeys = blobs.filter((blob: { key: string }) => blob.key.startsWith("session:"));
        callback(null, sessionKeys.length);
      })
      .catch((err) => {
        callback(err);
      });
  }

  clear(callback?: (err?: any) => void): void {
    this.store.list()
      .then(({ blobs }) => {
        const sessionKeys = blobs.filter((blob: { key: string }) => blob.key.startsWith("session:"));
        const promises = sessionKeys.map(({ key }: { key: string }) => this.store.delete(key));
        return Promise.all(promises);
      })
      .then(() => {
        callback?.();
      })
      .catch((err) => {
        callback?.(err);
      });
  }
}

