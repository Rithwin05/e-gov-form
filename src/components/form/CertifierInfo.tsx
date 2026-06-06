import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AadhaarFormData } from "@/types/form";
import { InputField } from "@/components/ui/InputField";
import { SelectField } from "@/components/ui/SelectField";

interface CertifierInfoProps {
  form: UseFormReturn<AadhaarFormData>;
}

export function CertifierInfo({ form }: CertifierInfoProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-white">Certifier Details</h2>
        <p className="text-slate-400 text-sm mt-1">Information of the authorized official certifying this document.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Name of Certifier"
          placeholder="e.g. Jane Doe"
          required
          {...register("certifierName")}
          error={errors.certifierName?.message as string}
        />
        <InputField
          label="Designation"
          placeholder="e.g. Gazetted Officer"
          required
          {...register("certifierDesignation")}
          error={errors.certifierDesignation?.message as string}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <InputField
          label="Office Address"
          placeholder="Full address of the certifier's office"
          required
          {...register("certifierOfficeAddress")}
          error={errors.certifierOfficeAddress?.message as string}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Contact Number"
          placeholder="10-digit mobile number"
          maxLength={10}
          required
          {...register("certifierContact")}
          error={errors.certifierContact?.message as string}
        />
        <SelectField
          label="Certifier Type"
          required
          options={[
            { value: "GazettedA", label: "Gazetted Officer Group 'A' / EPFO" },
            { value: "GazettedB", label: "Gazetted Officer Group 'B' / Tehsildar" },
            { value: "MP_MLA_MLC", label: "MP / MLA / MLC / Municipal Councillor" },
            { value: "VillagePanchayat", label: "Village Panchayat Head / Mukhiya" },
            { value: "HeadOfInstitute", label: "Head of Recognised Educational Institution" },
            { value: "Superintendent", label: "Superintendent / Warden / Matron" },
            { value: "NACO", label: "Gazetted Officer at NACO / State Health Dept" }
          ]}
          {...register("certifierType")}
          error={errors.certifierType?.message as string}
        />
      </div>
    </div>
  );
}
