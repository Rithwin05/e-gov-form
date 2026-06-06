import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";

// Helper to convert pdf2json coordinates to pdf-lib coordinates
// pdf2json unit = 16 points. pdf-lib origin is bottom-left (y goes up).
const pdf2jsonToPdfLib = (x: number, y: number) => ({
  x: x * 16,
  y: 841.89 - (y * 16)
});

// Calculate fixed Y coordinates based on the extracted PDF text
const Y_COORDS = {
  residency: pdf2jsonToPdfLib(0, 11.823).y,       // Resident / NRI / etc.
  aadhaar: pdf2jsonToPdfLib(0, 13.274).y,         // Aadhaar Number
  name: pdf2jsonToPdfLib(0, 14.815).y,            // Full Name
  houseNo: pdf2jsonToPdfLib(0, 17.383).y,         // C/o / House No
  street: pdf2jsonToPdfLib(0, 18.68).y,           // Street
  landmark: pdf2jsonToPdfLib(0, 19.977).y,        // Landmark
  area: pdf2jsonToPdfLib(0, 21.274).y,            // Area
  city: pdf2jsonToPdfLib(0, 22.571).y,            // Village/Town/City
  postOffice: pdf2jsonToPdfLib(0, 23.868).y,      // Post Office
  district: pdf2jsonToPdfLib(0, 25.165).y,        // District
  state: pdf2jsonToPdfLib(0, 26.462).y,           // State
  pinCode: pdf2jsonToPdfLib(0, 29.071).y,         // PIN Code
  certName: pdf2jsonToPdfLib(0, 34.173).y,        // Name of Certifier
  certDesignation: pdf2jsonToPdfLib(0, 35.47).y,  // Designation
  certAddress: pdf2jsonToPdfLib(0, 36.767).y,     // Office Address
  certContact: pdf2jsonToPdfLib(0, 39.42).y,      // Contact Number
};

// Start of text fields is usually horizontally aligned
const X_START = 160;

