const fs = require('fs');
const PDFParser = require('pdf2json');

const pdfParser = new PDFParser();

pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError));
pdfParser.on('pdfParser_dataReady', pdfData => {
  const page = pdfData.Pages[0];
  const texts = page.Texts.map(t => {
    return {
      text: decodeURIComponent(t.R[0].T),
      x: t.x,
      y: t.y,
      w: t.w
    };
  });
  
  fs.writeFileSync('pdf-texts.json', JSON.stringify(texts, null, 2));
  console.log(`Extracted ${texts.length} text elements. Check pdf-texts.json`);
});

pdfParser.loadPDF('Forms_public/List_of_Supporting_Document.pdf');
