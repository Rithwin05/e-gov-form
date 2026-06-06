import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AadhaarFormData } from "@/types/form";
import { RadioCard } from "@/components/ui/RadioCard";

interface RequestTypeProps {
  form: UseFormReturn<AadhaarFormData>;
}

export function RequestType({ form }: RequestTypeProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-white">Request Type</h2>
        <p className="text-slate-400 text-sm mt-1">Is this a new enrolment or an update to an existing Aadhaar?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RadioCard
          label="New Enrolment"
          description="Applying for Aadhaar for the first time"
          value="NewEnrolment"
          {...register("requestType")}
          error={errors.requestType?.message as string}
        />
        <RadioCard
          label="Update Request"
          description="Updating details on an existing Aadhaar"
          value="UpdateRequest"
          {...register("requestType")}
          error={errors.requestType?.message as string}
        />
      </div>

      {errors.requestType && (
        <p className="text-sm font-medium text-red-500 mt-2">{errors.requestType.message as string}</p>
      )}
    </div>
  );
}
