import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone, Calendar, Users, BookOpen } from "lucide-react";
import { AnnouncementManager } from "@/components/admin/AnnouncementManager";
import { TimetableManager } from "@/components/admin/TimetableManager";
import { TeacherManager } from "@/components/admin/TeacherManager";
import { SubjectManager } from "@/components/admin/SubjectManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Admin() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("announcements");

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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-space font-bold text-foreground">
              Admin Portal
            </h1>
            <p className="text-muted-foreground">
              Manage announcements, teachers, subjects and timetable
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Announcements</span>
            </TabsTrigger>
            <TabsTrigger value="timetable" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Timetable</span>
            </TabsTrigger>
            <TabsTrigger value="teachers" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Teachers</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Subjects</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="animate-fade-in">
            <AnnouncementManager />
          </TabsContent>

          <TabsContent value="timetable" className="animate-fade-in">
            <TimetableManager />
          </TabsContent>

          <TabsContent value="teachers" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Teacher Management</CardTitle>
              </CardHeader>
              <CardContent>
                <TeacherManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Subject Management</CardTitle>
              </CardHeader>
              <CardContent>
                <SubjectManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