export async function generateAadhaarPDF(formData: FormData): Promise<Uint8Array> {
  // Load the template PDF
  const templatePath = path.join(process.cwd(), 'public', 'List_of_Supporting_Document.pdf');
  const templateBytes = await readFile(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Text drawing helper
  const drawText = (text: string, x: number, y: number, isBold = false, size = 11) => {
    if (!text) return;
    page.drawText(String(text).toUpperCase(), {
      x,
      y: y - 2, // slight adjustment for baseline
      size,
      font: isBold ? boldFont : font,
      color: rgb(0.1, 0.1, 0.4), // Dark blue to look like pen
    });
  };

  // Checkmark drawing helper (draws a checkmark at x,y)
  const drawCheck = (x: number, y: number) => {
    page.drawText("✓", { x, y: y - 2, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.4) });
  };

  // 1. Resident Category & Request Type
  const residentCategory = formData.get("residentCategory");
  if (residentCategory === "Resident") drawCheck(30, Y_COORDS.residency);
  else if (residentCategory === "NRI") drawCheck(90, Y_COORDS.residency);
  else if (residentCategory === "OCI") drawCheck(205, Y_COORDS.residency);

  const requestType = formData.get("requestType");
  if (requestType === "NewEnrolment") drawCheck(405, Y_COORDS.residency);
  else if (requestType === "UpdateRequest") drawCheck(485, Y_COORDS.residency);

  // 2. Personal Info
  // Aadhaar Number is spaced out in boxes.
  const aadhaarStr = String(formData.get("aadhaarNumber") || "").padEnd(12, " ");
  for (let i = 0; i < 12; i++) {
    // Estimate box width ~ 14.5 points
    const xPos = 153 + (i * 14.5) + (Math.floor(i / 4) * 10); // add space every 4 digits
    drawText(aadhaarStr[i].trim(), xPos, Y_COORDS.aadhaar, true, 12);
  }

  // Draw other fields
  drawText(String(formData.get("fullName") || ""), X_START, Y_COORDS.name, true);
  drawText(String(formData.get("houseNo") || ""), X_START, Y_COORDS.houseNo, true);
  drawText(String(formData.get("street") || ""), X_START, Y_COORDS.street, true);
  drawText(String(formData.get("landmark") || ""), X_START, Y_COORDS.landmark, true);
  drawText(String(formData.get("area") || ""), X_START, Y_COORDS.area, true);
  drawText(String(formData.get("city") || ""), X_START, Y_COORDS.city, true);
  drawText(String(formData.get("postOffice") || ""), X_START, Y_COORDS.postOffice, true);
  drawText(String(formData.get("district") || ""), X_START, Y_COORDS.district, true);
  drawText(String(formData.get("state") || ""), X_START, Y_COORDS.state, true);
  
  // PIN Code boxes
  const pinStr = String(formData.get("pinCode") || "").padEnd(6, " ");
  for (let i = 0; i < 6; i++) {
    const xPos = 153 + (i * 14.5);
    drawText(pinStr[i].trim(), xPos, Y_COORDS.pinCode, true, 12);
  }

  // 3. Certifier Details
  drawText(String(formData.get("certifierName") || ""), X_START + 25, Y_COORDS.certName, true);
  drawText(String(formData.get("certifierDesignation") || ""), X_START - 50, Y_COORDS.certDesignation, true);
  drawText(String(formData.get("certifierOfficeAddress") || ""), X_START - 25, Y_COORDS.certAddress, true);
  
  // Certifier Contact boxes
  const contactStr = String(formData.get("certifierContact") || "").padEnd(10, " ");
  for (let i = 0; i < 10; i++) {
    const xPos = 145 + (i * 14.5);
    drawText(contactStr[i].trim(), xPos, Y_COORDS.certContact, true, 12);
  }

  // 4. Certifier Type Checkmarks
  const cType = formData.get("certifierType") as string | null;
  const cTypeY = {
    MP_MLA_MLC: pdf2jsonToPdfLib(0, 42.619).y,
    GazettedA: pdf2jsonToPdfLib(0, 43.231).y,
    GazettedB: pdf2jsonToPdfLib(0, 44.279).y,
    NACO: pdf2jsonToPdfLib(0, 44.891).y,
    HeadOfInstitute: pdf2jsonToPdfLib(0, 45.938).y,
    VillagePanchayat: pdf2jsonToPdfLib(0, 46.985).y,
    EPFO: pdf2jsonToPdfLib(0, 43.231).y, // Same row as GazettedA
  };
  
  if (cType && cType in cTypeY) {
    const yPos = cTypeY[cType as keyof typeof cTypeY];
    drawCheck(25, yPos);
  }

  // 5. Place Photo and Signature
  const embedImage = async (file: any) => {
    if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) return null;
    const buffer = await file.arrayBuffer();
    if (file.type === "image/png") return await pdfDoc.embedPng(buffer);
    if (file.type === "image/jpeg" || file.type === "image/jpg") return await pdfDoc.embedJpg(buffer);
    return null;
  };

  try {
    const photoImg = await embedImage(formData.get("photo") as File);
    if (photoImg) {
      // Photo box is roughly at top right, let's estimate from pdf2json bounds
      // The box is beside "Recent Colour Passport-Size Photograph."
      // Let's place it around x: 440, y: 550, width: 100, height: 120
      // We will adjust based on typical dimensions
      page.drawImage(photoImg, {
        x: 435,
        y: 450,
        width: 105,
        height: 125,
      });
    }

    const sigImg = await embedImage(formData.get("signature") as File);
    if (sigImg) {
      // Signature box is roughly below the text "Signature/ Thumb/ Finger Impression of Individual..."
      // y=30.696 in pdf2json -> ~350 pdflib
      page.drawImage(sigImg, {
        x: 320,
        y: 280,
        width: 180,
        height: 45,
      });
    }
  } catch (e) {
    console.error("Failed to embed images:", e);
  }

  // Generate date of issue as today
  const today = new Date();
  const dateStr = today.getDate().toString().padStart(2, "0") + 
                  (today.getMonth() + 1).toString().padStart(2, "0") + 
                  today.getFullYear().toString();
  
  const dateY = pdf2jsonToPdfLib(0, 8.817).y; // "D D M M Y Y Y Y"
  for (let i = 0; i < 8; i++) {
    // Dates are spaced out at top right
    const xPos = 412 + (i * 12) + (Math.floor(i / 2) * 5) + (Math.floor(i / 4) * 8);
    drawText(dateStr[i], xPos, dateY, true, 12);
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
