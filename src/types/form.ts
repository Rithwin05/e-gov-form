import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Helper to validate file size and type
const imageSchema = z
  .any()
  .refine((file) => file instanceof File, "File is required")
  .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
    "Only .jpg, .jpeg, .png and .webp formats are supported."
  )
  .optional(); // Optional because we might allow skipping uploads until the end

export const aadhaarFormSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits"),
  fullName: z.string().min(1, "Full name is required").max(100, "Name must be under 100 characters"),
  houseNo: z.string().min(1, "House No / Building / Apartment is required"),
  street: z.string().optional(),
  landmark: z.string().optional(),
  area: z.string().optional(),
  city: z.string().min(1, "Village / Town / City is required"),
  postOffice: z.string().optional(),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  pinCode: z.string().regex(/^\d{6}$/, "PIN code must be exactly 6 digits"),
  
  residentCategory: z.enum(["Resident", "NRI", "OCI", "LTV", "Nepal", "Bhutan", "Foreign"], {
    error: "Please select a resident category"
  }),
  
  requestType: z.enum(["NewEnrolment", "UpdateRequest"], {
    error: "Please select a request type"
  }),

  certifierName: z.string().min(1, "Certifier name is required"),
  certifierDesignation: z.string().min(1, "Certifier designation is required"),
  certifierOfficeAddress: z.string().min(1, "Certifier office address is required"),
  certifierContact: z.string().regex(/^\d{10}$/, "Contact number must be exactly 10 digits"),

  photo: z.any().optional(), // Will store File | null in the state
  signature: z.any().optional(),
});

export type AadhaarFormData = z.infer<typeof aadhaarFormSchema>;
