import { AadhaarForm } from "@/components/form/AadhaarForm";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Aadhaar Form Builder
          </h1>
          <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">
            Digitally fill the Aadhaar Certificate for Enrolment/Update form, upload your photo and signature, and instantly download a print-ready PDF.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-10">
          <AadhaarForm />
        </div>
      </div>
    </main>
  );
}
