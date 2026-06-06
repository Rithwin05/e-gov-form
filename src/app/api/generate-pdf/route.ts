import { NextResponse } from "next/server";
import { generateAadhaarPDF } from "@/lib/pdf/generateAadhaarPDF";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Fetch the template PDF from the public folder using the absolute request URL
    const templateUrl = new URL("/List_of_Supporting_Document.pdf", request.url);
    const templateRes = await fetch(templateUrl.toString());
    if (!templateRes.ok) {
      throw new Error(`Failed to load PDF template from ${templateUrl.toString()}: ${templateRes.statusText}`);
    }
    const templateBytes = await templateRes.arrayBuffer();

    // Generate the PDF
    const pdfBytes = await generateAadhaarPDF(formData, templateBytes);

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
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
