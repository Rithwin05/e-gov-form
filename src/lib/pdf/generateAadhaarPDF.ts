import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateAadhaarPDF(formData: FormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // A4 size is [595.28, 841.89]
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  // Try to use Helvetica, since custom fonts require loading TTF files into ArrayBuffers
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const drawText = (text: string, x: number, y: number, isBold = false, size = 10) => {
    if (!text) return;
    page.drawText(String(text), {
      x,
      y,
      size,
      font: isBold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
  };

  // Header
  drawText("AADHAAR ENROLMENT / UPDATE FORM", 170, 800, true, 16);
  drawText("Government of India", 230, 780, false, 12);

  page.drawLine({
    start: { x: 40, y: 760 },
    end: { x: 555, y: 760 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Section 1: Pre-Enrolment / Update Details
  let currentY = 730;
  
  drawText("1. Resident Category:", 40, currentY, true);
  drawText(String(formData.get("residentCategory") || "Resident"), 180, currentY);
  
  drawText("2. Request Type:", 300, currentY, true);
  const requestTypeRaw = String(formData.get("requestType") || "NewEnrolment");
  const requestTypeFormatted = requestTypeRaw === "NewEnrolment" ? "New Enrolment" : "Update Request";
  drawText(requestTypeFormatted, 400, currentY);

  currentY -= 30;
  
  drawText("3. Aadhaar Number:", 40, currentY, true);
  const aadhaarNumber = String(formData.get("aadhaarNumber") || "");
  drawText(aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}` : "Not Provided", 180, currentY);

  currentY -= 30;

  drawText("4. Full Name:", 40, currentY, true);
  drawText(String(formData.get("fullName") || "").toUpperCase(), 180, currentY);

  currentY -= 40;

  // Address Section
  drawText("5. Address Details:", 40, currentY, true, 12);
  currentY -= 25;

  drawText("C/o / House No / Bldg / Apt:", 40, currentY, true);
  drawText(String(formData.get("houseNo") || ""), 190, currentY);
  
  drawText("Street / Road / Lane:", 300, currentY, true);
  drawText(String(formData.get("street") || ""), 420, currentY);

  currentY -= 25;

  drawText("Landmark:", 40, currentY, true);
  drawText(String(formData.get("landmark") || ""), 190, currentY);
  
  drawText("Area / Locality / Sector:", 300, currentY, true);
  drawText(String(formData.get("area") || ""), 440, currentY);

  currentY -= 25;

  drawText("Village / Town / City:", 40, currentY, true);
  drawText(String(formData.get("city") || ""), 190, currentY);
  
  drawText("Post Office:", 300, currentY, true);
  drawText(String(formData.get("postOffice") || ""), 420, currentY);

  currentY -= 25;

  drawText("District:", 40, currentY, true);
  drawText(String(formData.get("district") || ""), 190, currentY);
  
  drawText("State:", 300, currentY, true);
  drawText(String(formData.get("state") || ""), 350, currentY);

  currentY -= 25;

  drawText("PIN Code:", 40, currentY, true);
  drawText(String(formData.get("pinCode") || ""), 190, currentY);

  currentY -= 40;

  // Certifier Section
  drawText("6. Certifier Details:", 40, currentY, true, 12);
  currentY -= 25;

  drawText("Name of Certifier:", 40, currentY, true);
  drawText(String(formData.get("certifierName") || ""), 150, currentY);

  drawText("Designation:", 300, currentY, true);
  drawText(String(formData.get("certifierDesignation") || ""), 380, currentY);

  currentY -= 25;

  drawText("Office Address:", 40, currentY, true);
  drawText(String(formData.get("certifierOfficeAddress") || ""), 150, currentY);

  currentY -= 25;

  drawText("Contact Number:", 40, currentY, true);
  drawText(String(formData.get("certifierContact") || ""), 150, currentY);

  // Photo Box Outline
  page.drawRectangle({
    x: 430,
    y: 500,
    width: 100,
    height: 120,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  drawText("Photo", 465, 550, false, 10);

  // Embed Photo if exists
  const photoFile = formData.get("photo") as File | null;
  if (photoFile && photoFile.size > 0) {
    try {
      const photoBuffer = await photoFile.arrayBuffer();
      let embeddedImage;
      if (photoFile.type === "image/png") {
        embeddedImage = await pdfDoc.embedPng(photoBuffer);
      } else if (photoFile.type === "image/jpeg" || photoFile.type === "image/jpg") {
        embeddedImage = await pdfDoc.embedJpg(photoBuffer);
      }
      
      if (embeddedImage) {
        page.drawImage(embeddedImage, {
          x: 432,
          y: 502,
          width: 96,
          height: 116,
        });
      }
    } catch (e) {
      console.error("Failed to embed photo:", e);
    }
  }

  // Signature Section
  drawText("Signature of Resident:", 40, 150, true);
  page.drawRectangle({
    x: 40,
    y: 90,
    width: 200,
    height: 50,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  const sigFile = formData.get("signature") as File | null;
  if (sigFile && sigFile.size > 0) {
    try {
      const sigBuffer = await sigFile.arrayBuffer();
      let embeddedSig;
      if (sigFile.type === "image/png") {
        embeddedSig = await pdfDoc.embedPng(sigBuffer);
      } else if (sigFile.type === "image/jpeg" || sigFile.type === "image/jpg") {
        embeddedSig = await pdfDoc.embedJpg(sigBuffer);
      }
      
      if (embeddedSig) {
        page.drawImage(embeddedSig, {
          x: 42,
          y: 92,
          width: 196,
          height: 46,
        });
      }
    } catch (e) {
      console.error("Failed to embed signature:", e);
    }
  }

  // Footer Disclaimer
  drawText("This form is generated digitally. Keep it safe and verify details before submission.", 40, 40, false, 8);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
