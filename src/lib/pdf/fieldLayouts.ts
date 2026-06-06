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

// The 24-cell full-width text row (Full Name, House No, Street, Landmark, Area, City, Cert rows)
const FULL_ROW_CENTERS = [140.87, 158.42, 177.97, 195.52, 215.07, 232.62, 252.17, 269.72, 289.27, 306.82, 326.37, 344.87, 363.47, 381.97, 400.57, 419.07, 437.67, 456.17, 474.77, 492.42, 511.87, 530.37, 548.97, 566.62];

// The 18-cell short row (Post Office, District, State)
const SHORT_ROW_CENTERS = [140.87, 158.42, 177.97, 195.52, 215.07, 232.62, 252.17, 269.72, 289.27, 306.82, 326.37, 344.87, 363.47, 381.97, 400.57, 419.07, 437.67, 455.32];

// Aadhaar Number: 13 raw positions -> actual 12 digit cells (drop the 13th: stray corner artifact)
const AADHAAR_CENTERS = [140.87, 159.47, 177.02, 196.57, 215.17, 233.77, 251.32, 270.87, 289.47, 308.07, 325.62, 345.17];

// PIN Code: 6 cells
const PIN_CENTERS = [140.87, 158.42, 177.97, 195.52, 215.07, 232.62];

// Contact Number: 10 cells (Certifier section)
const CONTACT_CENTERS = [140.87, 158.42, 177.97, 195.52, 215.07, 232.62, 252.17, 269.72, 289.27, 306.82];

// Date: 8 cells (DD MM YYYY) at top-right of form
// Located in the Fm0 XObject at approximately X: 529-554, Y: 774
// The date box Y (Fm0 internal) ≈ 774.3, centers derived from start positions
const DATE_CENTERS = [529.3, 534.8, 539.3, 546.5, 551.0, 553.8, 557.0, 562.0];

// Text baseline sits ~3pt above the cell bottom
const BASE_OFFSET = 3.0;

export const FIELD_LAYOUTS: Record<string, FieldGeometry> = {
  aadhaar: {
    yBasePDF: 608.5,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: AADHAAR_CENTERS,
  },
  fullName: {
    yBasePDF: 587.6,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  houseNo: {
    yBasePDF: 566.9,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  street: {
    yBasePDF: 546.1,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  landmark: {
    yBasePDF: 525.4,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  area: {
    yBasePDF: 504.7,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  city: {
    yBasePDF: 483.9,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  postOffice: {
    yBasePDF: 463.2,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: SHORT_ROW_CENTERS,
  },
  district: {
    yBasePDF: 442.5,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: SHORT_ROW_CENTERS,
  },
  state: {
    yBasePDF: 421.7,
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
  certName: {
    yBasePDF: 277.2,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  certDesignation: {
    yBasePDF: 256.5,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
  certAddress: {
    yBasePDF: 235.7,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: FULL_ROW_CENTERS,
  },
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
  date: {
    yBasePDF: 774.3,
    yOffset: BASE_OFFSET,
    fontSize: 11,
    cells: DATE_CENTERS,
  },
};
