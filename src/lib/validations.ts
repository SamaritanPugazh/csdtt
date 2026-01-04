import { z } from "zod";

// Valid roll numbers: 231701001 to 231701063 and 231701501
export const isValidRollNumber = (rollNumber: string): boolean => {
  const num = parseInt(rollNumber, 10);
  if (isNaN(num)) return false;
  
  // Check if it's in range 231701001-231701063 or exactly 231701501
  return (num >= 231701001 && num <= 231701063) || num === 231701501;
};

export const studentNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
});

export const rollNumberSchema = z.object({
  rollNumber: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "Roll number must be exactly 9 digits")
    .refine(isValidRollNumber, "Invalid roll number. Must be 231701001-231701063 or 231701501"),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password must be less than 100 characters"),
});

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(2000, "Content must be less than 2000 characters"),
  is_active: z.boolean().default(true),
});

export const timetableEntrySchema = z.object({
  day: z.enum(["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
  time_slot: z.string().trim().min(1, "Time slot is required"),
  course_code: z.string().trim().min(1, "Course code is required"),
  subject_name: z.string().trim().min(1, "Subject name is required"),
  class_type: z.enum(["Theory", "Lab"]),
  batch: z.enum(["B1", "B2", "ALL"]),
  room_number: z.string().trim().min(1, "Room number is required"),
  staff_name: z.string().trim().optional(),
});

export type StudentNameFormData = z.infer<typeof studentNameSchema>;
export type RollNumberFormData = z.infer<typeof rollNumberSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type AnnouncementFormData = z.infer<typeof announcementSchema>;
export type TimetableEntryFormData = z.infer<typeof timetableEntrySchema>;
