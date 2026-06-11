"use client";

import React from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { AadhaarFormData } from "@/types/form";
import {
  User, Home, MapPin, FileText, Phone, CheckSquare,
  AlertCircle, Badge, Building2, CreditCard, CheckCircle2
} from "lucide-react";

interface FormPreviewProps {
  form: UseFormReturn<AadhaarFormData>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  Resident: "Resident (Indian)",
  NRI: "Non-Resident Indian (NRI)",
  OCI: "Overseas Citizen of India (OCI)",
  LTV: "Long Term Visa (LTV)",
  Nepal: "Nepal National",
  Bhutan: "Bhutan National",
  Foreign: "Other Foreign National",
};

const REQUEST_LABELS: Record<string, string> = {
  NewEnrolment: "New Enrolment",
  UpdateRequest: "Update Request",
};

const CERTIFIER_LABELS: Record<string, string> = {
  GazettedA: "Gazetted Officer Group 'A' / EPFO",
  GazettedB: "Gazetted Officer Group 'B' / Tehsildar",
  MP_MLA_MLC: "MP / MLA / MLC / Municipal Councillor",
  VillagePanchayat: "Village Panchayat Head / Mukhiya",
  HeadOfInstitute: "Head of Recognised Educational Institution",
  Superintendent: "Superintendent / Warden / Matron",
  NACO: "Gazetted Officer at NACO / State Health Dept",
};

