const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function inspectPDF() {
  const pdfBytes = fs.readFileSync('Forms_public/List_of_Supporting_Document.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  const pages = pdfDoc.getPages();
  console.log(`Total pages: ${pages.length}`);
  
  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    console.log(`Page ${idx + 1}: width=${width}, height=${height}`);
  });
}

inspectPDF().catch(console.error);
