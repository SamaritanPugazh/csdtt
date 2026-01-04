import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isValidRollNumber } from "@/lib/validations";

interface SubjectBatchPreference {
  course_code: string;
  batch: "B1" | "B2";
}

interface StudentData {
  name: string;
  rollNumber: string;
}

interface StudentContextType {
  student: StudentData | null;
  subjectBatches: SubjectBatchPreference[];
  isLoading: boolean;
  setStudentName: (name: string) => void;
  setRollNumber: (rollNumber: string) => boolean;
  getSubjectBatch: (courseCode: string) => "B1" | "B2";
  updateSubjectBatch: (courseCode: string, batch: "B1" | "B2") => Promise<void>;
  clearStudent: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const STUDENT_STORAGE_KEY = "csd_student_data";
const BATCH_CONFIGURABLE_COURSES = ["AI23331", "CD23631", "CD23632"];

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [subjectBatches, setSubjectBatches] = useState<SubjectBatchPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load student data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.name && parsed.rollNumber && isValidRollNumber(parsed.rollNumber)) {
          setStudent(parsed);
        }
      } catch {
        localStorage.removeItem(STUDENT_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Load subject batch preferences when student is set
  useEffect(() => {
    const fetchBatchPreferences = async () => {
      if (!student?.rollNumber) {
        setSubjectBatches([]);
        return;
      }

      const { data } = await supabase
        .from("subject_batch_preferences")
        .select("course_code, batch")
        .eq("roll_number", student.rollNumber);

      if (data) {
        setSubjectBatches(data as SubjectBatchPreference[]);
      }
    };

    fetchBatchPreferences();
  }, [student?.rollNumber]);

  const setStudentName = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName) {
      const newStudent = { name: trimmedName, rollNumber: "" };
      setStudent(newStudent);
      // Don't save to localStorage yet - wait for roll number
    }
  };

  const setRollNumber = (rollNumber: string): boolean => {
    const trimmed = rollNumber.trim();
    if (!isValidRollNumber(trimmed)) {
      return false;
    }

    if (student?.name) {
      const updatedStudent = { name: student.name, rollNumber: trimmed };
      setStudent(updatedStudent);
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(updatedStudent));
      return true;
    }
    return false;
  };

  const getSubjectBatch = (courseCode: string): "B1" | "B2" => {
    const pref = subjectBatches.find((p) => p.course_code === courseCode);
    return pref?.batch || "B1"; // Default to B1
  };

  const updateSubjectBatch = async (courseCode: string, batch: "B1" | "B2") => {
    if (!student?.rollNumber || !BATCH_CONFIGURABLE_COURSES.includes(courseCode)) {
      return;
    }

    // Upsert the preference
    const { error } = await supabase
      .from("subject_batch_preferences")
      .upsert(
        {
          roll_number: student.rollNumber,
          course_code: courseCode,
          batch,
        },
        { onConflict: "roll_number,course_code" }
      );

    if (!error) {
      setSubjectBatches((prev) => {
        const existing = prev.findIndex((p) => p.course_code === courseCode);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { course_code: courseCode, batch };
          return updated;
        }
        return [...prev, { course_code: courseCode, batch }];
      });
    }
  };

  const clearStudent = () => {
    setStudent(null);
    setSubjectBatches([]);
    localStorage.removeItem(STUDENT_STORAGE_KEY);
  };

  return (
    <StudentContext.Provider
      value={{
        student,
        subjectBatches,
        isLoading,
        setStudentName,
        setRollNumber,
        getSubjectBatch,
        updateSubjectBatch,
        clearStudent,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return context;
}

export { BATCH_CONFIGURABLE_COURSES };