const CHECKLIST_ITEMS = [
  "No overwriting",
  "Issue date is filled",
  "Resident's signature",
  "Certifier's details",
  "Resident's photo is cross signed and cross stamped",
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color = "blue" }: {
  icon: React.ElementType;
  title: string;
  color?: "blue" | "orange" | "emerald" | "violet";
}) {
  const colors = {
    blue:    "from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400",
    orange:  "from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400",
    violet:  "from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400",
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 bg-gradient-to-r border ${colors[color]}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function DataRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  const display = value?.trim() || "—";
  const empty = display === "—";
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-2 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-500 sm:w-44 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium ${empty ? "text-slate-600 italic" : "text-slate-100"} ${mono ? "font-mono tracking-widest" : ""}`}>
        {display}
      </span>
    </div>
  );
}

function Badge2({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "info" }) {
  const vars = {
    default: "bg-slate-700 text-slate-200 border-slate-600",
    success: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
    info:    "bg-blue-900/50 text-blue-300 border-blue-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${vars[variant]}`}>
      {children}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function FormPreview({ form }: FormPreviewProps) {
  const data = useWatch({ control: form.control }) as AadhaarFormData;

  const fullAddress = [
    data.houseNo, data.street, data.landmark, data.area, data.city, data.postOffice,
    data.district, data.state, data.pinCode,
  ].filter(Boolean).join(", ");

  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, "0")} / ${(today.getMonth() + 1).toString().padStart(2, "0")} / ${today.getFullYear()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 mb-2">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Review Your Details
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Please carefully review all information before generating the PDF. Click <strong className="text-slate-300">Previous</strong> to make corrections.
        </p>
      </div>

      {/* Date of Issue */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
        <span className="text-xs text-slate-400 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          Date of Issue (auto-filled on PDF)
        </span>
        <span className="font-mono text-sm font-semibold text-amber-300 tracking-widest">{dateStr}</span>
      </div>

      {/* ── Section 1: Personal Info ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
        <SectionHeader icon={User} title="Individual / Aadhaar Number Holder" color="blue" />

        <div className="space-y-0">
          <DataRow label="Aadhaar Number" value={data.aadhaarNumber?.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")} mono />
          <DataRow label="Full Name" value={data.fullName?.toUpperCase()} />
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {data.residentCategory && (
            <Badge2 variant="info">
              <User className="w-3 h-3" />
              {CATEGORY_LABELS[data.residentCategory] ?? data.residentCategory}
            </Badge2>
          )}
          {data.requestType && (
            <Badge2 variant="success">
              <FileText className="w-3 h-3" />
              {REQUEST_LABELS[data.requestType] ?? data.requestType}
            </Badge2>
          )}
        </div>
      </div>

      {/* ── Section 2: Address ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
        <SectionHeader icon={Home} title="Address Details" color="orange" />

        <div className="space-y-0">
          <DataRow label="House No / Bldg / Apt"     value={data.houseNo?.toUpperCase()} />
          <DataRow label="Street / Road / Lane"       value={data.street?.toUpperCase()} />
          <DataRow label="Landmark"                   value={data.landmark?.toUpperCase()} />
          <DataRow label="Area / Locality / Sector"   value={data.area?.toUpperCase()} />
          <DataRow label="Village / Town / City"      value={data.city?.toUpperCase()} />
          <DataRow label="Post Office"                value={data.postOffice?.toUpperCase()} />
          <DataRow label="District"                   value={data.district?.toUpperCase()} />
          <DataRow label="State"                      value={data.state?.toUpperCase()} />
          <DataRow label="PIN Code"                   value={data.pinCode} mono />
        </div>

        {fullAddress && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Full address preview
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">{fullAddress.toUpperCase()}</p>
          </div>
        )}
      </div>

      {/* ── Section 3: Certifier ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
        <SectionHeader icon={Building2} title="Certifier's Details" color="violet" />

        <div className="space-y-0">
          <DataRow label="Name"           value={data.certifierName?.toUpperCase()} />
          <DataRow label="Designation"    value={data.certifierDesignation?.toUpperCase()} />
          <DataRow label="Office Address" value={data.certifierOfficeAddress?.toUpperCase()} />
          <DataRow label="Contact"        value={data.certifierContact} mono />
        </div>

        {data.certifierType && (
          <div className="mt-3">
            <Badge2 variant="default">
              <Badge className="w-3 h-3" />
              {CERTIFIER_LABELS[data.certifierType] ?? data.certifierType}
            </Badge2>
          </div>
        )}
      </div>

      {/* ── Section 4: Uploads & Checklist ───────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
        <SectionHeader icon={CreditCard} title="Uploads & Checklist" color="emerald" />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${data.photo instanceof File ? "border-emerald-700 bg-emerald-900/30 text-emerald-300" : "border-slate-700 bg-slate-800/50 text-slate-500"}`}>
            <CheckCircle2 className={`w-4 h-4 ${data.photo instanceof File ? "text-emerald-400" : "text-slate-600"}`} />
            {data.photo instanceof File ? `Photo: ${data.photo.name.substring(0, 18)}` : "No photo uploaded"}
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${data.signature instanceof File ? "border-emerald-700 bg-emerald-900/30 text-emerald-300" : "border-slate-700 bg-slate-800/50 text-slate-500"}`}>
            <CheckCircle2 className={`w-4 h-4 ${data.signature instanceof File ? "text-emerald-400" : "text-slate-600"}`} />
            {data.signature instanceof File ? `Sig: ${data.signature.name.substring(0, 18)}` : "No signature uploaded"}
          </div>
        </div>

        <div className={`rounded-xl border p-3 ${data.fillChecklist ? "border-emerald-700/60 bg-emerald-900/20" : "border-slate-700/60 bg-slate-800/20"}`}>
          <div className="flex items-center gap-2 mb-2">
            {data.fillChecklist ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Phone className="w-4 h-4 text-slate-500" />
            )}
            <span className={`text-xs font-semibold ${data.fillChecklist ? "text-emerald-300" : "text-slate-500"}`}>
              Certifier Checklist — {data.fillChecklist ? "Will be auto-filled ✔" : "Not filling"}
            </span>
          </div>
          <ul className="space-y-1 pl-1">
            {CHECKLIST_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs">
                <span className={data.fillChecklist ? "text-emerald-400" : "text-slate-600"}>✔</span>
                <span className={data.fillChecklist ? "text-slate-300" : "text-slate-600"}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Confirmation banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-900/20 border border-amber-700/40 text-amber-300">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p className="text-xs leading-relaxed">
          By clicking <strong>"Generate PDF"</strong> you confirm that all details above are correct. The PDF will be generated using today&apos;s date and all the information shown above.
        </p>
      </div>
    </div>
  );
}
