import { PDFDocument, rgb, LineCapStyle } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { FIELD_LAYOUTS } from "./fieldLayouts";

// DEBUG: Set to true to draw red dots at exact cell center coordinates
const DEBUG_CELLS = false;

// ── Checkbox Y-coordinate constants ──────────────────────────────────────────
// These were extracted by finding the exact `re` (rectangle) operators in the PDF stream.
// Coordinates are exact centers of the checkbox borders.
const RESIDENCY_Y = 643.5;

// Resident-category checkbox X positions (exact centers)
const RESIDENT_CHECKBOX_X = {
  Resident: 43.1,
  NRI: 99.8,
  OCI: 213.0,
  // LTV / Nepal / Bhutan / Foreign all share the third combined OCI/LTV box
  LTV: 213.0,
  Nepal: 213.0,
  Bhutan: 213.0,
  Foreign: 213.0,
};

// Request-type checkbox X positions (exact centers)
const REQUEST_TYPE_X = {
  NewEnrolment: 416.0,
  UpdateRequest: 495.4,
};

// Certifier type → exact Y center
const CERTIFIER_TYPE_Y_MAP: Record<string, number> = {
  MP_MLA_MLC:       149.5,
  GazettedA:        140.5,
  EPFO:             140.5,
  GazettedB:        123.5,
  Tehsildar:        123.5,
  NACO:             113.5,
  HeadOfInstitute:  96.5,
  Superintendent:   96.5,
  VillagePanchayat: 80.5,
};

// ── CHECKLIST FOR CERTIFIER checkbox positions (exact centers) ────────────────
const CHECKLIST_POSITIONS = [
  { x: 274.7, y: 167.8 }, // No overwriting
  { x: 339.7, y: 167.8 }, // Issue date is filled
  { x: 413.7, y: 167.8 }, // Resident's signature
  { x: 495.7, y: 167.8 }, // Certifier's details
  { x: 274.7, y: 157.8 }, // Photo cross-signed and stamped
];

