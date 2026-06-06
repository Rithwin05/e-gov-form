/**
 * Extract actual cell geometry from the PDF template.
 * 
 * The PDF draws each cell as a box using 4 line segments inside transform blocks.
 * Pattern per cell: multiple q/cm blocks at the same Y band with stepping X positions.
 * The cm transform: "1 0 0 1 tx ty cm" gives absolute page position.
 * 
 * Each cell box has 4 corner transforms at approximately:
 *   bottom-left:  tx1, ty_bottom
 *   bottom-right: tx2, ty_bottom  
 *   top-left:     tx1, ty_top
 *   top-right:    tx2, ty_top
 * 
 * Cell width ≈ 18.5pt per the pattern we see.
 */
const fs = require('fs');

const ops = fs.readFileSync('pdf-operators.txt', 'latin1');

// Extract all cm transforms: "1 0 0 1 tx ty cm"
const cmPattern = /1\s+0\s+0\s+1\s+([\d.]+)\s+([\d.]+)\s+cm/g;
const allPoints = [];
let match;

while ((match = cmPattern.exec(ops)) !== null) {
  allPoints.push({
    tx: parseFloat(match[1]),
    ty: parseFloat(match[2])
  });
}

console.log(`Total cm transforms: ${allPoints.length}`);

// Group by Y coordinate (within 1pt tolerance)
const byY = {};
allPoints.forEach(p => {
  const yKey = Math.round(p.ty);
  if (!byY[yKey]) byY[yKey] = [];
  byY[yKey].push(p.tx);
});

// Show all Y bands with their unique X positions
const yBands = Object.entries(byY)
  .map(([y, txs]) => ({
    y: parseInt(y),
    txs: [...new Set(txs.map(x => Number(x.toFixed(1))))].sort((a, b) => a - b)
  }))
  .sort((a, b) => b.y - a.y);

console.log(`\nY bands: ${yBands.length}\n`);

// The cell boxes have 4 Y-levels per row (top-line, bottom-line for each side).
// Group Y bands that are within ~15pt of each other = same row
const rows = [];
let currentRow = { yMin: yBands[0].y, yMax: yBands[0].y, bands: [yBands[0]] };

for (let i = 1; i < yBands.length; i++) {
  if (currentRow.yMin - yBands[i].y < 18) {
    currentRow.bands.push(yBands[i]);
    currentRow.yMin = yBands[i].y;
  } else {
    rows.push(currentRow);
    currentRow = { yMin: yBands[i].y, yMax: yBands[i].y, bands: [yBands[i]] };
  }
}
rows.push(currentRow);

console.log(`Form rows detected: ${rows.length}\n`);

// For each row, collect all unique X positions across all Y bands
const formRows = rows.map((row, idx) => {
  const allX = [];
  row.bands.forEach(b => allX.push(...b.txs));
  const uniqueX = [...new Set(allX.map(x => Number(x.toFixed(1))))].sort((a, b) => a - b);
  
  // The X positions come in pairs (left edge, right edge of each cell)
  // Cell centers are midpoints between consecutive left edges
  // Actually, each cell border appears twice (as left of one cell and right of previous)
  // So the unique sorted X values ARE the separator positions
  
  // Compute cell centers
  const centers = [];
  for (let i = 0; i < uniqueX.length - 1; i++) {
    const gap = uniqueX[i + 1] - uniqueX[i];
    if (gap > 5 && gap < 30) { // Filter out tiny gaps (same border drawn twice)
      centers.push(Number(((uniqueX[i] + uniqueX[i + 1]) / 2).toFixed(1)));
    }
  }
  
  return {
    rowIndex: idx,
    yRange: `${row.yMin}-${row.yMax}`,
    yMid: Number(((row.yMin + row.yMax) / 2).toFixed(1)),
    separatorCount: uniqueX.length,
    cellCount: centers.length,
    separators: uniqueX,
    centers: centers,
    cellWidths: centers.length > 1 
      ? uniqueX.slice(1).filter((x, i) => (x - uniqueX[i]) > 5).map((x, i) => {
          const prevX = uniqueX.filter((xx, j) => j <= i && (j === 0 || x - xx > 5))[0];
          return undefined;
        })
      : []
  };
}).filter(r => r.cellCount > 2); // Only keep rows with 3+ cells

console.log('=== FORM CELL DATA ===\n');
formRows.forEach(row => {
  console.log(`Row ${row.rowIndex}: Y=${row.yRange} (mid=${row.yMid}), ${row.cellCount} cells`);
  console.log(`  Separators: [${row.separators.join(', ')}]`);
  console.log(`  Centers:    [${row.centers.join(', ')}]`);
  
  // Compute individual cell widths from separators
  const widths = [];
  for (let i = 0; i < row.separators.length - 1; i++) {
    const gap = row.separators[i + 1] - row.separators[i];
    if (gap > 5) widths.push(gap.toFixed(1));
  }
  console.log(`  Widths:     [${widths.join(', ')}]`);
  console.log();
});

// Save structured output
fs.writeFileSync('cell-centers.json', JSON.stringify(formRows, null, 2));
console.log('Saved to cell-centers.json');
