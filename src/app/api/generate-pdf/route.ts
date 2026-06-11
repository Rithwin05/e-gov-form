import { NextResponse } from "next/server";
import { generateAadhaarPDF } from "@/lib/pdf/generateAadhaarPDF";

// Explicitly use Node.js runtime so fs/path and pdf-lib work correctly on Vercel
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const baseUrl = new URL(request.url).origin;

    // Fetch the Aadhaar template PDF from the public folder
    const templateRes = await fetch(`${baseUrl}/List_of_Supporting_Document.pdf`);
    if (!templateRes.ok) {
      throw new Error(`Failed to load PDF template: ${templateRes.statusText}`);
    }
    const templateBytes = await templateRes.arrayBuffer();

    // Fetch the RobotoMono-Bold font from the public folder
    const fontRes = await fetch(`${baseUrl}/fonts/RobotoMono-Bold.ttf`);
    if (!fontRes.ok) {
      throw new Error(`Failed to load font: ${fontRes.statusText}`);
    }
    const fontBytes = await fontRes.arrayBuffer();

    // Generate the filled PDF
    const pdfBytes = await generateAadhaarPDF(formData, templateBytes, fontBytes);

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
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
