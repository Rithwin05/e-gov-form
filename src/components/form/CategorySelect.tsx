import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AadhaarFormData } from "@/types/form";
import { RadioCard } from "@/components/ui/RadioCard";

interface CategorySelectProps {
  form: UseFormReturn<AadhaarFormData>;
}

export function CategorySelect({ form }: CategorySelectProps) {
  const { register, formState: { errors } } = form;

  const categories = [
    { value: "Resident", label: "Resident", desc: "Indian resident staying in India" },
    { value: "NRI", label: "Non-Resident Indian (NRI)", desc: "Indian citizen living abroad" },
    { value: "OCI", label: "Overseas Citizen of India (OCI)", desc: "Foreign citizen of Indian origin" },
    { value: "LTV", label: "Long Term Visa (LTV)", desc: "Foreign national on LTV" },
    { value: "Nepal", label: "Nepal National", desc: "Citizen of Nepal" },
    { value: "Bhutan", label: "Bhutan National", desc: "Citizen of Bhutan" },
    { value: "Foreign", label: "Other Foreign National", desc: "Citizen of any other country" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-white">Resident Category</h2>
        <p className="text-slate-400 text-sm mt-1">Select your current residency status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <RadioCard
            key={cat.value}
            label={cat.label}
            description={cat.desc}
            value={cat.value}
            {...register("residentCategory")}
            error={errors.residentCategory?.message as string}
          />
        ))}
      </div>
      
      {errors.residentCategory && (
        <p className="text-sm font-medium text-red-500 mt-2">{errors.residentCategory.message as string}</p>
      )}
    </div>
  );
}
