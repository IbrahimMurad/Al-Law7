import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";
import { Calendar, Users, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Student, Loo7 } from "@shared/schema";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: dailyAssignments, isLoading } = useQuery<{
    student: Student;
    loo7Count: number;
    pendingCount: number;
  }[]>({
    queryKey: ["/api/loo7/daily", selectedDate],
  });

  const formattedDate = format(new Date(selectedDate), "EEEE، d MMMM yyyy", { locale: ar });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-card-border px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
            <Link href="/students">
              <Button variant="ghost" size="icon" data-testid="button-students">
                <Users className="w-5 h-5" />
              </Button>
            </Link>
          </div>
          
          {/* Date Selector */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-4 h-11 bg-background border border-input rounded-md text-foreground"
              data-testid="input-date-selector"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{formattedDate}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        {dailyAssignments && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
                    <p className="text-2xl font-bold text-foreground">{dailyAssignments.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الألواح المعلقة</p>
                    <p className="text-2xl font-bold text-foreground">
                      {dailyAssignments.reduce((sum, item) => sum + item.pendingCount, 0)}
                    </p>
                  </div>
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Students List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dailyAssignments && dailyAssignments.length > 0 ? (
          <div className="space-y-4">
            {dailyAssignments.map(({ student, loo7Count, pendingCount }) => (
              <Link key={student.id} href={`/student/${student.id}/daily?date=${selectedDate}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-student-${student.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">{student.name}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" data-testid={`badge-loo7-count-${student.id}`}>
                            {loo7Count} ألواح
                          </Badge>
                          {pendingCount > 0 && (
                            <Badge variant="outline" className="border-primary text-primary" data-testid={`badge-pending-${student.id}`}>
                              {pendingCount} معلق
                            </Badge>
                          )}
                          {pendingCount === 0 && loo7Count > 0 && (
                            <Badge variant="outline" className="border-primary bg-primary/10 text-primary">
                              مكتمل ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-muted-foreground">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد ألواح لهذا اليوم</h3>
              <p className="text-muted-foreground mb-6">ابدأ بإضافة ألواح جديدة للطلاب</p>
              <Link href="/loo7/create">
                <Button data-testid="button-create-loo7">
                  إنشاء لوح جديد
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      {/* FAB */}
      <Link href="/loo7/create">
        <Button 
          size="icon" 
          className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-lg"
          data-testid="fab-create-loo7"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </Button>
      </Link>
    </div>
  );
}
