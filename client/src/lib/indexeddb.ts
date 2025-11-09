import { type Student, type Loo7 } from "@shared/schema";

const DB_NAME = "loo7_app_db";
const DB_VERSION = 1;
const STUDENTS_STORE = "students";
const LOO7S_STORE = "loo7s";

export class IndexedDBBackup {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STUDENTS_STORE)) {
          const studentStore = db.createObjectStore(STUDENTS_STORE, { keyPath: "id" });
          studentStore.createIndex("name", "name", { unique: false });
        }

        if (!db.objectStoreNames.contains(LOO7S_STORE)) {
          const loo7Store = db.createObjectStore(LOO7S_STORE, { keyPath: "id" });
          loo7Store.createIndex("studentId", "studentId", { unique: false });
          loo7Store.createIndex("recitationDate", "recitationDate", { unique: false });
          loo7Store.createIndex("studentDate", ["studentId", "recitationDate"], { unique: false });
        }
      };
    });
  }

  async saveStudent(student: Student): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STUDENTS_STORE], "readwrite");
      const store = transaction.objectStore(STUDENTS_STORE);
      const request = store.put({
        ...student,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveLoo7(loo7: Loo7): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([LOO7S_STORE], "readwrite");
      const store = transaction.objectStore(LOO7S_STORE);
      const request = store.put({
        ...loo7,
        createdAt: loo7.createdAt.toISOString(),
        completedAt: loo7.completedAt ? loo7.completedAt.toISOString() : null,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllStudents(): Promise<Student[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STUDENTS_STORE], "readonly");
      const store = transaction.objectStore(STUDENTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const students = request.result.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
        resolve(students);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllLoo7s(): Promise<Loo7[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([LOO7S_STORE], "readonly");
      const store = transaction.objectStore(LOO7S_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const loo7s = request.result.map((l: any) => ({
          ...l,
          createdAt: new Date(l.createdAt),
          completedAt: l.completedAt ? new Date(l.completedAt) : null,
        }));
        resolve(loo7s);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getStudentById(id: string): Promise<Student | null> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STUDENTS_STORE], "readonly");
      const store = transaction.objectStore(STUDENTS_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        const student = {
          ...request.result,
          createdAt: new Date(request.result.createdAt),
          updatedAt: new Date(request.result.updatedAt),
        };
        resolve(student);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getLoo7sByStudentId(studentId: string): Promise<Loo7[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([LOO7S_STORE], "readonly");
      const store = transaction.objectStore(LOO7S_STORE);
      const index = store.index("studentId");
      const request = index.getAll(studentId);

      request.onsuccess = () => {
        const loo7s = request.result.map((l: any) => ({
          ...l,
          createdAt: new Date(l.createdAt),
          completedAt: l.completedAt ? new Date(l.completedAt) : null,
        }));
        resolve(loo7s);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteStudent(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STUDENTS_STORE, LOO7S_STORE], "readwrite");
      
      const studentStore = transaction.objectStore(STUDENTS_STORE);
      const loo7Store = transaction.objectStore(LOO7S_STORE);
      const index = loo7Store.index("studentId");
      
      const loo7Request = index.getAllKeys(id);
      
      loo7Request.onsuccess = () => {
        const keys = loo7Request.result;
        keys.forEach(key => loo7Store.delete(key));
        
        const studentRequest = studentStore.delete(id);
        studentRequest.onsuccess = () => resolve();
        studentRequest.onerror = () => reject(studentRequest.error);
      };
      
      loo7Request.onerror = () => reject(loo7Request.error);
    });
  }

  async deleteLoo7(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([LOO7S_STORE], "readwrite");
      const store = transaction.objectStore(LOO7S_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async syncFromServer(data: { students: Student[], loo7s: Loo7[] }): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction([STUDENTS_STORE, LOO7S_STORE], "readwrite");
    const studentStore = transaction.objectStore(STUDENTS_STORE);
    const loo7Store = transaction.objectStore(LOO7S_STORE);

    studentStore.clear();
    data.students.forEach(student => {
      studentStore.put({
        ...student,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
      });
    });

    loo7Store.clear();
    data.loo7s.forEach(loo7 => {
      loo7Store.put({
        ...loo7,
        createdAt: loo7.createdAt.toISOString(),
        completedAt: loo7.completedAt ? loo7.completedAt.toISOString() : null,
      });
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STUDENTS_STORE, LOO7S_STORE], "readwrite");
      
      transaction.objectStore(STUDENTS_STORE).clear();
      transaction.objectStore(LOO7S_STORE).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const indexedDBBackup = new IndexedDBBackup();
