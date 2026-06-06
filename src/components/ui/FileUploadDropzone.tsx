"use client";

import React, { useCallback, useState } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { UploadCloud, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadDropzoneProps {
  onFileSelect: (file: File | null) => void;
  accept?: DropzoneOptions["accept"];
  maxSize?: number;
  error?: string;
  label?: string;
  description?: string;
}

export function FileUploadDropzone({
  onFileSelect,
  accept,
  maxSize = 5 * 1024 * 1024,
  error,
  label,
  description,
}: FileUploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
        
        // Create object URL for preview
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      }
    },
    [onFileSelect]
  );

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    onFileSelect(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
  });

  return (
    <div className="w-full space-y-2">
      {label && <label className="text-sm font-medium text-slate-200">{label}</label>}
      {description && <p className="text-xs text-slate-400">{description}</p>}
      
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          isDragActive ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-900/50 hover:bg-slate-800",
          isDragReject && "border-red-500 bg-red-500/10",
          error && "border-red-500",
          file && "border-solid border-slate-600 bg-slate-800/50"
        )}
      >
        <input {...getInputProps()} />
        
        {file ? (
          <div className="flex flex-col items-center justify-center w-full h-full p-4 relative group">
            <button
              type="button"
              onClick={removeFile}
              className="absolute top-2 right-2 p-1 bg-slate-900 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {previewUrl ? (
              <div className="w-24 h-24 relative mb-2 rounded-lg overflow-hidden border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <FileImage className="w-12 h-12 text-blue-400 mb-2" />
            )}
            <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 mb-4 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-sm">
              <UploadCloud className="w-6 h-6 text-blue-400" />
            </div>
            <p className="mb-2 text-sm text-slate-300">
              <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">JPG, PNG, or WEBP (Max 5MB)</p>
          </div>
        )}
      </div>
      {error && <p className="text-[13px] font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );
}
