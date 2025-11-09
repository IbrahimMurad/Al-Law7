import { getStore, type BlobsStore } from "@netlify/blobs";
import type { Store } from "express-session";

interface SessionData {
  [key: string]: any;
}

export class BlobsSessionStore extends Store {
  private store: BlobsStore;
  private storeOptions?: { siteID: string; token: string };

  constructor(options?: { siteID?: string; token?: string }) {
    super();
    this.storeOptions = options?.siteID && options?.token 
      ? { siteID: options.siteID, token: options.token }
      : undefined;
    this.store = getStore("sessions", this.storeOptions);
  }

  async get(sid: string, callback: (err?: any, session?: SessionData) => void): Promise<void> {
    try {
      const session = await this.store.get(`session:${sid}`, { type: "json" });
      if (session) {
        callback(undefined, session as SessionData);
      } else {
        callback();
      }
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, session: SessionData, callback?: (err?: any) => void): Promise<void> {
    try {
      await this.store.set(`session:${sid}`, session, {
        metadata: {
          expiresAt: session.cookie?.expires 
            ? new Date(session.cookie.expires).toISOString()
            : new Date(Date.now() + (session.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000)).toISOString(),
        },
      });
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void): Promise<void> {
    try {
      await this.store.delete(`session:${sid}`);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async touch(sid: string, session: SessionData, callback?: (err?: any) => void): Promise<void> {
    try {
      await this.set(sid, session);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async all(callback: (err?: any, obj?: { [sid: string]: SessionData }) => void): Promise<void> {
    try {
      const { blobs } = await this.store.list();
      const sessions: { [sid: string]: SessionData } = {};
      
      for (const { key } of blobs) {
        if (key.startsWith("session:")) {
          const sid = key.replace("session:", "");
          const session = await this.store.get(key, { type: "json" }) as SessionData;
          if (session) {
            sessions[sid] = session;
          }
        }
      }
      
      callback(undefined, sessions);
    } catch (err) {
      callback(err);
    }
  }

  async length(callback: (err?: any, length?: number) => void): Promise<void> {
    try {
      const { blobs } = await this.store.list();
      const sessionKeys = blobs.filter(blob => blob.key.startsWith("session:"));
      callback(undefined, sessionKeys.length);
    } catch (err) {
      callback(err);
    }
  }

  async clear(callback?: (err?: any) => void): Promise<void> {
    try {
      const { blobs } = await this.store.list();
      const sessionKeys = blobs.filter(blob => blob.key.startsWith("session:"));
      
      for (const { key } of sessionKeys) {
        await this.store.delete(key);
      }
      
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }
}

