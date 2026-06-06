import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AadhaarFormData } from "@/types/form";
import { InputField } from "@/components/ui/InputField";
import { SelectField } from "@/components/ui/SelectField";
import { INDIAN_STATES } from "@/constants/states";

interface PersonalInfoProps {
  form: UseFormReturn<AadhaarFormData>;
}

export function PersonalInfo({ form }: PersonalInfoProps) {
  const { register, formState: { errors } } = form;

  const stateOptions = INDIAN_STATES.map(state => ({ value: state, label: state }));

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-white">Personal Information</h2>
        <p className="text-slate-400 text-sm mt-1">Please enter your details exactly as they should appear on your Aadhaar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Aadhaar Number (Optional for New Enrolment)"
          placeholder="1234 5678 9012"
          maxLength={12}
          {...register("aadhaarNumber")}
          error={errors.aadhaarNumber?.message as string}
        />
        <InputField
          label="Full Name"
          placeholder="John Doe"
          required
          {...register("fullName")}
          error={errors.fullName?.message as string}
        />
      </div>

      <div className="pt-4">
        <h3 className="text-sm font-medium text-slate-300 mb-4 uppercase tracking-wider">Address Details</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="C/o / House No / Bldg / Apt"
              placeholder="e.g. 12A, Block C"
              required
              {...register("houseNo")}
              error={errors.houseNo?.message as string}
            />
            <InputField
              label="Street / Road / Lane"
              placeholder="e.g. Main Street"
              {...register("street")}
              error={errors.street?.message as string}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Landmark"
              placeholder="e.g. Near City Hospital"
              {...register("landmark")}
              error={errors.landmark?.message as string}
            />
            <InputField
              label="Area / Locality / Sector"
              placeholder="e.g. Downtown"
              {...register("area")}
              error={errors.area?.message as string}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Village / Town / City"
              placeholder="e.g. Mumbai"
              required
              {...register("city")}
              error={errors.city?.message as string}
            />
            <InputField
              label="Post Office"
              placeholder="e.g. Central PO"
              {...register("postOffice")}
              error={errors.postOffice?.message as string}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField
              label="District"
              placeholder="e.g. Mumbai Suburban"
              required
              {...register("district")}
              error={errors.district?.message as string}
            />
            <SelectField
              label="State"
              required
              options={stateOptions}
              {...register("state")}
              error={errors.state?.message as string}
            />
            <InputField
              label="PIN Code"
              placeholder="123456"
              maxLength={6}
              required
              {...register("pinCode")}
              error={errors.pinCode?.message as string}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
