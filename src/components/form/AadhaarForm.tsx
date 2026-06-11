"use client";

import React, { useState, useRef, useCallback } from "react";
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

const STEPS = [
  "Personal Info",
  "Category",
  "Request Type",
  "Certifier",
  "Uploads",
  "Preview",
];

const PREVIEW_STEP = 6;

export function AadhaarForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl]       = useState<string | null>(null);
  const [previewError, setPreviewError]   = useState<string | null>(null);

  // Keep a ref to the raw blob so we can download it without re-generating
  const pdfBlobRef = useRef<Blob | null>(null);

  const form = useForm<AadhaarFormData>({
    resolver: zodResolver(aadhaarFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  // ── Build FormData from form values ──────────────────────────────────────────
  const buildFormData = useCallback(() => {
    const data = form.getValues();
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        fd.append(key, value);
      } else if (value !== undefined && value !== null) {
        fd.append(key, String(value));
      }
    });
    return fd;
  }, [form]);

  // ── Generate the PDF and store the blob URL ───────────────────────────────
  const generatePreview = useCallback(async () => {
    // Revoke any previous blob URL
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setPreviewError(null);
    pdfBlobRef.current = null;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        body: buildFormData(),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || `Server error ${response.status}`);
      }

      const blob = await response.blob();
      pdfBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setPreviewError(msg);
      console.error("Preview generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [buildFormData, pdfBlobUrl]);

  // ── Download — uses already-generated blob, no extra API call ─────────────
  const handleDownload = useCallback(async () => {
    if (isDownloading) return;

    // If for some reason the blob isn't ready yet, re-generate
    if (!pdfBlobRef.current) {
      setIsDownloading(true);
      try {
        const response = await fetch("/api/generate-pdf", {
          method: "POST",
          body: buildFormData(),
        });
        if (!response.ok) throw new Error("Failed to generate PDF");
        pdfBlobRef.current = await response.blob();
      } catch (err) {
        alert("Could not download PDF. Please try again.");
        console.error(err);
        setIsDownloading(false);
        return;
      }
    }

    const url = URL.createObjectURL(pdfBlobRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aadhaar_certificate.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Delay revoke so the browser has time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setIsDownloading(false);
  }, [buildFormData, isDownloading]);

  // ── Step validation ───────────────────────────────────────────────────────
  const validateStep = async () => {
    const fields: (keyof AadhaarFormData)[] = [];
    if (currentStep === 1) {
      fields.push("aadhaarNumber", "fullName", "houseNo", "street", "landmark", "area", "city", "postOffice", "district", "state", "pinCode");
    } else if (currentStep === 2) {
      fields.push("residentCategory");
    } else if (currentStep === 3) {
      fields.push("requestType");
    } else if (currentStep === 4) {
      fields.push("certifierName", "certifierDesignation", "certifierOfficeAddress", "certifierContact", "certifierType");
    }
    return form.trigger(fields);
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (!isValid) return;

    const next = Math.min(currentStep + 1, STEPS.length);
    setCurrentStep(next);

    // Auto-generate preview when entering the Preview step
    if (next === PREVIEW_STEP) {
      generatePreview();
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

      {/* No <form> submit needed — download is handled imperatively */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: currentStep === PREVIEW_STEP ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 1 && <PersonalInfo form={form} />}
            {currentStep === 2 && <CategorySelect form={form} />}
            {currentStep === 3 && <RequestType form={form} />}
            {currentStep === 4 && <CertifierInfo form={form} />}
            {currentStep === 5 && <Uploads form={form} />}
            {currentStep === PREVIEW_STEP && (
              <FormPreview
                pdfBlobUrl={pdfBlobUrl}
                isGenerating={isGenerating}
                error={previewError}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <FormNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onDownload={handleDownload}
          isGenerating={isGenerating}
          isDownloading={isDownloading}
          hasPdf={!!pdfBlobUrl}
        />
      </div>
    </div>
  );
}
