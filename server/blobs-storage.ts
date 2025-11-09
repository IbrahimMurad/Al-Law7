import { getStore, type BlobsStore } from "@netlify/blobs";
import type { Sheikh, InsertSheikh, Student, InsertStudent, Loo7, InsertLoo7 } from "@shared/schema";
import { randomUUID } from "crypto";

export class BlobsStorage {
  private _sheikhsStore: BlobsStore | null = null;
  private _studentsStore: BlobsStore | null = null;
  private _loo7sStore: BlobsStore | null = null;
  private storeOptions?: { siteID: string; token: string };

  constructor(context?: { siteID?: string; token?: string }) {
    // Store options for manual configuration if provided
    if (context?.siteID && context?.token) {
      this.storeOptions = { siteID: context.siteID, token: context.token };
    }
  }

  private get sheikhsStore(): BlobsStore {
    if (!this._sheikhsStore) {
      this._sheikhsStore = getStore("sheikhs", this.storeOptions);
    }
    return this._sheikhsStore;
  }

  private get studentsStore(): BlobsStore {
    if (!this._studentsStore) {
      this._studentsStore = getStore("students", this.storeOptions);
    }
    return this._studentsStore;
  }

  private get loo7sStore(): BlobsStore {
    if (!this._loo7sStore) {
      this._loo7sStore = getStore("loo7s", this.storeOptions);
    }
    return this._loo7sStore;
  }
  async getSheikh(id: string): Promise<Sheikh | undefined> {
    const sheikh = await this.sheikhsStore.get(`sheikh:${id}`, { type: "json" });
    return sheikh || undefined;
  }

  async getSheikhByGoogleId(googleId: string): Promise<Sheikh | undefined> {
    const { blobs } = await this.sheikhsStore.list();
    
    for (const { key } of blobs) {
      const sheikh = await this.sheikhsStore.get(key, { type: "json" }) as Sheikh;
      if (sheikh && sheikh.googleId === googleId) {
        return sheikh;
      }
    }
    
    return undefined;
  }

  async createSheikh(insertSheikh: Omit<InsertSheikh, "id" | "createdAt" | "updatedAt">): Promise<Sheikh> {
    const id = randomUUID();
    const now = new Date();
    const sheikh: Sheikh = {
      id,
      googleId: insertSheikh.googleId,
      email: insertSheikh.email,
      name: insertSheikh.name,
      picture: insertSheikh.picture ?? null,
      createdAt: now,
      updatedAt: now,
    };
    
    await this.sheikhsStore.setJSON(`sheikh:${id}`, sheikh);
    return sheikh;
  }

  async getStudent(id: string, sheikId: string): Promise<Student | undefined> {
    const student = await this.studentsStore.get(`student:${id}`, { type: "json" }) as Student | null;
    if (!student || student.sheikId !== sheikId) {
      return undefined;
    }
    return student;
  }

  async getAllStudents(sheikId: string): Promise<Student[]> {
    const { blobs } = await this.studentsStore.list();
    const students: Student[] = [];
    
    for (const { key } of blobs) {
      const student = await this.studentsStore.get(key, { type: "json" }) as Student;
      if (student && student.sheikId === sheikId) {
        students.push(student);
      }
    }
    
    return students.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }

