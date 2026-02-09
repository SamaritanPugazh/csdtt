import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, Users, Hash, FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Subject {
  id: string;
  code: string;
  name: string;
  department: string | null;
  split_students: boolean;
  num_batches: number | null;
}

interface CourseUnit {
  id: string;
  unit_number: number;
  unit_name: string;
  syllabus: string | null;
}

export default function CourseDetails() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseCode) return;

      // Fetch subject
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("id, code, name, department, split_students, num_batches")
        .eq("code", courseCode)
        .single();

      if (subjectData) {
        setSubject(subjectData);

        // Fetch units for this subject
        const { data: unitsData } = await supabase
          .from("course_units")
          .select("id, unit_number, unit_name, syllabus")
          .eq("subject_id", subjectData.id)
          .order("unit_number", { ascending: true });

        if (unitsData) {
          setUnits(unitsData);
        }
      }

      setIsLoading(false);
    };

    fetchCourseDetails();
  }, [courseCode]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!subject) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
              <p className="text-muted-foreground">
                The course with code "{courseCode}" could not be found.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Card className="animate-fade-in mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className="font-mono mb-2">
                  <Hash className="w-3 h-3 mr-1" />
                  {subject.code}
                </Badge>
                <CardTitle className="text-2xl font-space">{subject.name}</CardTitle>
                {subject.department && (
                  <p className="text-muted-foreground mt-1">{subject.department}</p>
                )}
              </div>
              {subject.split_students && subject.num_batches && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {subject.num_batches} Batches
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Course Units */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Syllabus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No syllabus units have been added yet.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {units.map((unit) => (
                  <AccordionItem key={unit.id} value={unit.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="shrink-0">
                          Unit {unit.unit_number}
                        </Badge>
                        <span className="text-left font-medium">{unit.unit_name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {unit.syllabus ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none pl-4 pt-2">
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {unit.syllabus}
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic pl-4 pt-2">
                          No syllabus content available.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
