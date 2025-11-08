import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Student table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  age: integer("age"),
  contact: text("contact"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Loo7 (Manuscript) table
export const loo7s = pgTable("loo7s", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["new", "near_past", "far_past"] }).notNull(),
  recitationDate: date("recitation_date").notNull(),
  surahNumber: integer("surah_number").notNull(),
  surahName: text("surah_name").notNull(),
  startAyaNumber: integer("start_aya_number").notNull(),
  endAyaNumber: integer("end_aya_number").notNull(),
  status: text("status", { enum: ["pending", "completed"] }).notNull().default("pending"),
  score: text("score", { enum: ["excellent", "good", "weak", "repeat"] }),
  scoreNotes: text("score_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertLoo7Schema = createInsertSchema(loo7s).omit({
  id: true,
  status: true,
  score: true,
  scoreNotes: true,
  createdAt: true,
  completedAt: true,
}).extend({
  recitationDate: z.string(), // ISO date string from frontend
});

export const evaluateLoo7Schema = z.object({
  score: z.enum(["excellent", "good", "weak", "repeat"]),
  scoreNotes: z.string().optional(),
});

export type InsertLoo7 = z.infer<typeof insertLoo7Schema>;
export type EvaluateLoo7 = z.infer<typeof evaluateLoo7Schema>;
export type Loo7 = typeof loo7s.$inferSelect;

// Surah information type (from API)
export type Surah = {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
};

// API response types for Quran data
export type QuranAya = {
  number: number;
  text: string;
  numberInSurah: number;
  surah: {
    number: number;
    name: string;
  };
};
