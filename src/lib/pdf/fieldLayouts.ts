export interface FieldGeometry {
  yOffset: number;
  fontSize: number;
  cells: number[];
}

// ============================================================================
// PDF CALIBRATION ENGINE
// Translates your exact visual Figma pixel measurements into absolute PDF Points
// ============================================================================

const PDF_WIDTH = 595.276;
const IMAGE_WIDTH = 768; // Adjust if your original screenshot was a different width (e.g., 1024)
const SCALE_X = PDF_WIDTH / IMAGE_WIDTH; // approx 0.7751

// Use this to shift the entire form grid left or right to account for image margins!
const OFFSET_X = -36.5; 

// Helper to generate the exact array of PDF-point centers based on Figma pixels
const scaleFigmaToPDF = (
  figmaStartX: number, 
  figmaBoxWidth: number, 
  count: number, 
  gaps: {index: number, width: number}[] = []
): number[] => {
  const cells: number[] = [];
  let currentFigmaX = figmaStartX;
  let gapIdx = 0;
  
  for (let i = 0; i < count; i++) {
    // Add gap spaces for fields like Aadhaar and Date
    if (gaps.length > gapIdx && gaps[gapIdx].index === i) {
      currentFigmaX += gaps[gapIdx].width;
      gapIdx++;
    }
    
    // We calculate the center in Figma pixels first
    const figmaCenter = currentFigmaX + (figmaBoxWidth / 2);
    
    // Convert Figma center to absolute PDF center
    const pdfCenter = (figmaCenter * SCALE_X) + OFFSET_X;
    cells.push(Number(pdfCenter.toFixed(2)));
    
    currentFigmaX += figmaBoxWidth;
  }
  
  return cells;
};

// ----------------------------------------------------------------------------
// Generate the mapped coordinate arrays
// ----------------------------------------------------------------------------
const aadhaarCells = scaleFigmaToPDF(228, 19.8, 12, [{index: 4, width: 19.8}, {index: 8, width: 19.8}]);
const fullNameCells = scaleFigmaToPDF(228, 23.9, 31);
const addressCells = scaleFigmaToPDF(228, 23.9, 31);
const districtCells = scaleFigmaToPDF(228, 23.9, 21);
const pinCodeCells = scaleFigmaToPDF(228, 31.5, 6);
const certContactCells = scaleFigmaToPDF(228, 23.5, 10);
const dateCells = scaleFigmaToPDF(415, 12.8, 8, [{index: 2, width: 12}, {index: 4, width: 12}]);

export const FIELD_LAYOUTS: Record<string, FieldGeometry> = {
  aadhaar: {
    yOffset: -1.5,
    fontSize: 12,
    cells: aadhaarCells,
  },
  fullName: {
    yOffset: -2.0,
    fontSize: 11,
    cells: fullNameCells,
  },
  houseNo: {
    yOffset: -2.0,
    fontSize: 11,
    cells: addressCells,
  },
  street: {
    yOffset: -2.0,
    fontSize: 11,
    cells: addressCells,
  },
  landmark: {
    yOffset: -2.0,
    fontSize: 11,
    cells: addressCells,
  },
  area: {
    yOffset: -2.0,
    fontSize: 11,
    cells: addressCells,
  },
  city: {
    yOffset: -2.0,
    fontSize: 11,
    cells: addressCells,
  },
  postOffice: {
    yOffset: -1.8,
    fontSize: 11,
    cells: districtCells,
  },
  district: {
    yOffset: -1.8,
    fontSize: 11,
    cells: districtCells,
  },
  state: {
    yOffset: -1.8,
    fontSize: 11,
    cells: districtCells,
  },
  pinCode: {
    yOffset: -1.2,
    fontSize: 12,
    cells: pinCodeCells,
  },
  certName: {
    yOffset: -2.0,
    fontSize: 11,
    cells: fullNameCells,
  },
  certDesignation: {
    yOffset: -2.0,
    fontSize: 11,
    cells: fullNameCells,
  },
  certAddress: {
    yOffset: -2.0,
    fontSize: 11,
    cells: fullNameCells,
  },
  certAddressLine2: {
    yOffset: -2.0,
    fontSize: 11,
    cells: fullNameCells,
  },
  certContact: {
    yOffset: -1.5,
    fontSize: 11,
    cells: certContactCells,
  },
  date: {
    yOffset: -2.0,
    fontSize: 12,
    cells: dateCells,
  }
};
