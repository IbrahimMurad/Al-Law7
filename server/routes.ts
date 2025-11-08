import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertLoo7Schema, evaluateLoo7Schema } from "@shared/schema";
import { format, addDays } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== Student Routes ====================
  
  // Get all students
  app.get("/api/students", async (_req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Get single student
  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  // Create student
  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid student data" });
    }
  });

  // Update student
  app.patch("/api/students/:id", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(req.params.id, validatedData);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid student data" });
    }
  });

  // Delete student
  app.delete("/api/students/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStudent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // ==================== Loo7 Routes ====================

  // Get daily assignments (students with loo7 for a specific date)
  app.get("/api/loo7/daily/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const loo7s = await storage.getLoo7ByDate(date);
      
      // Group by student
      const studentMap = new Map<string, { loo7Count: number; pendingCount: number }>();
      
      for (const loo7 of loo7s) {
        if (!studentMap.has(loo7.studentId)) {
          studentMap.set(loo7.studentId, { loo7Count: 0, pendingCount: 0 });
        }
        const stats = studentMap.get(loo7.studentId)!;
        stats.loo7Count++;
        if (loo7.status === "pending") {
          stats.pendingCount++;
        }
      }

      // Get student details and combine
      const students = await storage.getAllStudents();
      const result = students
        .filter(student => studentMap.has(student.id))
        .map(student => ({
          student,
          loo7Count: studentMap.get(student.id)!.loo7Count,
          pendingCount: studentMap.get(student.id)!.pendingCount,
        }));

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily assignments" });
    }
  });

  // Get loo7 for a specific student on a specific date
  app.get("/api/loo7/student/:studentId/:date", async (req, res) => {
    try {
      const { studentId, date } = req.params;
      const loo7s = await storage.getLoo7ByStudentAndDate(studentId, date);
      res.json(loo7s);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student loo7" });
    }
  });

  // Get single loo7
  app.get("/api/loo7/:id", async (req, res) => {
    try {
      const loo7 = await storage.getLoo7(req.params.id);
      if (!loo7) {
        return res.status(404).json({ error: "Loo7 not found" });
      }
      res.json(loo7);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loo7" });
    }
  });

  // Create loo7
  app.post("/api/loo7", async (req, res) => {
    try {
      const validatedData = insertLoo7Schema.parse(req.body);
      const loo7 = await storage.createLoo7(validatedData);
      res.status(201).json(loo7);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid loo7 data" });
    }
  });

  // Evaluate loo7
  app.post("/api/loo7/:id/evaluate", async (req, res) => {
    try {
      const loo7 = await storage.getLoo7(req.params.id);
      if (!loo7) {
        return res.status(404).json({ error: "Loo7 not found" });
      }

      if (loo7.status === "completed") {
        return res.status(400).json({ error: "Loo7 already evaluated" });
      }

      const validatedData = evaluateLoo7Schema.parse(req.body);

      // Update the loo7 with evaluation
      const updatedLoo7 = await storage.updateLoo7(req.params.id, {
        status: "completed",
        score: validatedData.score,
        scoreNotes: validatedData.scoreNotes || null,
        completedAt: new Date(),
      });

      // If score is "repeat", create a new loo7 for the next scheduled day
      if (validatedData.score === "repeat") {
        const nextDate = getNextScheduledDate(loo7.recitationDate);
        await storage.createLoo7({
          studentId: loo7.studentId,
          type: loo7.type,
          recitationDate: nextDate,
          surahNumber: loo7.surahNumber,
          surahName: loo7.surahName,
          startAyaNumber: loo7.startAyaNumber,
          endAyaNumber: loo7.endAyaNumber,
        });
      }

      res.json(updatedLoo7);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to evaluate loo7" });
    }
  });

  // ==================== Quran API Routes ====================

  // Get all Surahs
  app.get("/api/quran/surahs", async (_req, res) => {
    try {
      const response = await fetch("https://api.alquran.cloud/v1/surah");
      const data = await response.json();
      
      if (data.code !== 200 || !data.data) {
        throw new Error("Failed to fetch Surahs from API");
      }

      const surahs = data.data.map((surah: any) => ({
        number: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        numberOfAyahs: surah.numberOfAyahs,
      }));

      res.json(surahs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Surahs" });
    }
  });

  // Get Ayat range for a Surah
  app.get("/api/quran/ayat/:surahNumber/:startAya/:endAya", async (req, res) => {
    try {
      const { surahNumber, startAya, endAya } = req.params;
      
      // Fetch the entire Surah (with Arabic text)
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${surahNumber}`
      );
      const data = await response.json();

      if (data.code !== 200 || !data.data) {
        throw new Error("Failed to fetch Surah from API");
      }

      const surah = data.data;
      const start = parseInt(startAya);
      const end = parseInt(endAya);

      // Filter ayat by range
      const ayat = surah.ayahs
        .filter((aya: any) => aya.numberInSurah >= start && aya.numberInSurah <= end)
        .map((aya: any) => ({
          number: aya.number,
          text: aya.text,
          numberInSurah: aya.numberInSurah,
          surah: {
            number: surah.number,
            name: surah.name,
          },
        }));

      res.json(ayat);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Ayat" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to get next scheduled date (skipping Fridays)
function getNextScheduledDate(currentDate: string): string {
  let nextDate = addDays(new Date(currentDate), 1);
  
  // Skip Friday (day 5)
  while (nextDate.getDay() === 5) {
    nextDate = addDays(nextDate, 1);
  }
  
  return format(nextDate, "yyyy-MM-dd");
}
