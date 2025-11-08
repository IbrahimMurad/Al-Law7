import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Student, Loo7 } from "@shared/schema";

const LOO7_TYPE_LABELS = {
  new: { label: "جديد", color: "bg-primary text-primary-foreground" },
  near_past: { label: "قريب", color: "bg-chart-2 text-white" },
  far_past: { label: "بعيد", color: "bg-chart-4 text-white" },
};

export default function StudentDaily() {
  const [, params] = useRoute("/student/:id/daily");
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

  const { data: student } = useQuery<Student>({
    queryKey: ["/api/students", params?.id],
  });

  const { data: loo7s, isLoading } = useQuery<Loo7[]>({
    queryKey: ["/api/loo7/student", params?.id, date],
  });

  const formattedDate = format(new Date(date), "EEEE، d MMMM yyyy", { locale: ar });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-card-border px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/?date=${date}`)}
              data-testid="button-back"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{student?.name}</h1>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loo7s && loo7s.length > 0 ? (
          <div className="space-y-4">
            {loo7s.map((loo7) => {
              const typeConfig = LOO7_TYPE_LABELS[loo7.type as keyof typeof LOO7_TYPE_LABELS];
              
              return (
                <Link key={loo7.id} href={`/loo7/${loo7.id}/evaluate`}>
                  <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-loo7-${loo7.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <Badge className={typeConfig.color} data-testid={`badge-type-${loo7.id}`}>
                          {typeConfig.label}
                        </Badge>
                        {loo7.status === "completed" ? (
                          <div className="flex items-center gap-2 text-primary">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-medium">مكتمل</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-medium">معلق</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {loo7.surahName}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm">
                          الآيات {loo7.startAyaNumber} - {loo7.endAyaNumber}
                        </span>
                        <span className="text-sm">
                          ({loo7.endAyaNumber - loo7.startAyaNumber + 1} آيات)
                        </span>
                      </div>

                      {loo7.status === "completed" && loo7.score && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">التقييم:</span>
                            <Badge variant="outline" data-testid={`badge-score-${loo7.id}`}>
                              {getScoreLabel(loo7.score)}
                            </Badge>
                          </div>
                          {loo7.scoreNotes && (
                            <p className="text-sm text-muted-foreground mt-2">{loo7.scoreNotes}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد ألواح</h3>
              <p className="text-muted-foreground mb-6">لم يتم تعيين أي ألواح لهذا اليوم</p>
              <Link href={`/loo7/create?studentId=${params?.id}`}>
                <Button data-testid="button-create-loo7">
                  إنشاء لوح جديد
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function getScoreLabel(score: string): string {
  const labels: Record<string, string> = {
    excellent: "ممتاز",
    good: "جيد",
    weak: "ضعيف",
    repeat: "إعادة",
  };
  return labels[score] || score;
}
