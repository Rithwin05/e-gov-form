import { NextResponse } from "next/server";
import { generateAadhaarPDF } from "@/lib/pdf/generateAadhaarPDF";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Generate the PDF
    const pdfBytes = await generateAadhaarPDF(formData);

    // Return it as a blob
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="aadhaar_certificate.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
