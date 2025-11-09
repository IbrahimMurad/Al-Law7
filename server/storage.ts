import { type Student, type InsertStudent, type Loo7, type InsertLoo7 } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Student operations
  getStudent(id: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  // Loo7 operations
  getLoo7(id: string): Promise<Loo7 | undefined>;
  getAllLoo7(): Promise<Loo7[]>;
  getLoo7ByDate(date: string): Promise<Loo7[]>;
  getLoo7ByStudentAndDate(studentId: string, date: string): Promise<Loo7[]>;
  createLoo7(loo7: InsertLoo7): Promise<Loo7>;
  updateLoo7(id: string, loo7: Partial<Loo7>): Promise<Loo7 | undefined>;
  deleteLoo7(id: string): Promise<boolean>;
  
  getAllData?(): { students: Student[], loo7s: Loo7[] };
}

export class MemStorage implements IStorage {
  private students: Map<string, Student>;
  private loo7s: Map<string, Loo7>;

  constructor() {
    this.students = new Map();
    this.loo7s = new Map();
  }

  // Student operations
  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values()).sort((a, b) => 
      a.name.localeCompare(b.name, 'ar')
    );
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const now = new Date();
    const student: Student = {
      id,
      name: insertStudent.name,
      age: insertStudent.age ?? null,
      contact: insertStudent.contact ?? null,
      notes: insertStudent.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;

    const updated: Student = {
      ...student,
      ...updates,
      updatedAt: new Date(),
    };
    this.students.set(id, updated);
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    // Delete all loo7s for this student (cascade delete)
    const studentLoo7s = Array.from(this.loo7s.values()).filter(
      (loo7) => loo7.studentId === id
    );
    studentLoo7s.forEach((loo7) => this.loo7s.delete(loo7.id));

    return this.students.delete(id);
  }

  // Loo7 operations
  async getLoo7(id: string): Promise<Loo7 | undefined> {
    return this.loo7s.get(id);
  }

  async getAllLoo7(): Promise<Loo7[]> {
    return Array.from(this.loo7s.values());
  }

  async getLoo7ByDate(date: string): Promise<Loo7[]> {
    return Array.from(this.loo7s.values()).filter(
      (loo7) => loo7.recitationDate === date
    );
  }

  async getLoo7ByStudentAndDate(studentId: string, date: string): Promise<Loo7[]> {
    return Array.from(this.loo7s.values())
      .filter((loo7) => loo7.studentId === studentId && loo7.recitationDate === date)
      .sort((a, b) => {
        const typeOrder = { new: 1, near_past: 2, far_past: 3 };
        return typeOrder[a.type as keyof typeof typeOrder] - typeOrder[b.type as keyof typeof typeOrder];
      });
  }

  async createLoo7(insertLoo7: InsertLoo7): Promise<Loo7> {
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
    this.loo7s.set(id, loo7);
    return loo7;
  }

  async updateLoo7(id: string, updates: Partial<Loo7>): Promise<Loo7 | undefined> {
    const loo7 = this.loo7s.get(id);
    if (!loo7) return undefined;

    const updated: Loo7 = {
      ...loo7,
      ...updates,
    };
    this.loo7s.set(id, updated);
    return updated;
  }

  async deleteLoo7(id: string): Promise<boolean> {
    return this.loo7s.delete(id);
  }
}

import { SQLiteStorage } from "./sqlite-storage";

export const storage = new SQLiteStorage();
