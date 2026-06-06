import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { FIELD_LAYOUTS } from "./fieldLayouts";

// DEBUG: Set to true to draw red dots at exact cell center coordinates
const DEBUG_CELLS = false;

// Checkboxes and certifier type use the old pdf2json Y system (they are not cell-grid fields)
// These are retained until visually calibrated separately.
const pdf2jsonY = (pdfJsonY: number) => 841.89 - (pdfJsonY * 16) - 13;

const CHECKBOX_Y = {
  residency: pdf2jsonY(11.823),
  certifierType: pdf2jsonY(43.231),
};

export async function generateAadhaarPDF(formData: FormData, templateBytes: ArrayBuffer): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  
  // Register fontkit for custom TTF support
  pdfDoc.registerFontkit(fontkit);
  
  const page = pdfDoc.getPages()[0];
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Embed RobotoMono-Bold TTF for perfect monospaced glyph widths
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'RobotoMono-Bold.ttf');
  const fontBytes = fs.readFileSync(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);

  // Checkmark drawing helper
  const drawCheck = (x: number, y: number) => {
    page.drawText("X", { x, y: y - 4, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.4) });
  };

  // Cell Renderer: uses PDF-native coordinates from fieldLayouts.ts
  // yBase is taken directly from layout.yBasePDF (bottom of cell box in PDF point space)
  const drawCellField = (fieldId: string, text: string) => {
    const layout = FIELD_LAYOUTS[fieldId];
    if (!layout) return;

    const str = String(text || "").toUpperCase().replace(/[^A-Z0-9 /\-.,']/g, '').substring(0, layout.cells.length);
    const finalY = layout.yBasePDF + layout.yOffset;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const centerX = layout.cells[i];
      if (centerX === undefined) continue;

      if (DEBUG_CELLS) {
        page.drawCircle({
          x: centerX,
          y: finalY + 5, // visual center of cell height
          size: 1.5,
          color: rgb(1, 0, 0),
        });
      }

      if (char !== ' ') {
        const charWidth = customFont.widthOfTextAtSize(char, layout.fontSize);
        const drawX = centerX - (charWidth / 2);
        page.drawText(char, {
          x: drawX,
          y: finalY,
          size: layout.fontSize,
          font: customFont,
          color: rgb(0.1, 0.1, 0.4),
        });
      }
    }
  };

  // ── 1. Resident Category & Request Type ──────────────────────────────────
  const residentCategory = formData.get("residentCategory");
  if (residentCategory === "Resident") drawCheck(42, CHECKBOX_Y.residency);
  else if (residentCategory === "NRI") drawCheck(97, CHECKBOX_Y.residency);
  else if (residentCategory === "OCI") drawCheck(204, CHECKBOX_Y.residency);

  const requestType = formData.get("requestType");
  if (requestType === "NewEnrolment") drawCheck(408, CHECKBOX_Y.residency);
  else if (requestType === "UpdateRequest") drawCheck(485, CHECKBOX_Y.residency);

  // ── 2. Personal Info ─────────────────────────────────────────────────────
  drawCellField("aadhaar", String(formData.get("aadhaarNumber") || ""));
  drawCellField("fullName", String(formData.get("fullName") || ""));
  drawCellField("houseNo", String(formData.get("houseNo") || ""));
  drawCellField("street", String(formData.get("street") || ""));
  drawCellField("landmark", String(formData.get("landmark") || ""));
  drawCellField("area", String(formData.get("area") || ""));
  drawCellField("city", String(formData.get("city") || ""));

  // ── 3. Address Sub-fields ────────────────────────────────────────────────
  drawCellField("postOffice", String(formData.get("postOffice") || ""));
  drawCellField("district", String(formData.get("district") || ""));
  drawCellField("state", String(formData.get("state") || ""));
  drawCellField("pinCode", String(formData.get("pinCode") || ""));

  // ── 4. Certifier Details ─────────────────────────────────────────────────
  drawCellField("certName", String(formData.get("certifierName") || ""));
  drawCellField("certDesignation", String(formData.get("certifierDesignation") || ""));

  const officeAddress = String(formData.get("certifierOfficeAddress") || "");
  drawCellField("certAddress", officeAddress);
  // FULL_ROW_CENTERS has 24 cells; overflow starts at index 24
  if (officeAddress.length >= 24) {
    drawCellField("certAddressLine2", officeAddress.substring(24));
  }

  drawCellField("certContact", String(formData.get("certifierContact") || ""));

  // ── 5. Certifier Type Checkmarks ─────────────────────────────────────────
  const cType = formData.get("certifierType") as string | null;
  const C_TYPE_Y_BASE = CHECKBOX_Y.certifierType;
  // Map all certifierType enum values to their checkbox Y positions on the form
  const cTypeY: Record<string, number> = {
    MP_MLA_MLC:       C_TYPE_Y_BASE,
    GazettedA:        C_TYPE_Y_BASE - 16,   // EPFO also maps here (same box)
    EPFO:             C_TYPE_Y_BASE - 16,
    GazettedB:        C_TYPE_Y_BASE - 48,   // Tehsildar also maps here
    Tehsildar:        C_TYPE_Y_BASE - 48,
    NACO:             C_TYPE_Y_BASE - 64,
    HeadOfInstitute:  C_TYPE_Y_BASE - 96,
    Superintendent:   C_TYPE_Y_BASE - 96,   // Grouped with HeadOfInstitute
    VillagePanchayat: C_TYPE_Y_BASE - 128,
  };
  if (cType && cType in cTypeY) {
    drawCheck(36, cTypeY[cType]);
  }

  // ── 6. Photo and Signature ────────────────────────────────────────────────
  const embedImage = async (file: unknown) => {
    if (!file || typeof (file as File).arrayBuffer !== 'function' || (file as File).size === 0) return null;
    const buffer = await (file as File).arrayBuffer();
    if ((file as File).type === "image/png") return await pdfDoc.embedPng(buffer);
    if ((file as File).type === "image/jpeg" || (file as File).type === "image/jpg") return await pdfDoc.embedJpg(buffer);
    return null;
  };

  try {
    const photoImg = await embedImage(formData.get("photo"));
    if (photoImg) {
      page.drawImage(photoImg, { x: 435, y: 450, width: 105, height: 125 });
    }
    const sigImg = await embedImage(formData.get("signature"));
    if (sigImg) {
      page.drawImage(sigImg, { x: 320, y: 280, width: 180, height: 45 });
    }
  } catch (e) {
    console.error("Failed to embed images:", e);
  }

  // ── 7. Date of Issue ──────────────────────────────────────────────────────
  const today = new Date();
  const dateStr =
    today.getDate().toString().padStart(2, "0") +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getFullYear().toString();
  drawCellField("date", dateStr);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