  async createStudent(insertStudent: InsertStudent, sheikId: string): Promise<Student> {
    const id = randomUUID();
    const now = new Date();
    const student: Student = {
      id,
      sheikId,
      name: insertStudent.name,
      age: insertStudent.age ?? null,
      contact: insertStudent.contact ?? null,
      notes: insertStudent.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    
    await this.studentsStore.setJSON(`student:${id}`, student);
    return student;
  }

  async updateStudent(id: string, updates: Partial<InsertStudent>, sheikId: string): Promise<Student | undefined> {
    const student = await this.getStudent(id, sheikId);
    if (!student) return undefined;

    const updated: Student = {
      ...student,
      ...updates,
      updatedAt: new Date(),
    };
    
    await this.studentsStore.setJSON(`student:${id}`, updated);
    return updated;
  }

  async deleteStudent(id: string, sheikId: string): Promise<boolean> {
    const student = await this.getStudent(id, sheikId);
    if (!student) return false;

    const { blobs } = await this.loo7sStore.list();
    for (const { key } of blobs) {
      const loo7 = await this.loo7sStore.get(key, { type: "json" }) as Loo7;
      if (loo7 && loo7.studentId === id) {
        await this.loo7sStore.delete(key);
      }
    }

    await this.studentsStore.delete(`student:${id}`);
    return true;
  }

  async getLoo7(id: string, sheikId: string): Promise<Loo7 | undefined> {
    const loo7 = await this.loo7sStore.get(`loo7:${id}`, { type: "json" }) as Loo7 | null;
    if (!loo7) return undefined;

    const student = await this.getStudent(loo7.studentId, sheikId);
    if (!student) return undefined;

    return loo7;
  }

  async getAllLoo7(sheikId: string): Promise<Loo7[]> {
    const students = await this.getAllStudents(sheikId);
    const studentIds = new Set(students.map(s => s.id));
    
    const { blobs } = await this.loo7sStore.list();
    const loo7s: Loo7[] = [];
    
    for (const { key } of blobs) {
      const loo7 = await this.loo7sStore.get(key, { type: "json" }) as Loo7;
      if (loo7 && studentIds.has(loo7.studentId)) {
        loo7s.push(loo7);
      }
    }
    
    return loo7s;
  }

  async getLoo7ByDate(date: string, sheikId: string): Promise<Loo7[]> {
    const allLoo7s = await this.getAllLoo7(sheikId);
    return allLoo7s.filter(loo7 => loo7.recitationDate === date);
  }

  async getLoo7ByStudentAndDate(studentId: string, date: string, sheikId: string): Promise<Loo7[]> {
    const student = await this.getStudent(studentId, sheikId);
    if (!student) return [];

    const { blobs } = await this.loo7sStore.list();
    const loo7s: Loo7[] = [];
    
    for (const { key } of blobs) {
      const loo7 = await this.loo7sStore.get(key, { type: "json" }) as Loo7;
      if (loo7 && loo7.studentId === studentId && loo7.recitationDate === date) {
        loo7s.push(loo7);
      }
    }
    
    return loo7s.sort((a, b) => {
      const typeOrder = { new: 1, near_past: 2, far_past: 3 };
      return typeOrder[a.type as keyof typeof typeOrder] - typeOrder[b.type as keyof typeof typeOrder];
    });
  }

  async createLoo7(insertLoo7: InsertLoo7, sheikId: string): Promise<Loo7> {
    const student = await this.getStudent(insertLoo7.studentId, sheikId);
    if (!student) {
      throw new Error("Student not found or does not belong to this sheikh");
    }

    const id = randomUUID();
    const now = new Date();
    const loo7: Loo7 = {
      id,
      studentId: insertLoo7.studentId,
      type: insertLoo7.type,
      recitationDate: insertLoo7.recitationDate,
      surahNumber: insertLoo7.surahNumber,
      surahName: insertLoo7.surahName,
      startAyaNumber: insertLoo7.startAyaNumber,
      endAyaNumber: insertLoo7.endAyaNumber,
      status: "pending",
      score: null,
      scoreNotes: null,
      createdAt: now,
      completedAt: null,
    };
    
    await this.loo7sStore.setJSON(`loo7:${id}`, loo7);
    return loo7;
  }

  async updateLoo7(id: string, updates: Partial<Loo7>, sheikId: string): Promise<Loo7 | undefined> {
    const loo7 = await this.getLoo7(id, sheikId);
    if (!loo7) return undefined;

    const updated: Loo7 = {
      ...loo7,
      ...updates,
    };
    
    await this.loo7sStore.setJSON(`loo7:${id}`, updated);
    return updated;
  }

  async deleteLoo7(id: string, sheikId: string): Promise<boolean> {
    const loo7 = await this.getLoo7(id, sheikId);
    if (!loo7) return false;

    await this.loo7sStore.delete(`loo7:${id}`);
    return true;
  }
}
