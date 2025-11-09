import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ArrowRight, BookOpen, Star, ThumbsUp, AlertCircle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Student, Loo7, QuranAya } from "@shared/schema";

const SCORE_OPTIONS = [
  {
    value: "excellent",
    label: "ممتاز",
    icon: Star,
    color: "bg-primary text-primary-foreground border-primary",
  },
  {
    value: "good",
    label: "جيد",
    icon: ThumbsUp,
    color: "bg-chart-2 text-white border-chart-2",
  },
  {
    value: "weak",
    label: "ضعيف",
    icon: AlertCircle,
    color: "bg-chart-4 text-white border-chart-4",
  },
  {
    value: "repeat",
    label: "إعادة",
    icon: RotateCcw,
    color: "bg-destructive text-destructive-foreground border-destructive",
  },
];

const LOO7_TYPE_LABELS = {
  new: "جديد",
  near_past: "قريب",
  far_past: "بعيد",
};

export default function EvaluateLoo7() {
  const [, params] = useRoute("/loo7/:id/evaluate");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedScore, setSelectedScore] = useState("");
  const [scoreNotes, setScoreNotes] = useState("");

  const { data: loo7 } = useQuery<Loo7>({
    queryKey: ["/api/loo7", params?.id],
  });

  const { data: student } = useQuery<Student>({
    queryKey: ["/api/students", loo7?.studentId],
    enabled: !!loo7?.studentId,
  });

  const { data: ayat, isLoading: isLoadingQuran } = useQuery<QuranAya[]>({
    queryKey: ["/api/quran/ayat", loo7?.surahNumber, loo7?.startAyaNumber, loo7?.endAyaNumber],
    enabled: !!loo7,
  });

  const evaluateLoo7 = useMutation({
    mutationFn: (data: { score: string; scoreNotes?: string }) =>
      apiRequest("POST", `/api/loo7/${params?.id}/evaluate`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loo7"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loo7/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loo7/student"] });
      toast({
        title: "تم التقييم",
        description: selectedScore === "repeat" 
          ? "تم تسجيل التقييم وإنشاء لوح جديد للإعادة"
          : "تم تسجيل التقييم بنجاح",
      });
      navigate(`/student/${loo7?.studentId}/daily?date=${loo7?.recitationDate}`);
    },
  });

  const handleSubmit = () => {
    if (!selectedScore) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار تقييم",
        variant: "destructive",
      });
      return;
    }

    evaluateLoo7.mutate({
      score: selectedScore,
      scoreNotes: scoreNotes || undefined,
    });
  };

  if (!loo7 || !student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  const isCompleted = loo7.status === "completed";

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-card-border px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/student/${student.id}/daily?date=${loo7.recitationDate}`)}
              data-testid="button-back"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{student.name}</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(loo7.recitationDate), "EEEE، d MMMM yyyy", { locale: ar })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {LOO7_TYPE_LABELS[loo7.type as keyof typeof LOO7_TYPE_LABELS]}
            </Badge>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-foreground">{loo7.surahName}</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              الآيات {loo7.startAyaNumber} - {loo7.endAyaNumber}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Quran Text */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">نص القرآن</h2>
            </div>
            
            {isLoadingQuran ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : ayat && ayat.length > 0 ? (
              <span dir="rtl">
                {ayat.map((aya) => (
                  <span key={aya.number} className="text-right">
                    <p className="inline font-quran text-xl leading-loose text-foreground" data-testid={`aya-${aya.numberInSurah}`}>
                      {aya.text}
                      <span className="inline-block mx-2 text-base text-primary font-sans">
                        ﴿{convertToArabicNumerals(aya.numberInSurah)}﴾
                      </span>
                    </p>
                  </span>
                ))}
              </span>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                لا يمكن تحميل النص القرآني
              </p>
            )}
          </CardContent>
        </Card>

        {/* Evaluation Section */}
        {!isCompleted && (
          <>
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">التقييم</h2>
                <div className="space-y-3">
                  {SCORE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedScore(option.value)}
                        className={`w-full min-h-16 px-6 py-4 rounded-md border-2 transition-all ${
                          selectedScore === option.value
                            ? option.color
                            : "border-border bg-background hover-elevate"
                        }`}
                        data-testid={`button-score-${option.value}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6" />
                          <span className="text-lg font-semibold">{option.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-6">
                <label className="block text-base font-semibold text-foreground mb-3">
                  ملاحظات (اختياري)
                </label>
                <Textarea
                  value={scoreNotes}
                  onChange={(e) => setScoreNotes(e.target.value)}
                  placeholder="أضف ملاحظات حول الأداء..."
                  className="min-h-24 resize-none"
                  data-testid="textarea-score-notes"
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Completed Status */}
        {isCompleted && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">تم التقييم</h3>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-muted-foreground">التقييم:</span>
                  <Badge>
                    {SCORE_OPTIONS.find(s => s.value === loo7.score)?.label || loo7.score}
                  </Badge>
                </div>
                {loo7.scoreNotes && (
                  <p className="text-muted-foreground">{loo7.scoreNotes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Submit Button (Fixed at bottom) */}
      {!isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border p-4">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleSubmit}
              disabled={!selectedScore || evaluateLoo7.isPending}
              className="w-full min-h-12"
              data-testid="button-submit-evaluation"
            >
              {evaluateLoo7.isPending ? "جاري الحفظ..." : "حفظ التقييم"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function convertToArabicNumerals(num: number): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((digit) => arabicNumerals[parseInt(digit)])
    .join("");
}
