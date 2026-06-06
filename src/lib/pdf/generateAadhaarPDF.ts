import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { FIELD_LAYOUTS } from "./fieldLayouts";

// DEBUG: Set to true to draw red dots at exact cell center coordinates
const DEBUG_CELLS = false;

// Residency / request-type checkboxes sit above the grid rows.
// These use the old pdf2json Y formula which remains accurate for the checkbox area.
const pdf2jsonY = (pdfJsonY: number) => 841.89 - pdfJsonY * 16 - 13;

// ── Checkbox Y-coordinate constants ──────────────────────────────────────────
const RESIDENCY_Y = pdf2jsonY(11.823); // "Resident", "NRI", "OCI" row
const CERTIFIER_TYPE_Y_BASE = pdf2jsonY(43.231); // First certifier-type checkbox

// Resident-category checkbox X positions
const RESIDENT_CHECKBOX_X = {
  Resident: 42,
  NRI: 97,
  OCI: 204,
  // LTV / Nepal / Bhutan / Foreign all share the third combined OCI/LTV box
  LTV: 204,
  Nepal: 204,
  Bhutan: 204,
  Foreign: 204,
};

// Request-type checkbox X positions
const REQUEST_TYPE_X = {
  NewEnrolment: 408,
  UpdateRequest: 485,
};

// Certifier type → Y offset from base (each option is a separate row in the form)
const CERTIFIER_TYPE_Y_MAP: Record<string, number> = {
  MP_MLA_MLC:       CERTIFIER_TYPE_Y_BASE,
  GazettedA:        CERTIFIER_TYPE_Y_BASE - 16,
  EPFO:             CERTIFIER_TYPE_Y_BASE - 16,
  GazettedB:        CERTIFIER_TYPE_Y_BASE - 48,
  Tehsildar:        CERTIFIER_TYPE_Y_BASE - 48,
  NACO:             CERTIFIER_TYPE_Y_BASE - 64,
  HeadOfInstitute:  CERTIFIER_TYPE_Y_BASE - 96,
  Superintendent:   CERTIFIER_TYPE_Y_BASE - 96,
  VillagePanchayat: CERTIFIER_TYPE_Y_BASE - 128,
};

// ── CHECKLIST FOR CERTIFIER checkbox positions ────────────────────────────────
// Row 1 of the checklist (4 items) — at bottom of the form
const CHECKLIST_ROW1_Y = 163.0;
const CHECKLIST_ROW2_Y = 150.5;
const CHECKLIST_POSITIONS = [
  { x: 303.0, y: CHECKLIST_ROW1_Y }, // No overwriting
  { x: 343.0, y: CHECKLIST_ROW1_Y }, // Issue date is filled
  { x: 394.0, y: CHECKLIST_ROW1_Y }, // Resident's signature
  { x: 449.0, y: CHECKLIST_ROW1_Y }, // Certifier's details
  { x: 303.0, y: CHECKLIST_ROW2_Y }, // Photo cross-signed and stamped
];

export async function generateAadhaarPDF(
  formData: FormData,
  templateBytes: ArrayBuffer
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);

  // Register fontkit for custom TTF support
  pdfDoc.registerFontkit(fontkit);

  const page = pdfDoc.getPages()[0];

  // Helvetica Bold — used for the ✓ tick drawn in Latin encoding
  const helvaticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ZapfDingbats — character "4" renders as ✔ (heavy check mark)
  const dingbats = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);

  // RobotoMono-Bold TTF — perfect monospaced glyph widths for cell text
  const fontPath = path.join(process.cwd(), "public", "fonts", "RobotoMono-Bold.ttf");
  const fontBytes = fs.readFileSync(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);

  // ── Tick-mark helper ────────────────────────────────────────────────────────
  // Draws a ✔ (ZapfDingbats char "4") at (x, y)
  const drawTick = (x: number, y: number, size = 10) => {
    // "4" in ZapfDingbats = ✔ (HEAVY CHECK MARK)
    page.drawText("4", {
      x,
      y: y - 1,
      size,
      font: dingbats,
      color: rgb(0.05, 0.05, 0.35),
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
  drawCellField("state",      String(formData.get("state")     || ""));
  drawCellField("pinCode",    String(formData.get("pinCode")   || ""));

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. CERTIFIER DETAILS
  // ══════════════════════════════════════════════════════════════════════════════
  drawCellField("certName",        String(formData.get("certifierName")        || ""));
  drawCellField("certDesignation", String(formData.get("certifierDesignation") || ""));

  // Office Address — split across 2 physical box rows (24 cells each)
  const officeAddress = String(formData.get("certifierOfficeAddress") || "");
  drawCellField("certAddress", officeAddress.substring(0, 24));
  if (officeAddress.length > 24) {
    drawCellField("certAddressLine2", officeAddress.substring(24, 48));
  }

  drawCellField("certContact", String(formData.get("certifierContact") || ""));

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. CERTIFIER TYPE CHECKBOX
  // ══════════════════════════════════════════════════════════════════════════════
  const cType = formData.get("certifierType") as string | null;
  if (cType && cType in CERTIFIER_TYPE_Y_MAP) {
    drawTick(36, CERTIFIER_TYPE_Y_MAP[cType]);
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

  // ── Helvatica Bold kept in scope to avoid unused-variable warnings ──────────
  void helvaticaBold;

  return pdfDoc.save();
}
