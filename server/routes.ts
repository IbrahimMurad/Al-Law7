import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { insertStudentSchema, insertLoo7Schema, evaluateLoo7Schema, type Sheikh } from "@shared/schema";
import { format, addDays } from "date-fns";
import type { BlobsStorage } from "./blobs-storage";
import { isAuthAvailable } from "./auth";

declare global {
  namespace Express {
    interface User extends Sheikh {}
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

export async function registerRoutes(app: Express, storage: BlobsStorage | null = null): Promise<Server> {
  // Helper to get storage from request or fallback to provided storage
  const getStorage = (req: Request): BlobsStorage => {
    return (req as any).storage || storage!;
  };
  app.get("/api/auth/google", (req, res, next) => {
    if (!isAuthAvailable()) {
      return res.status(503).json({ error: "Google OAuth is not configured. Please check environment variables." });
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      if (!isAuthAvailable()) {
        return res.status(503).redirect("/login?error=oauth_not_configured");
      }
      passport.authenticate("google", { failureRedirect: "/login" })(req, res, next);
    },
    (_req, res) => {
      res.redirect("/");
    }
  );

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const students = await getStorage(req).getAllStudents(req.user!.id);
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const student = await getStorage(req).getStudent(req.params.id, req.user!.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  app.post("/api/students", requireAuth, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.omit({ sheikId: true }).parse(req.body);
      const student = await getStorage(req).createStudent(validatedData, req.user!.id);
      res.status(201).json(student);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid student data" });
    }
  });

  app.patch("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.omit({ sheikId: true }).partial().parse(req.body);
      const student = await getStorage(req).updateStudent(req.params.id, validatedData, req.user!.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid student data" });
    }
  });

  app.delete("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await getStorage(req).deleteStudent(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  app.get("/api/loo7/daily/:date", requireAuth, async (req, res) => {
    try {
      const { date } = req.params;
      const loo7s = await getStorage(req).getLoo7ByDate(date, req.user!.id);
      
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

      const students = await getStorage(req).getAllStudents(req.user!.id);
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

  app.get("/api/loo7/student/:studentId/:date", requireAuth, async (req, res) => {
    try {
      const { studentId, date } = req.params;
      const loo7s = await getStorage(req).getLoo7ByStudentAndDate(studentId, date, req.user!.id);
      res.json(loo7s);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student loo7" });
    }
  });

  app.get("/api/loo7/:id", requireAuth, async (req, res) => {
    try {
      const loo7 = await getStorage(req).getLoo7(req.params.id, req.user!.id);
      if (!loo7) {
        return res.status(404).json({ error: "Loo7 not found" });
      }
      res.json(loo7);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loo7" });
    }
  });

  app.post("/api/loo7", requireAuth, async (req, res) => {
    try {
      const validatedData = insertLoo7Schema.parse(req.body);
      const loo7 = await getStorage(req).createLoo7(validatedData, req.user!.id);
      res.status(201).json(loo7);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid loo7 data" });
    }
  });

  app.post("/api/loo7/:id/evaluate", requireAuth, async (req, res) => {
    try {
      const loo7 = await getStorage(req).getLoo7(req.params.id, req.user!.id);
      if (!loo7) {
        return res.status(404).json({ error: "Loo7 not found" });
      }

      if (loo7.status === "completed") {
        return res.status(400).json({ error: "Loo7 already evaluated" });
      }

      const validatedData = evaluateLoo7Schema.parse(req.body);

      const updatedLoo7 = await getStorage(req).updateLoo7(req.params.id, {
        status: "completed",
        score: validatedData.score,
        scoreNotes: validatedData.scoreNotes || null,
        completedAt: new Date(),
      }, req.user!.id);

      if (validatedData.score === "repeat") {
        const nextDate = getNextScheduledDate(loo7.recitationDate);
        await getStorage(req).createLoo7({
          studentId: loo7.studentId,
          type: loo7.type,
          recitationDate: nextDate,
          surahNumber: loo7.surahNumber,
          surahName: loo7.surahName,
          startAyaNumber: loo7.startAyaNumber,
          endAyaNumber: loo7.endAyaNumber,
        }, req.user!.id);
      }

      res.json(updatedLoo7);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to evaluate loo7" });
    }
  });

  app.get("/api/sync", requireAuth, async (req, res) => {
    try {
      const students = await getStorage(req).getAllStudents(req.user!.id);
      const loo7s = await getStorage(req).getAllLoo7(req.user!.id);
      res.json({ students, loo7s });
    } catch (error) {
      res.status(500).json({ error: "Failed to sync data" });
    }
  });

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

  app.get("/api/quran/ayat/:surahNumber/:startAya/:endAya", async (req, res) => {
    try {
      const { surahNumber, startAya, endAya } = req.params;
      
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

function getNextScheduledDate(currentDate: string): string {
  let nextDate = addDays(new Date(currentDate), 1);
  
  while (nextDate.getDay() === 5) {
    nextDate = addDays(nextDate, 1);
  }
  
  return format(nextDate, "yyyy-MM-dd");
}
