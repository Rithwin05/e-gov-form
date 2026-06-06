import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AadhaarFormData } from "@/types/form";
import { FileUploadDropzone } from "@/components/ui/FileUploadDropzone";

interface UploadsProps {
  form: UseFormReturn<AadhaarFormData>;
}

export function Uploads({ form }: UploadsProps) {
  const { setValue, formState: { errors } } = form;

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
    </div>
  );
}
