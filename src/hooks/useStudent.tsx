import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isValidRollNumber } from "@/lib/validations";

interface SubjectBatchPreference {
  course_code: string;
  batch: "B1" | "B2";
}

interface StudentData {
  rollNumber: string;
}

interface StudentContextType {
  student: StudentData | null;
  subjectBatches: SubjectBatchPreference[];
  isLoading: boolean;
  isNewStudent: boolean | null;
  setRollNumber: (rollNumber: string) => Promise<boolean>;
  getSubjectBatch: (courseCode: string) => "B1" | "B2";
  saveBatchPreferences: (batches: Record<string, "B1" | "B2">) => Promise<void>;
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
  const [isNewStudent, setIsNewStudent] = useState<boolean | null>(null);

  // Load student data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.rollNumber && isValidRollNumber(parsed.rollNumber)) {
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

      if (data && data.length > 0) {
        setSubjectBatches(data as SubjectBatchPreference[]);
      }
    };

    fetchBatchPreferences();
  }, [student?.rollNumber]);

  const setRollNumber = async (rollNumber: string): Promise<boolean> => {
    const trimmed = rollNumber.trim();
    if (!isValidRollNumber(trimmed)) {
      return false;
    }

    // Check if this roll number has existing preferences
    const { data } = await supabase
      .from("subject_batch_preferences")
      .select("course_code, batch")
      .eq("roll_number", trimmed);

    const hasPreferences = data && data.length > 0;
    setIsNewStudent(!hasPreferences);

    if (hasPreferences) {
      // Returning student - set data and save to localStorage
      const newStudent = { rollNumber: trimmed };
      setStudent(newStudent);
      setSubjectBatches(data as SubjectBatchPreference[]);
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(newStudent));
    } else {
      // New student - just set roll number temporarily, don't save yet
      setStudent({ rollNumber: trimmed });
    }

    return true;
  };

  const saveBatchPreferences = async (batches: Record<string, "B1" | "B2">) => {
    if (!student?.rollNumber) return;

    // Insert all preferences
    const inserts = Object.entries(batches).map(([course_code, batch]) => ({
      roll_number: student.rollNumber,
      course_code,
      batch,
    }));

    const { error } = await supabase
      .from("subject_batch_preferences")
      .insert(inserts);

    if (!error) {
      setSubjectBatches(
        Object.entries(batches).map(([course_code, batch]) => ({ course_code, batch }))
      );
      setIsNewStudent(false);
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(student));
    }
  };

  const getSubjectBatch = (courseCode: string): "B1" | "B2" => {
    const pref = subjectBatches.find((p) => p.course_code === courseCode);
    return pref?.batch || "B1";
  };

  const updateSubjectBatch = async (courseCode: string, batch: "B1" | "B2") => {
    if (!student?.rollNumber || !BATCH_CONFIGURABLE_COURSES.includes(courseCode)) {
      return;
    }

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
    setIsNewStudent(null);
    localStorage.removeItem(STUDENT_STORAGE_KEY);
  };

  return (
    <StudentContext.Provider
      value={{
        student,
        subjectBatches,
        isLoading,
        isNewStudent,
        setRollNumber,
        getSubjectBatch,
        saveBatchPreferences,
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
