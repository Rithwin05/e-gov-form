"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { aadhaarFormSchema, AadhaarFormData } from "@/types/form";
import { defaultFormValues } from "@/constants/formDefaults";

import { StepIndicator } from "@/components/ui/StepIndicator";
import { PersonalInfo } from "./PersonalInfo";
import { CategorySelect } from "./CategorySelect";
import { RequestType } from "./RequestType";
import { CertifierInfo } from "./CertifierInfo";
import { Uploads } from "./Uploads";
import { FormNavigation } from "./FormNavigation";
import { FormPreview } from "@/components/preview/FormPreview";

// Step 6 is the "Preview & Confirm" screen — no submission happens until the user
// clicks "Download PDF" on that final screen.
const STEPS = [
  "Personal Info",
  "Category",
  "Request Type",
  "Certifier",
  "Uploads",
  "Preview",
];

export function AadhaarForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AadhaarFormData>({
    resolver: zodResolver(aadhaarFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const processForm = async (data: AadhaarFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aadhaar_certificate.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      console.error("Error generating PDF:", error);
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`There was an error generating the PDF: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = async () => {
    const fieldsToValidate: (keyof AadhaarFormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate.push("aadhaarNumber", "fullName", "houseNo", "street", "landmark", "area", "city", "postOffice", "district", "state", "pinCode");
    } else if (currentStep === 2) {
      fieldsToValidate.push("residentCategory");
    } else if (currentStep === 3) {
      fieldsToValidate.push("requestType");
    } else if (currentStep === 4) {
      fieldsToValidate.push("certifierName", "certifierDesignation", "certifierOfficeAddress", "certifierContact", "certifierType");
    }
    // Step 5 (Uploads) and Step 6 (Preview) need no additional validation

    const isStepValid = await form.trigger(fieldsToValidate);
    return isStepValid;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="w-full">
      <div className="mb-8 hidden sm:block">
        <StepIndicator currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />
      </div>

      <form onSubmit={form.handleSubmit(processForm)} className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: currentStep === STEPS.length ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 1 && <PersonalInfo form={form} />}
            {currentStep === 2 && <CategorySelect form={form} />}
            {currentStep === 3 && <RequestType form={form} />}
            {currentStep === 4 && <CertifierInfo form={form} />}
            {currentStep === 5 && <Uploads form={form} />}
            {currentStep === 6 && <FormPreview form={form} />}
          </motion.div>
        </AnimatePresence>

        <FormNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
}
