import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, UserPlus, Edit, Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Student } from "@shared/schema";

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const deleteStudent = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الطالب بنجاح",
      });
      setDeletingStudent(null);
    },
  });

  const filteredStudents = students?.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-card-border px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">الطلاب</h1>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-student">
              <UserPlus className="w-5 h-5 ml-2" />
              إضافة طالب
            </Button>
          </div>

          {/* Search */}
          <Input
            type="search"
            placeholder="ابحث عن طالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            data-testid="input-search-students"
          />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} data-testid={`card-student-${student.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">{student.name}</h3>
                      {student.age && (
                        <p className="text-sm text-muted-foreground">العمر: {student.age}</p>
                      )}
                      {student.contact && (
                        <p className="text-sm text-muted-foreground">التواصل: {student.contact}</p>
                      )}
                      {student.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{student.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingStudent(student)}
                      data-testid={`button-edit-${student.id}`}
                    >
                      <Edit className="w-4 h-4 ml-2" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingStudent(student)}
                      data-testid={`button-delete-${student.id}`}
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </Button>
                    <Link href={`/loo7/create?studentId=${student.id}`}>
                      <Button size="sm" data-testid={`button-create-loo7-${student.id}`}>
                        <Plus className="w-4 h-4 ml-2" />
                        إنشاء لوح
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">لا يوجد طلاب</h3>
              <p className="text-muted-foreground mb-6">ابدأ بإضافة أول طالب</p>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-student">
                <UserPlus className="w-5 h-5 ml-2" />
                إضافة طالب
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <StudentFormDialog
        student={editingStudent}
        isOpen={isAddDialogOpen || !!editingStudent}
        onClose={() => {
          setIsAddDialogOpen(false);
          setEditingStudent(null);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingStudent} onOpenChange={() => setDeletingStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الطالب "{deletingStudent?.name}"؟ سيتم حذف جميع الألواح المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingStudent && deleteStudent.mutate(deletingStudent.id)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StudentFormDialog({
  student,
  isOpen,
  onClose,
}: {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    contact: "",
    notes: "",
  });
  const { toast } = useToast();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen && student) {
      setFormData({
        name: student.name,
        age: student.age?.toString() || "",
        contact: student.contact || "",
        notes: student.notes || "",
      });
    } else if (isOpen && !student) {
      setFormData({ name: "", age: "", contact: "", notes: "" });
    }
  }, [isOpen, student]);

  const createStudent = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/students", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "تم الإضافة",
        description: "تم إضافة الطالب بنجاح",
      });
      onClose();
    },
  });

  const updateStudent = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/students/${student?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "تم التعديل",
        description: "تم تعديل بيانات الطالب بنجاح",
      });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : undefined,
      contact: formData.contact || undefined,
      notes: formData.notes || undefined,
    };

    if (student) {
      updateStudent.mutate(data);
    } else {
      createStudent.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{student ? "تعديل الطالب" : "إضافة طالب جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الاسم <span className="text-destructive">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="اسم الطالب"
              required
              data-testid="input-student-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">العمر</label>
            <Input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="العمر (اختياري)"
              data-testid="input-student-age"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">معلومات التواصل</label>
            <Input
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="رقم الهاتف أو البريد الإلكتروني (اختياري)"
              data-testid="input-student-contact"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">ملاحظات</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ملاحظات إضافية (اختياري)"
              data-testid="input-student-notes"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createStudent.isPending || updateStudent.isPending}
              data-testid="button-save-student"
            >
              {createStudent.isPending || updateStudent.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
