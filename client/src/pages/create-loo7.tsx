import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, addDays } from "date-fns";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Student, Surah } from "@shared/schema";

const LOO7_TYPES = [
  { value: "new", label: "جديد", color: "bg-primary" },
  { value: "near_past", label: "قريب", color: "bg-chart-2" },
  { value: "far_past", label: "بعيد", color: "bg-chart-4" },
];

export default function CreateLoo7() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const preSelectedStudentId = searchParams.get("studentId");

  const [formData, setFormData] = useState({
    studentId: "",
    type: "",
    recitationDate: getDefaultDate(),
    surahNumber: "",
    startAyaNumber: "",
    endAyaNumber: "",
  });

  // Set pre-selected student after component mounts
  useEffect(() => {
    if (preSelectedStudentId) {
      setFormData(prev => ({ ...prev, studentId: preSelectedStudentId }));
    }
  }, [preSelectedStudentId]);

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: surahs } = useQuery<Surah[]>({
    queryKey: ["/api/quran/surahs"],
  });

  const selectedSurah = surahs?.find(s => s.number === parseInt(formData.surahNumber));

  const createLoo7 = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/loo7", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loo7/daily"] });
      toast({
        title: "تم الإنشاء",
        description: "تم إنشاء اللوح بنجاح",
      });
      navigate("/");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    if (!formData.studentId) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار الطالب",
        variant: "destructive",
      });
      return;
    }

    if (!formData.type) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار نوع اللوح",
        variant: "destructive",
      });
      return;
    }

    if (!formData.surahNumber) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار السورة",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startAyaNumber || !formData.endAyaNumber) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار نطاق الآيات",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(formData.endAyaNumber) < parseInt(formData.startAyaNumber)) {
      toast({
        title: "خطأ",
        description: "رقم الآية النهائية يجب أن يكون أكبر من أو يساوي رقم الآية البدائية",
        variant: "destructive",
      });
      return;
    }

    const student = students?.find(s => s.id === formData.studentId);
    const surah = surahs?.find(s => s.number === parseInt(formData.surahNumber));

    if (!student || !surah) {
      toast({
        title: "خطأ",
        description: "بيانات غير صالحة. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
      return;
    }

    createLoo7.mutate({
      studentId: formData.studentId,
      type: formData.type,
      recitationDate: formData.recitationDate,
      surahNumber: surah.number,
      surahName: surah.name,
      startAyaNumber: parseInt(formData.startAyaNumber),
      endAyaNumber: parseInt(formData.endAyaNumber),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-card-border px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">إنشاء لوح جديد</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Selection */}
          <Card>
            <CardContent className="p-6">
              <Label className="text-base font-semibold mb-3 block">
                الطالب <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                required
              >
                <SelectTrigger data-testid="select-student">
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Loo7 Type */}
          <Card>
            <CardContent className="p-6">
              <Label className="text-base font-semibold mb-3 block">
                نوع اللوح <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-3">
                {LOO7_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`w-full min-h-16 px-6 py-4 rounded-md border-2 transition-all text-right ${
                      formData.type === type.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover-elevate"
                    }`}
                    data-testid={`button-type-${type.value}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                      <span className="text-lg font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recitation Date */}
          <Card>
            <CardContent className="p-6">
              <Label className="text-base font-semibold mb-3 block">
                تاريخ التسميع <span className="text-destructive">*</span>
              </Label>
              <input
                type="date"
                value={formData.recitationDate}
                onChange={(e) => setFormData({ ...formData, recitationDate: e.target.value })}
                className="w-full px-4 h-12 bg-background border border-input rounded-md text-foreground"
                required
                data-testid="input-recitation-date"
              />
            </CardContent>
          </Card>

          {/* Surah Selection */}
          <Card>
            <CardContent className="p-6">
              <Label className="text-base font-semibold mb-3 block">
                السورة <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.surahNumber}
                onValueChange={(value) =>
                  setFormData({ ...formData, surahNumber: value, startAyaNumber: "", endAyaNumber: "" })
                }
                required
              >
                <SelectTrigger data-testid="select-surah">
                  <SelectValue placeholder="اختر السورة" />
                </SelectTrigger>
                <SelectContent>
                  {surahs?.map((surah) => (
                    <SelectItem key={surah.number} value={surah.number.toString()}>
                      {surah.number}. {surah.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Aya Range */}
          {selectedSurah && (
            <Card>
              <CardContent className="p-6">
                <Label className="text-base font-semibold mb-3 block">
                  نطاق الآيات <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">من الآية</Label>
                    <Select
                      value={formData.startAyaNumber}
                      onValueChange={(value) => setFormData({ ...formData, startAyaNumber: value })}
                      required
                    >
                      <SelectTrigger data-testid="select-start-aya">
                        <SelectValue placeholder="الآية" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: selectedSurah.numberOfAyahs }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">إلى الآية</Label>
                    <Select
                      value={formData.endAyaNumber}
                      onValueChange={(value) => setFormData({ ...formData, endAyaNumber: value })}
                      required
                    >
                      <SelectTrigger data-testid="select-end-aya">
                        <SelectValue placeholder="الآية" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: selectedSurah.numberOfAyahs }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.startAyaNumber && formData.endAyaNumber && (
                  <p className="text-sm text-muted-foreground mt-3">
                    عدد الآيات: {parseInt(formData.endAyaNumber) - parseInt(formData.startAyaNumber) + 1}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1"
              data-testid="button-cancel"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createLoo7.isPending}
              data-testid="button-save-loo7"
            >
              {createLoo7.isPending ? "جاري الحفظ..." : "حفظ اللوح"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function getDefaultDate(): string {
  let date = new Date();
  date = addDays(date, 1);
  
  // Skip Friday (day 5)
  if (date.getDay() === 5) {
    date = addDays(date, 1);
  }
  
  return format(date, "yyyy-MM-dd");
}
