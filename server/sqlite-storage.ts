import { type Student, type InsertStudent, type Loo7, type InsertLoo7 } from "@shared/schema";
import { type IStorage } from "./storage";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor(dbPath: string = "./data/app.db") {
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initializeTables();
  }

  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER,
        contact TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS loo7s (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('new', 'near_past', 'far_past')),
        recitation_date TEXT NOT NULL,
        surah_number INTEGER NOT NULL,
        surah_name TEXT NOT NULL,
        start_aya_number INTEGER NOT NULL,
        end_aya_number INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
        score TEXT CHECK(score IN ('excellent', 'good', 'weak', 'repeat')),
        score_notes TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_loo7s_student_id ON loo7s(student_id);
      CREATE INDEX IF NOT EXISTS idx_loo7s_recitation_date ON loo7s(recitation_date);
      CREATE INDEX IF NOT EXISTS idx_loo7s_student_date ON loo7s(student_id, recitation_date);
    `);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const stmt = this.db.prepare("SELECT * FROM students WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return this.mapStudentRow(row);
  }

  async getAllStudents(): Promise<Student[]> {
    const stmt = this.db.prepare("SELECT * FROM students ORDER BY name COLLATE NOCASE");
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapStudentRow(row));
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO students (id, name, age, contact, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      insertStudent.name,
      insertStudent.age ?? null,
      insertStudent.contact ?? null,
      insertStudent.notes ?? null,
      now,
      now
    );

    return {
      id,
      name: insertStudent.name,
      age: insertStudent.age ?? null,
      contact: insertStudent.contact ?? null,
      notes: insertStudent.notes ?? null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async updateStudent(id: string, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const existing = await this.getStudent(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.age !== undefined) {
      fields.push("age = ?");
      values.push(updates.age);
    }
    if (updates.contact !== undefined) {
      fields.push("contact = ?");
      values.push(updates.contact);
    }
    if (updates.notes !== undefined) {
      fields.push("notes = ?");
      values.push(updates.notes);
    }

    fields.push("updated_at = ?");
    values.push(now);
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE students SET ${fields.join(", ")} WHERE id = ?
    `);
    stmt.run(...values);

    return this.getStudent(id);
  }

  async deleteStudent(id: string): Promise<boolean> {
    const stmt = this.db.prepare("DELETE FROM students WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async getLoo7(id: string): Promise<Loo7 | undefined> {
    const stmt = this.db.prepare("SELECT * FROM loo7s WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return this.mapLoo7Row(row);
  }

  async getAllLoo7(): Promise<Loo7[]> {
    const stmt = this.db.prepare("SELECT * FROM loo7s");
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapLoo7Row(row));
  }

  async getLoo7ByDate(date: string): Promise<Loo7[]> {
    const stmt = this.db.prepare("SELECT * FROM loo7s WHERE recitation_date = ?");
    const rows = stmt.all(date) as any[];
    return rows.map(row => this.mapLoo7Row(row));
  }

  async getLoo7ByStudentAndDate(studentId: string, date: string): Promise<Loo7[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM loo7s 
      WHERE student_id = ? AND recitation_date = ?
      ORDER BY 
        CASE type 
          WHEN 'new' THEN 1
          WHEN 'near_past' THEN 2
          WHEN 'far_past' THEN 3
        END
    `);
    const rows = stmt.all(studentId, date) as any[];
    return rows.map(row => this.mapLoo7Row(row));
  }

  async createLoo7(insertLoo7: InsertLoo7): Promise<Loo7> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO loo7s (
        id, student_id, type, recitation_date, surah_number, surah_name,
        start_aya_number, end_aya_number, status, score, score_notes,
        created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      insertLoo7.studentId,
      insertLoo7.type,
      insertLoo7.recitationDate,
      insertLoo7.surahNumber,
      insertLoo7.surahName,
      insertLoo7.startAyaNumber,
      insertLoo7.endAyaNumber,
      "pending",
      null,
      null,
      now,
      null
    );

    return {
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
      createdAt: new Date(now),
      completedAt: null,
    };
  }

  async updateLoo7(id: string, updates: Partial<Loo7>): Promise<Loo7 | undefined> {
    const existing = await this.getLoo7(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.score !== undefined) {
      fields.push("score = ?");
      values.push(updates.score);
    }
    if (updates.scoreNotes !== undefined) {
      fields.push("score_notes = ?");
      values.push(updates.scoreNotes);
    }
    if (updates.completedAt !== undefined) {
      fields.push("completed_at = ?");
      values.push(updates.completedAt ? updates.completedAt.toISOString() : null);
    }

    if (fields.length === 0) return existing;

    values.push(id);
    const stmt = this.db.prepare(`
      UPDATE loo7s SET ${fields.join(", ")} WHERE id = ?
    `);
    stmt.run(...values);

    return this.getLoo7(id);
  }

  async deleteLoo7(id: string): Promise<boolean> {
    const stmt = this.db.prepare("DELETE FROM loo7s WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getAllData(): { students: Student[], loo7s: Loo7[] } {
    const students = this.db.prepare("SELECT * FROM students").all() as any[];
    const loo7s = this.db.prepare("SELECT * FROM loo7s").all() as any[];
    
    return {
      students: students.map(row => this.mapStudentRow(row)),
      loo7s: loo7s.map(row => this.mapLoo7Row(row))
    };
  }

  close(): void {
    this.db.close();
  }

  private mapStudentRow(row: any): Student {
    return {
      id: row.id,
      name: row.name,
      age: row.age,
      contact: row.contact,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapLoo7Row(row: any): Loo7 {
    return {
      id: row.id,
      studentId: row.student_id,
      type: row.type as "new" | "near_past" | "far_past",
      recitationDate: row.recitation_date,
      surahNumber: row.surah_number,
      surahName: row.surah_name,
      startAyaNumber: row.start_aya_number,
      endAyaNumber: row.end_aya_number,
      status: row.status as "pending" | "completed",
      score: row.score as "excellent" | "good" | "weak" | "repeat" | null,
      scoreNotes: row.score_notes,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
    };
  }
}
