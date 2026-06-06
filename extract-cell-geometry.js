/**
 * DEFINITIVE cell extractor: uses the exact PDF transform coordinates 
 * that were decompressed from the content stream.
 * 
 * The PDF draws each cell box as 4 line segments, each starting with:
 *   q 1 0 0 1 tx ty cm
 * 
 * Key insight: the LOCAL line segment in cell-space goes from (0,0) to (18.7, 0) (horizontal)
 * or (0,0) to (0,13.1) (vertical). So tx = left edge of cell, ty = bottom edge.
 * 
 * Each cell's LEFT EDGE = tx. So cell CENTER = tx + (localWidth / 2).
 * 
 * We need to find the local width. From the PDF stream:
 * - moveto: 0 0 m
 * - lineto examples: "18.671 0 l" (horizontal line for top/bottom edge)
 *                    "0 13.099 l" (vertical line for left/right edge)
 *
 * So local cell width = ~18.67, height = ~13.1
 * Cell center = tx + 9.335 (half of 18.67)
 */
const fs = require('fs');

const ops = fs.readFileSync('pdf-operators.txt', 'latin1');

// Find the local cell width from the first horizontal lineto command
const lineMatch = ops.match(/0\s+0\s+m\s+([\d.]+)\s+([\d.]+)\s+l/);
const localCellWidth = lineMatch ? parseFloat(lineMatch[1]) : 18.67;
const localCellHeight = 13.1; // approximate from "1.028 14.105 m" patterns 
const halfWidth = localCellWidth / 2;

console.log(`Cell local dimensions: ${localCellWidth.toFixed(3)} x ${localCellHeight.toFixed(1)} pt`);
console.log(`Half width for centering: ${halfWidth.toFixed(3)} pt\n`);

// Extract all cm transforms
const cmPattern = /1\s+0\s+0\s+1\s+([\d.]+)\s+([\d.]+)\s+cm/g;
const points = [];
let match;
while ((match = cmPattern.exec(ops)) !== null) {
  points.push({ tx: parseFloat(match[1]), ty: parseFloat(match[2]) });
}

// Group by Y (within 3pt = same row band)
const yGroups = {};
points.forEach(p => {
  let foundKey = null;
  for (const key of Object.keys(yGroups)) {
    if (Math.abs(parseFloat(key) - p.ty) < 3) { foundKey = key; break; }
  }
  const k = foundKey || p.ty.toFixed(1);
  if (!yGroups[k]) yGroups[k] = [];
  yGroups[k].push(p.tx);
});

// Collapse each Y band into a filtered set of unique cell start X positions
const rows = Object.entries(yGroups)
  .map(([y, txs]) => {
    const xs = [...new Set(txs.map(x => Number(x.toFixed(1))))].sort((a, b) => a - b);
    // Filter out duplicates within 2pt (same border drawn from two sides)
    const starts = [];
    xs.forEach(x => { if (starts.length === 0 || x - starts[starts.length - 1] > 2) starts.push(x); });
    const centers = starts.map(x => Number((x + halfWidth).toFixed(2)));
    return { y: parseFloat(y), starts, centers };
  })
  .filter(r => r.starts.length > 1)
  .sort((a, b) => b.y - a.y); // top to bottom visual order

// The form rows alternate: many Y bands per row due to box corners.
// We need to pick ONE representative Y band per form row (the one with the most cells).
// Group rows where Y is within 20pt of each other = same form row
const formRows = [];
let currentGroup = [rows[0]];
for (let i = 1; i < rows.length; i++) {
  if (currentGroup[0].y - rows[i].y < 20) {
    currentGroup.push(rows[i]);
  } else {
    // Pick the band with most cells
    currentGroup.sort((a, b) => b.starts.length - a.starts.length);
    formRows.push(currentGroup[0]);
    currentGroup = [rows[i]];
  }
}
currentGroup.sort((a, b) => b.starts.length - a.starts.length);
formRows.push(currentGroup[0]);

console.log(`Detected ${formRows.length} distinct form rows:\n`);

// Cross-reference with the Aadhaar form layout to identify which row is which
// From the misaligned PDF image, we know the form layout top-to-bottom:
// 1. Date (top right - special location)
// 2. Resident checkbox / Aadhaar Number row (Y ~ 620)
// 3. Full Name (Y ~ 600)
// 4. House No (Y ~ 580)
// 5. Street (Y ~ 560)
// 6. Landmark (Y ~ 540)
// 7. Area (Y ~ 520)
// 8. City (Y ~ 500)
// 9. Post Office (Y ~ 480)
// 10. District (Y ~ 455)
// 11. State (Y ~ 435)
// 12. PIN Code (Y ~ 395) - 6 cells only
// ...Certifier section below
// 13. Cert Name (Y ~ 290)
// 14. Cert Designation (Y ~ 270)
// 15. Cert Address L1 (Y ~ 250)
// 16. Cert Address L2 (Y ~ 228)
// 17. Contact (Y ~ 195)

formRows.forEach((row, idx) => {
  console.log(`[${idx}] Y=${row.y.toFixed(1)} cells=${row.starts.length}`);
  console.log(`  Centers: [${row.centers.join(', ')}]`);
});

// Save for use in fieldLayouts.ts
fs.writeFileSync('form-rows-extracted.json', JSON.stringify(formRows, null, 2));
console.log('\nSaved to form-rows-extracted.json');
