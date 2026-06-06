export interface FieldGeometry {
  // Y coordinate of the bottom of the cell box (in PDF points, origin at page bottom)
  yBasePDF: number;
  // Vertical offset to reach the text baseline inside the box
  yOffset: number;
  fontSize: number;
  // Exact center X coordinate for each cell, extracted directly from the PDF template
  cells: number[];
}

// ============================================================================
// CELL CENTERS EXTRACTED DIRECTLY FROM THE PDF TEMPLATE CONTENT STREAM
//
// Methodology:
//  1. Decompressed the PDF FlateDecode content stream
//  2. Parsed all "1 0 0 1 tx ty cm" transform operators
//  3. Applied pairing deduplication (each border is drawn twice from both sides)
//  4. Computed true center = midpoint of each pair
//
// These are NATIVE PDF POINT coordinates. No Figma. No pixel scaling.
// ============================================================================

// The 24-cell full-width text row
// (Full Name, House No, Street, Landmark, Area, City, Cert rows)
const FULL_ROW_CENTERS = [
  140.87, 158.42, 177.97, 195.52, 215.07, 232.62, 252.17, 269.72,
  289.27, 306.82, 326.37, 344.87, 363.47, 381.97, 400.57, 419.07,
  437.67, 456.17, 474.77, 492.42, 511.87, 530.37, 548.97, 566.62,
];

// The 18-cell short row (Post Office, District, State)
const SHORT_ROW_CENTERS = [
  140.87, 158.42, 177.97, 195.52, 215.07, 232.62, 252.17, 269.72,
  289.27, 306.82, 326.37, 344.87, 363.47, 381.97, 400.57, 419.07,
  437.67, 455.32,
];

// Aadhaar Number: 12 digit cells extracted from the Aadhaar Number row
const AADHAAR_CENTERS = [
  140.87, 159.47, 177.02, 196.57, 215.17, 233.77,
  251.32, 270.87, 289.47, 308.07, 325.62, 345.17,
];

// PIN Code: 6 cells from row [11] after deduplication
const PIN_CENTERS = [140.87, 158.42, 177.97, 195.52, 215.07, 232.62];

// Contact Number: 10 cells (Certifier section)
const CONTACT_CENTERS = [
  140.87, 158.42, 177.97, 195.52, 215.07,
  232.62, 252.17, 269.72, 289.27, 306.82,
];

// Date: 8 cells (DD MM YYYY) at top-right of form
// Found via exact rectangle parsing in main stream (Y=684.1, Width=15.8)
// X centers calculated: x + w/2
const DATE_CENTERS = [418.2, 434.0, 460.9, 476.7, 503.6, 519.4, 535.2, 550.9];

// Text baseline sits ~3pt above the cell bottom
const BASE_OFFSET = 3.0;

// ============================================================================
// FORM LAYOUT — corrected Y coordinates
//
// The Aadhaar form has TWO physical box rows for Full Name.
// Row 1: Y=587.6  (chars  0–23)
// Row 2: Y=566.9  (chars 24–47, overflow)
// This shifts ALL subsequent fields one row down vs. the old (incorrect) mapping.
// ============================================================================
export const FIELD_LAYOUTS: Record<string, FieldGeometry> = {
  aadhaar: {
    yBasePDF: 608.5,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: AADHAAR_CENTERS,
  },

  // Full Name — row 1 (chars 0-23)
  fullName: {
    yBasePDF: 587.6,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  // Full Name — row 2 overflow (chars 24-47)
  fullNameRow2: {
    yBasePDF: 566.9,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },

  houseNo: {
    yBasePDF: 546.1,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  street: {
    yBasePDF: 525.4,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  landmark: {
    yBasePDF: 504.7,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  area: {
    yBasePDF: 483.9,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  city: {
    yBasePDF: 463.2,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },

  // Short rows (Post Office, District, State share the same cell X positions)
  postOffice: {
    yBasePDF: 442.5,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: SHORT_ROW_CENTERS,
  },
  district: {
    yBasePDF: 421.7,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: SHORT_ROW_CENTERS,
  },
  state: {
    yBasePDF: 401.0,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: SHORT_ROW_CENTERS,
  },

  pinCode: {
    yBasePDF: 380.3,
    yOffset: BASE_OFFSET,
    fontSize: 12,
    cells: PIN_CENTERS,
  },

  // ── Certifier Section ─────────────────────────────────────────────────────
  // Name of Certifier: single row (24 cells)
  certName: {
    yBasePDF: 277.2,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  // Designation: single row
  certDesignation: {
    yBasePDF: 256.5,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  // Office Address row 1 (chars 0-23)
  certAddress: {
    yBasePDF: 235.7,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  // Office Address row 2 (chars 24-47)
  certAddressLine2: {
    yBasePDF: 215.0,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  certContact: {
    yBasePDF: 194.2,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: CONTACT_CENTERS,
  },

  // Date of Issue: 8 cells (DDMMYYYY) at top-right
  date: {
    yBasePDF: 684.1,
    yOffset: BASE_OFFSET,
    fontSize: 10,
    cells: DATE_CENTERS,
  },
};
