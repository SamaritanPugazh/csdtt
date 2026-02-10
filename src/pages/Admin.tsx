import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone, Calendar, Users, BookOpen, FileText } from "lucide-react";
import { AnnouncementManager } from "@/components/admin/AnnouncementManager";
import { TimetableManager } from "@/components/admin/TimetableManager";
import { TeacherManager } from "@/components/admin/TeacherManager";
import { SubjectManager } from "@/components/admin/SubjectManager";
import { CourseUnitsManager } from "@/components/admin/CourseUnitsManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ADMIN_SECTIONS = [
  { id: "announcements", label: "Announcements", icon: Megaphone, description: "Manage banners & alerts" },
  { id: "timetable", label: "Timetable", icon: Calendar, description: "Schedule classes & labs" },
  { id: "teachers", label: "Teachers", icon: Users, description: "Manage staff profiles" },
  { id: "subjects", label: "Subjects", icon: BookOpen, description: "Course configuration" },
  { id: "syllabus", label: "Syllabus", icon: FileText, description: "Unit-wise content" },
] as const;

type SectionId = typeof ADMIN_SECTIONS[number]["id"];

export default function Admin() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/admin-login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading || !isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse text-center text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "announcements": return <AnnouncementManager />;
      case "timetable": return <TimetableManager />;
      case "teachers": return (
        <Card><CardHeader><CardTitle className="text-xl">Teacher Management</CardTitle></CardHeader><CardContent><TeacherManager /></CardContent></Card>
      );
      case "subjects": return (
        <Card><CardHeader><CardTitle className="text-xl">Subject Management</CardTitle></CardHeader><CardContent><SubjectManager /></CardContent></Card>
      );
      case "syllabus": return <CourseUnitsManager />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => activeSection ? setActiveSection(null) : navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-space font-bold text-foreground">
              {activeSection ? ADMIN_SECTIONS.find(s => s.id === activeSection)?.label : "Admin Portal"}
            </h1>
            <p className="text-muted-foreground">
              {activeSection ? "Manage content" : "Select a section to manage"}
            </p>
          </div>
        </div>

        {activeSection ? (
          <div className="animate-fade-in">
            {renderSection()}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {ADMIN_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "p-6 rounded-xl border bg-card text-left transition-all duration-200",
                    "hover:shadow-lg hover:scale-[1.02] hover:border-primary/30",
                    "active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{section.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
