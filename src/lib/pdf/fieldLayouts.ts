export interface FieldGeometry {
  yOffset: number;
  fontSize: number;
  boxWidth: number; // For centering calculation within the cell
  cells: number[];
}

// Helper to generate mathematical placeholder arrays.
// You will replace the output of this with your Figma-measured arrays!
const generateCells = (startX: number, boxWidth: number, count: number): number[] => {
  return Array.from({ length: count }, (_, i) => Number((startX + (i * boxWidth)).toFixed(2)));
};

// Helper for the Aadhaar spacing (placeholder math)
const generateAadhaarCells = (startX: number, boxWidth: number): number[] => {
  const cells: number[] = [];
  let currentX = startX;
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) currentX += boxWidth; // gap
    cells.push(Number(currentX.toFixed(2)));
    currentX += boxWidth;
  }
  return cells;
};

// Helper for Date spacing (placeholder math)
const generateDateCells = (startX: number, boxWidth: number): number[] => {
  const cells: number[] = [];
  let currentX = startX;
  for (let i = 0; i < 8; i++) {
    cells.push(Number(currentX.toFixed(2)));
    currentX += boxWidth;
    if (i === 1 || i === 3) currentX += 12; // gap after DD and MM
  }
  return cells;
};

// THESE ARE MATHEMATICAL PLACEHOLDERS! 
// Replace the generate...(...) calls with your actual Figma measured pixel arrays.
// Example:
// fullName: {
//   yOffset: -2.0,
//   fontSize: 11,
//   boxWidth: 23.9, 
//   cells: [228, 251.9, 275.8, 299.7, ...] // Paste your Figma array here!
// }

export const FIELD_LAYOUTS: Record<string, FieldGeometry> = {
  aadhaar: {
    yOffset: -1.5,
    fontSize: 12,
    boxWidth: 19.8,
    cells: generateAadhaarCells(228, 19.8),
  },
  fullName: {
    yOffset: -2.0,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 31),
  },
  houseNo: {
    yOffset: -2.0,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 31),
  },
  street: {
    yOffset: -2.0,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 31),
  },
  landmark: {
    yOffset: -2.0,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 31),
  },
  area: {
    yOffset: -2.0,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 31),
  },
  city: {
    yOffset: -2.0,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 31),
  },
  postOffice: {
    yOffset: -1.8,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 21),
  },
  district: {
    yOffset: -1.8,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 21),
  },
  state: {
    yOffset: -1.8,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 21),
  },
  pinCode: {
    yOffset: -1.2,
    fontSize: 12,
    boxWidth: 31.5,
    cells: generateCells(228, 31.5, 6),
  },
  certName: {
    yOffset: -2.0,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 31),
  },
  certDesignation: {
    yOffset: -2.0,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 31),
  },
  certAddress: {
    yOffset: -2.0,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 31),
  },
  certAddressLine2: {
    yOffset: -2.0,
    fontSize: 11,
    boxWidth: 23.9,
    cells: generateCells(228, 23.9, 31),
  },
  certContact: {
    yOffset: -1.5,
    fontSize: 11,
    boxWidth: 23.5,
    cells: generateCells(228, 23.5, 10),
  },
  date: {
    yOffset: -2.0,
    fontSize: 12,
    boxWidth: 12.8,
    cells: generateDateCells(415, 12.8),
  }
};
