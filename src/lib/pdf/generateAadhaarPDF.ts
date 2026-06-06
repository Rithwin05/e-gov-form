import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

// Helper to convert pdf2json coordinates to pdf-lib coordinates
// pdf2json unit = 16 points. pdf-lib origin is bottom-left (y goes up).
// We subtract 13 from Y to drop the text perfectly into the boxes.
const pdf2jsonToPdfLib = (x: number, y: number) => ({
  x: x * 16,
  y: 841.89 - (y * 16) - 13
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
  certAddress: pdf2jsonToPdfLib(0, 36.767).y,     // Office Address Line 1
  certAddressLine2: pdf2jsonToPdfLib(0, 38.06).y, // Office Address Line 2
  certContact: pdf2jsonToPdfLib(0, 39.42).y,      // Contact Number
};

// FIELD CALIBRATION SYSTEM
const DEBUG_CELLS = true;

interface CellField {
  startX: number;
  yOffset: number;
  boxWidth: number;
  boxCount: number;
  fontSize: number;
}

const FIELD_LAYOUTS: Record<string, CellField> = {
  aadhaar:          { startX: 228, yOffset: -1.5, boxWidth: 19.8, boxCount: 12, fontSize: 12 },
  fullName:         { startX: 228, yOffset: -2.0, boxWidth: 23.9, boxCount: 31, fontSize: 11 },
  houseNo:          { startX: 228, yOffset: -2.0, boxWidth: 23.9, boxCount: 31, fontSize: 11 },
  street:           { startX: 228, yOffset: -2.0, boxWidth: 23.9, boxCount: 31, fontSize: 11 },
  landmark:         { startX: 228, yOffset: -2.0, boxWidth: 23.9, boxCount: 31, fontSize: 11 },
  area:             { startX: 228, yOffset: -2.0, boxWidth: 23.9, boxCount: 31, fontSize: 11 },
  city:             { startX: 228, yOffset: -2.0, boxWidth: 23.9, boxCount: 31, fontSize: 11 },
  postOffice:       { startX: 228, yOffset: -1.8, boxWidth: 23.9, boxCount: 21, fontSize: 11 },
  district:         { startX: 228, yOffset: -1.8, boxWidth: 23.9, boxCount: 21, fontSize: 11 },
  state:            { startX: 228, yOffset: -1.8, boxWidth: 23.9, boxCount: 21, fontSize: 11 },
  pinCode:          { startX: 228, yOffset: -1.2, boxWidth: 31.5, boxCount: 6,  fontSize: 12 },
  certName:         { startX: 228, yOffset: -2.0, boxWidth: 23.9, boxCount: 31, fontSize: 11 },
  certDesignation:  { startX: 228, yOffset: -2.0, boxWidth: 23.9, boxCount: 31, fontSize: 11 },
  certAddress:      { startX: 228, yOffset: -2.0, boxWidth: 23.9, boxCount: 31, fontSize: 11 },
  certAddressLine2: { startX: 228, yOffset: -2.0, boxWidth: 23.9, boxCount: 31, fontSize: 11 },
  certContact:      { startX: 228, yOffset: -1.5, boxWidth: 23.5, boxCount: 15, fontSize: 11 },
};

export async function generateAadhaarPDF(formData: FormData, templateBytes: ArrayBuffer): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  
  // Register fontkit for custom TTF support
  pdfDoc.registerFontkit(fontkit);
  
  const page = pdfDoc.getPages()[0];
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Embed RobotoMono-Bold TTF
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'RobotoMono-Bold.ttf');
  const fontBytes = fs.readFileSync(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);

  // Checkmark drawing helper
  const drawCheck = (x: number, y: number) => {
    page.drawText("X", { x, y: y - 4, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.4) });
  };

  // Dedicated Cell Renderer
  const drawCellField = (fieldId: string, text: string, yBase: number) => {
    const layout = FIELD_LAYOUTS[fieldId];
    if (!layout) return;

    const str = String(text || "").toUpperCase().replace(/[^A-Z0-9 \/\-.,']/g, '').substring(0, layout.boxCount);
    const finalY = yBase + layout.yOffset;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const boxX = layout.startX + (i * layout.boxWidth);
      
      if (DEBUG_CELLS) {
        page.drawRectangle({
          x: boxX,
          y: finalY - 5,
          width: layout.boxWidth,
          height: 18,
          borderColor: rgb(1, 0, 0),
          borderWidth: 0.3
        });
      }

      if (char !== ' ') {
        const charWidth = customFont.widthOfTextAtSize(char, layout.fontSize);
        const centeredX = boxX + ((layout.boxWidth - charWidth) / 2);
        
        page.drawText(char, {
          x: centeredX,
          y: finalY,
          size: layout.fontSize,
          font: customFont,
          color: rgb(0.1, 0.1, 0.4),
        });
      }
    }
  };

  // 1. Resident Category & Request Type
  const residentCategory = formData.get("residentCategory");
  if (residentCategory === "Resident") drawCheck(42, Y_COORDS.residency);
  else if (residentCategory === "NRI") drawCheck(97, Y_COORDS.residency);
  else if (residentCategory === "OCI") drawCheck(204, Y_COORDS.residency);

  const requestType = formData.get("requestType");
  if (requestType === "NewEnrolment") drawCheck(408, Y_COORDS.residency);
  else if (requestType === "UpdateRequest") drawCheck(485, Y_COORDS.residency);

  // 2. Personal Info
  drawCellField("aadhaar", String(formData.get("aadhaarNumber") || "").padEnd(12, " "), Y_COORDS.aadhaar);

  // Draw other fields using field configuration
  drawCellField("fullName", String(formData.get("fullName") || ""), Y_COORDS.name);
  drawCellField("houseNo", String(formData.get("houseNo") || ""), Y_COORDS.houseNo);
  drawCellField("street", String(formData.get("street") || ""), Y_COORDS.street);
  drawCellField("landmark", String(formData.get("landmark") || ""), Y_COORDS.landmark);
  drawCellField("area", String(formData.get("area") || ""), Y_COORDS.area);
  drawCellField("city", String(formData.get("city") || ""), Y_COORDS.city);
  
  drawCellField("postOffice", String(formData.get("postOffice") || ""), Y_COORDS.postOffice);
  drawCellField("district", String(formData.get("district") || ""), Y_COORDS.district);
  drawCellField("state", String(formData.get("state") || ""), Y_COORDS.state);
  
  drawCellField("pinCode", String(formData.get("pinCode") || ""), Y_COORDS.pinCode);

  // 3. Certifier Details
  drawCellField("certName", String(formData.get("certifierName") || ""), Y_COORDS.certName);
  drawCellField("certDesignation", String(formData.get("certifierDesignation") || ""), Y_COORDS.certDesignation);
  
  // Office Address has 2 rows of boxes!
  const officeAddress = String(formData.get("certifierOfficeAddress") || "");
  drawCellField("certAddress", officeAddress, Y_COORDS.certAddress);
  if (officeAddress.length > 30) {
    drawCellField("certAddressLine2", officeAddress.substring(30), Y_COORDS.certAddressLine2);
  }
  
  drawCellField("certContact", String(formData.get("certifierContact") || ""), Y_COORDS.certContact);

  // 4. Certifier Type Checkmarks
  const cType = formData.get("certifierType") as string | null;
  const C_TYPE_Y_BASE = pdf2jsonToPdfLib(0, 43.231).y;
  const cTypeY = {
    MP_MLA_MLC: C_TYPE_Y_BASE,
    GazettedA: C_TYPE_Y_BASE - 16,
    GazettedB: C_TYPE_Y_BASE - 48, // Tehsildar/Gazetted B
    NACO: C_TYPE_Y_BASE - 64,
    HeadOfInstitute: C_TYPE_Y_BASE - 96,
    VillagePanchayat: C_TYPE_Y_BASE - 128,
    EPFO: C_TYPE_Y_BASE - 16,
  };
  
  if (cType && cType in cTypeY) {
    const yPos = cTypeY[cType as keyof typeof cTypeY];
    drawCheck(36, yPos);
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
      page.drawImage(photoImg, {
        x: 435,
        y: 450,
        width: 105,
        height: 125,
      });
    }

    const sigImg = await embedImage(formData.get("signature") as File);
    if (sigImg) {
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
  
  const dateY = pdf2jsonToPdfLib(0, 8.817).y - 2; 
  let dateX = 415;
  const dateBoxW = 12.8;
  for (let i = 0; i < 8; i++) {
    if (DEBUG_CELLS) {
      page.drawRectangle({
        x: dateX,
        y: dateY - 5,
        width: dateBoxW,
        height: 18,
        borderColor: rgb(1, 0, 0),
        borderWidth: 0.3
      });
    }

    const char = dateStr[i];
    if (char !== ' ') {
      const charWidth = customFont.widthOfTextAtSize(char, 12);
      const centeredX = dateX + ((dateBoxW - charWidth) / 2);
      page.drawText(char, {
          x: centeredX,
          y: dateY,
          size: 12,
          font: customFont,
          color: rgb(0.1, 0.1, 0.4)
      });
    }
    dateX += dateBoxW;
    if (i === 1 || i === 3) dateX += 12; // Gap after DD and MM
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