export async function generateAadhaarPDF(
  formData: FormData,
  templateBytes: ArrayBuffer
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);

  // Register fontkit for custom TTF support
  pdfDoc.registerFontkit(fontkit);

  const page = pdfDoc.getPages()[0];


  // RobotoMono-Bold TTF — perfect monospaced glyph widths for cell text
  const fontPath = path.join(process.cwd(), "public", "fonts", "RobotoMono-Bold.ttf");
  const fontBytes = fs.readFileSync(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);

  // ── Tick-mark helper ────────────────────────────────────────────────────────
  // Draws a ✔ using two vector line segments — no font encoding required.
  // The tick is centred at (x, y) and scales with `size`.
  const drawTick = (x: number, y: number, size = 10) => {
    const s = size / 10; // scale factor
    const tickColor = rgb(0.05, 0.05, 0.35);
    const thickness = Math.max(1, s * 1.4);
    // Short descending stroke (foot of the ✓)
    page.drawLine({
      start: { x: x,           y: y + s * 3 },
      end:   { x: x + s * 2.5, y: y },
      thickness,
      color: tickColor,
      lineCap: LineCapStyle.Round,
    });
    // Long ascending stroke (body of the ✓)
    page.drawLine({
      start: { x: x + s * 2.5, y: y },
      end:   { x: x + s * 8,   y: y + s * 7 },
      thickness,
      color: tickColor,
      lineCap: LineCapStyle.Round,
    });
  };

  // ── Cell text renderer ──────────────────────────────────────────────────────
  // Reads yBasePDF directly from FIELD_LAYOUTS — no external yBase argument needed
  const drawCellField = (fieldId: string, text: string) => {
    const layout = FIELD_LAYOUTS[fieldId];
    if (!layout) return;

    // Strip non-printable / non-form characters; capitalise; clamp to cell count
    const str = String(text || "")
      .toUpperCase()
      .replace(/[^A-Z0-9 /\-.,']/g, "")
      .substring(0, layout.cells.length);

    const finalY = layout.yBasePDF + layout.yOffset;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const centerX = layout.cells[i];
      if (centerX === undefined) continue;

      if (DEBUG_CELLS) {
        page.drawCircle({
          x: centerX,
          y: finalY + 5,
          size: 1.5,
          color: rgb(1, 0, 0),
        });
      }

      if (char !== " ") {
        const charWidth = customFont.widthOfTextAtSize(char, layout.fontSize);
        page.drawText(char, {
          x: centerX - charWidth / 2,
          y: finalY,
          size: layout.fontSize,
          font: customFont,
          color: rgb(0.05, 0.05, 0.35),
        });
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. RESIDENT CATEGORY & REQUEST TYPE
  // ══════════════════════════════════════════════════════════════════════════════
  const residentCategory = formData.get("residentCategory") as string | null;
  if (residentCategory && residentCategory in RESIDENT_CHECKBOX_X) {
    drawTick(
      RESIDENT_CHECKBOX_X[residentCategory as keyof typeof RESIDENT_CHECKBOX_X],
      RESIDENCY_Y
    );
  }

  const requestType = formData.get("requestType") as string | null;
  if (requestType && requestType in REQUEST_TYPE_X) {
    drawTick(
      REQUEST_TYPE_X[requestType as keyof typeof REQUEST_TYPE_X],
      RESIDENCY_Y
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. PERSONAL INFO
  // ══════════════════════════════════════════════════════════════════════════════
  drawCellField("aadhaar", String(formData.get("aadhaarNumber") || ""));

  // Full Name — split across 2 physical box rows (24 cells each)
  const fullName = String(formData.get("fullName") || "");
  drawCellField("fullName", fullName.substring(0, 24));
  if (fullName.length > 24) {
    drawCellField("fullNameRow2", fullName.substring(24, 48));
  }

  drawCellField("houseNo", String(formData.get("houseNo") || ""));
  drawCellField("street",   String(formData.get("street")  || ""));
  drawCellField("landmark", String(formData.get("landmark") || ""));
  drawCellField("area",     String(formData.get("area")    || ""));
  drawCellField("city",     String(formData.get("city")    || ""));

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. ADDRESS SUB-FIELDS (short rows)
  // ══════════════════════════════════════════════════════════════════════════════
  drawCellField("postOffice", String(formData.get("postOffice") || ""));
  drawCellField("district",   String(formData.get("district")  || ""));
  drawCellField("state", String(formData.get("state") || "").substring(0, 18));
  if (String(formData.get("state") || "").length > 18) {
    drawCellField("stateLine2", String(formData.get("state") || "").substring(18, 36));
  }
  drawCellField("pinCode", String(formData.get("pinCode") || "").substring(0, 6));

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. CERTIFIER DETAILS
  // ══════════════════════════════════════════════════════════════════════════════
  drawCellField("certName",        String(formData.get("certifierName")        || ""));
  drawCellField("certDesignation", String(formData.get("certifierDesignation") || ""));

  // Office Address — split across 2 physical box rows (23 cells each)
  const officeAddress = String(formData.get("certifierOfficeAddress") || "");
  drawCellField("certAddress", officeAddress.substring(0, 23));
  if (officeAddress.length > 23) {
    drawCellField("certAddressLine2", officeAddress.substring(23, 46));
  }

  drawCellField("certContact", String(formData.get("certifierContact") || ""));

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. CERTIFIER TYPE CHECKBOX
  // ══════════════════════════════════════════════════════════════════════════════
  const cType = formData.get("certifierType") as string | null;
  if (cType && cType in CERTIFIER_TYPE_Y_MAP) {
    // Certifier Type checkboxes are perfectly aligned at X=39.7
    drawTick(39.7, CERTIFIER_TYPE_Y_MAP[cType]);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 6. CHECKLIST FOR CERTIFIER — tick all 5 boxes automatically
  // ══════════════════════════════════════════════════════════════════════════════
  const fillChecklist = formData.get("fillChecklist");
  if (fillChecklist === "true") {
    for (const pos of CHECKLIST_POSITIONS) {
      drawTick(pos.x, pos.y, 8);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 7. PHOTO & SIGNATURE
  // ══════════════════════════════════════════════════════════════════════════════
  const embedImage = async (file: unknown) => {
    const f = file as File;
    if (!f || typeof f.arrayBuffer !== "function" || f.size === 0) return null;
    const buffer = await f.arrayBuffer();
    if (f.type === "image/png") return pdfDoc.embedPng(buffer);
    if (f.type === "image/jpeg" || f.type === "image/jpg")
      return pdfDoc.embedJpg(buffer);
    return null;
  };

  try {
    const photoImg = await embedImage(formData.get("photo"));
    if (photoImg) {
      page.drawImage(await photoImg, { x: 435, y: 450, width: 105, height: 125 });
    }
    const sigImg = await embedImage(formData.get("signature"));
    if (sigImg) {
      page.drawImage(await sigImg, { x: 320, y: 280, width: 180, height: 45 });
    }
  } catch (e) {
    console.error("Failed to embed images:", e);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 8. DATE OF ISSUE (today's date)
  // ══════════════════════════════════════════════════════════════════════════════
  const today = new Date();
  const dd   = today.getDate().toString().padStart(2, "0");
  const mm   = (today.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = today.getFullYear().toString();
  // Build 8-char string: DDMMYYYY
  drawCellField("date", dd + mm + yyyy);

  return pdfDoc.save();
}
