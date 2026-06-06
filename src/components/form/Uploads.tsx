"use client";

import React from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { AadhaarFormData } from "@/types/form";
import { FileUploadDropzone } from "@/components/ui/FileUploadDropzone";
import { CheckSquare, Square } from "lucide-react";

interface UploadsProps {
  form: UseFormReturn<AadhaarFormData>;
}

export function Uploads({ form }: UploadsProps) {
  const { setValue, control, formState: { errors } } = form;
  const fillChecklist = useWatch({ control, name: "fillChecklist" });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-white">Upload Documents</h2>
        <p className="text-slate-400 text-sm mt-1">Provide your recent passport size photograph and signature.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FileUploadDropzone
          label="Passport Photograph"
          description="Recent color photo with clear background"
          accept={{ "image/*": [".jpeg", ".jpg", ".png", ".webp"] }}
          onFileSelect={(file) => setValue("photo", file, { shouldValidate: true })}
          error={errors.photo?.message as string}
        />

        <FileUploadDropzone
          label="Signature"
          description="Clear scan of your signature"
          accept={{ "image/*": [".jpeg", ".jpg", ".png", ".webp"] }}
          onFileSelect={(file) => setValue("signature", file, { shouldValidate: true })}
          error={errors.signature?.message as string}
        />
      </div>

      {/* ── Checklist for Certifier ─────────────────────────────────────────── */}
      <div className="border border-slate-700 rounded-xl p-5 bg-slate-800/40">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">
          Checklist for Certifier
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          The form includes a mandatory checklist section for the certifying officer. Enable the toggle
          to have all 5 checklist boxes pre-filled with tick marks on the generated PDF.
        </p>

        {/* Checklist preview */}
        <ul className="text-xs text-slate-400 space-y-1 mb-4 pl-2">
          {[
            "No overwriting",
            "Issue date is filled",
            "Resident's signature",
            "Certifier's details",
            "Resident's photo is cross signed and cross stamped",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className={fillChecklist ? "text-emerald-400" : "text-slate-600"}>✔</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setValue("fillChecklist", !fillChecklist)}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${
            fillChecklist
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500"
          }`}
        >
          {fillChecklist ? (
            <CheckSquare className="w-5 h-5" />
          ) : (
            <Square className="w-5 h-5" />
          )}
          {fillChecklist ? "Checklist will be filled ✔" : "Click to auto-fill checklist"}
        </button>
      </div>
    </div>
  );
}
