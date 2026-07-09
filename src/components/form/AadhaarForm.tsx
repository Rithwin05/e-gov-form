"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const [currentStep, setCurrentStep]   = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl]     = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Keep a ref to the raw blob so download never needs a second API call
  const pdfBlobRef    = useRef<Blob | null>(null);
  // Stable ref for the form instance (avoids stale-closure issues in callbacks)
  const formRef = useRef<typeof form | null>(null);

  const form = useForm<AadhaarFormData>({
    resolver: zodResolver(aadhaarFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  // Keep the ref in sync after every render — safe to write refs in effects
  useEffect(() => {
    formRef.current = form;
  });

  // ── Build FormData snapshot ───────────────────────────────────────────────
  function buildFormData() {
    const data = formRef.current!.getValues();
    const fd   = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        fd.append(key, value);
      } else if (value !== undefined && value !== null) {
        fd.append(key, String(value));
      }
    });
    return fd;
  }

  // ── Generate preview — always fresh, no stale-closure risk ───────────────
  async function generatePreview() {
    // Clean up any previous blob URL
    setPdfBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewError(null);
    pdfBlobRef.current = null;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        body: buildFormData(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { details?: string };
        throw new Error(err.details ?? `Server error ${res.status}`);
      }

      const blob = await res.blob();
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
  }

  // ── Download — uses the cached blob, no extra API call ───────────────────
  async function handleDownload() {
    if (isDownloading) return;

    let blob = pdfBlobRef.current;

    // Safety: if blob was somehow lost, re-generate silently
    if (!blob) {
      setIsDownloading(true);
      try {
        const res = await fetch("/api/generate-pdf", {
          method: "POST",
          body: buildFormData(),
        });
        if (!res.ok) throw new Error("Failed to generate PDF");
        blob = await res.blob();
        pdfBlobRef.current = blob;
      } catch (err) {
        alert("Could not download PDF. Please try again.");
        console.error(err);
        setIsDownloading(false);
        return;
      }
    }

    setIsDownloading(true);
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = "aadhaar_certificate.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setIsDownloading(false);
  }

  // ── Step validation ───────────────────────────────────────────────────────
  async function validateStep() {
    const fields: (keyof AadhaarFormData)[] = [];
    if (currentStep === 1) {
      fields.push(
        "aadhaarNumber", "fullName", "houseNo", "street", "landmark",
        "area", "city", "postOffice", "district", "state", "pinCode"
      );
    } else if (currentStep === 2) {
      fields.push("residentCategory");
    } else if (currentStep === 3) {
      fields.push("requestType");
    } else if (currentStep === 4) {
      fields.push(
        "certifierName", "certifierDesignation",
        "certifierOfficeAddress", "certifierContact", "certifierType"
      );
    }
    return form.trigger(fields);
  }

  async function handleNext() {
    const isValid = await validateStep();
    if (!isValid) return;

    const next = Math.min(currentStep + 1, STEPS.length);
    setCurrentStep(next);

    // Fire preview generation as soon as we land on the preview step
    if (next === PREVIEW_STEP) {
      // setTimeout 0 — let React commit the new step render first
      setTimeout(() => generatePreview(), 0);
    }
  }

  function handlePrev() {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <div className="mb-8 hidden sm:block">
        <StepIndicator
          currentStep={currentStep}
          totalSteps={STEPS.length}
          steps={STEPS}
        />
      </div>

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
                onRegenerate={generatePreview}
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
