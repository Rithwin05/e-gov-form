/**
 * Dump the raw content stream of the PDF template for manual inspection.
 * This will help us understand how the cell grid is drawn.
 */
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function dumpStream() {
  const pdfBytes = fs.readFileSync('public/List_of_Supporting_Document.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();
  console.log(`Page: ${width} x ${height} pt`);
  
  // Get all content streams
  const node = page.node;
  const contentsRef = node.get(node.context.obj('Contents'));
  
  let rawText = '';
  
  // Try to get the content stream(s)
  if (contentsRef) {
    const contents = node.context.lookup(contentsRef);
    if (contents.constructor.name === 'PDFArray') {
      for (let i = 0; i < contents.size(); i++) {
        const streamRef = contents.get(i);
        const stream = node.context.lookup(streamRef);
        if (stream && stream.getContents) {
          const bytes = stream.getContents();
          rawText += Buffer.from(bytes).toString('latin1') + '\n---STREAM-BREAK---\n';
        }
      }
    } else if (contents.getContents) {
      const bytes = contents.getContents();
      rawText = Buffer.from(bytes).toString('latin1');
    }
  }
  
  if (!rawText) {
    // Alternative: try Contents directly
    const contents = page.node.Contents();
    if (contents && contents.getContents) {
      rawText = Buffer.from(contents.getContents()).toString('latin1');
    }
  }
  
  console.log(`Stream length: ${rawText.length}`);
  
  // Save the raw stream
  fs.writeFileSync('pdf-content-stream.txt', rawText);
  console.log('Saved to pdf-content-stream.txt');
  
  // Show first 3000 chars
  console.log('\n=== First 3000 chars ===\n');
  console.log(rawText.substring(0, 3000));
  
  // Show last 2000 chars
  console.log('\n=== Last 2000 chars ===\n');
  console.log(rawText.substring(rawText.length - 2000));
}

dumpStream().catch(console.error);
