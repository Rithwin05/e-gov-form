import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Helper to convert pdf2json coordinates to pdf-lib coordinates
// pdf2json unit = 16 points. pdf-lib origin is bottom-left (y goes up).
// We subtract 13 from Y to drop the text perfectly into the boxes.
const pdf2jsonToPdfLib = (x: number, y: number) => ({
  x: x * 16,
  y: 841.89 - (y * 16) - 13
});

// Calculate fixed Y coordinates based on the extracted PDF text
const Y_COORDS = {
  residency: pdf2jsonToPdfLib(0, 11.823).y,       // Resident / NRI / etc.
  aadhaar: pdf2jsonToPdfLib(0, 13.274).y,         // Aadhaar Number
  name: pdf2jsonToPdfLib(0, 14.815).y,            // Full Name
  houseNo: pdf2jsonToPdfLib(0, 17.383).y,         // C/o / House No
  street: pdf2jsonToPdfLib(0, 18.68).y,           // Street
  landmark: pdf2jsonToPdfLib(0, 19.977).y,        // Landmark
  area: pdf2jsonToPdfLib(0, 21.274).y,            // Area
  city: pdf2jsonToPdfLib(0, 22.571).y,            // Village/Town/City
  postOffice: pdf2jsonToPdfLib(0, 23.868).y,      // Post Office
  district: pdf2jsonToPdfLib(0, 25.165).y,        // District
  state: pdf2jsonToPdfLib(0, 26.462).y,           // State
  pinCode: pdf2jsonToPdfLib(0, 29.071).y,         // PIN Code
  certName: pdf2jsonToPdfLib(0, 34.173).y,        // Name of Certifier
  certDesignation: pdf2jsonToPdfLib(0, 35.47).y,  // Designation
  certAddress: pdf2jsonToPdfLib(0, 36.767).y,     // Office Address Line 1
  certAddressLine2: pdf2jsonToPdfLib(0, 38.06).y, // Office Address Line 2
  certContact: pdf2jsonToPdfLib(0, 39.42).y,      // Contact Number
};

export async function generateAadhaarPDF(formData: FormData, templateBytes: ArrayBuffer): Promise<Uint8Array> {
  // Load the template PDF
  const pdfDoc = await PDFDocument.load(templateBytes);
  
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Text drawing helper
  const drawText = (text: string, x: number, y: number, isBold = false, size = 11) => {
    if (!text) return;
    page.drawText(String(text).toUpperCase(), {
      x,
      y: y - 2, // slight adjustment for baseline
      size,
      font: isBold ? boldFont : font,
      color: rgb(0.1, 0.1, 0.4), // Dark blue to look like pen
    });
  };

  // Checkmark drawing helper (draws an X at x,y since WinAnsi doesn't support ✓)
  const drawCheck = (x: number, y: number) => {
    page.drawText("X", { x, y: y - 4, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.4) });
  };

  // Start of standard text grids
  const GRID_X = 138; // Universal left edge of Full Name, Address, etc.
  const BOX_W = 12.8; // Measured exact width of one character box

  const drawGridText = (text: string, startX: number, y: number, maxLength: number) => {
    const str = String(text || "").toUpperCase().replace(/[^A-Z0-9 \/-]/g, '').substring(0, maxLength);
    let currentX = startX;
    for (let i = 0; i < str.length; i++) {
      if (str[i] !== ' ') {
        drawText(str[i], currentX + 3.0, y, true, 11);
      }
      currentX += BOX_W;
    }
  };

  // 1. Resident Category & Request Type
  const residentCategory = formData.get("residentCategory");
  if (residentCategory === "Resident") drawCheck(42, Y_COORDS.residency);
  else if (residentCategory === "NRI") drawCheck(97, Y_COORDS.residency);
  else if (residentCategory === "OCI") drawCheck(204, Y_COORDS.residency);

  const requestType = formData.get("requestType");
  if (requestType === "NewEnrolment") drawCheck(412, Y_COORDS.residency);
  else if (requestType === "UpdateRequest") drawCheck(485, Y_COORDS.residency);

  // 2. Personal Info
  // Aadhaar Number starts exactly at 6th Full Name box in the actual template
  const aadhaarStr = String(formData.get("aadhaarNumber") || "").padEnd(12, " ");
  let aadhaarX = 202; // 138 + 5 * 12.8 = 202
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) {
      aadhaarX += BOX_W; // Empty box gap
    }
    if (aadhaarStr[i] !== ' ') drawText(aadhaarStr[i], aadhaarX + 3.0, Y_COORDS.aadhaar, true, 12);
    aadhaarX += BOX_W;
  }

  // Draw other fields using grid with strict max character limits to prevent overflow
  drawGridText(String(formData.get("fullName") || ""), GRID_X, Y_COORDS.name, 30);
  drawGridText(String(formData.get("houseNo") || ""), GRID_X, Y_COORDS.houseNo, 30);
  drawGridText(String(formData.get("street") || ""), GRID_X, Y_COORDS.street, 30);
  drawGridText(String(formData.get("landmark") || ""), GRID_X, Y_COORDS.landmark, 30);
  drawGridText(String(formData.get("area") || ""), GRID_X, Y_COORDS.area, 30);
  drawGridText(String(formData.get("city") || ""), GRID_X, Y_COORDS.city, 30);
  
  // Post Office, District, State are shorter because of the Photo box
  drawGridText(String(formData.get("postOffice") || ""), GRID_X, Y_COORDS.postOffice, 21);
  drawGridText(String(formData.get("district") || ""), GRID_X, Y_COORDS.district, 21);
  drawGridText(String(formData.get("state") || ""), GRID_X, Y_COORDS.state, 21);
  
  // PIN Code boxes start at 13th box of Full Name in the actual template
  drawGridText(String(formData.get("pinCode") || ""), 292, Y_COORDS.pinCode, 6);

  // 3. Certifier Details
  drawGridText(String(formData.get("certifierName") || ""), GRID_X, Y_COORDS.certName, 30);
  drawGridText(String(formData.get("certifierDesignation") || ""), GRID_X, Y_COORDS.certDesignation, 30);
  
  // Office Address has 2 rows of boxes!
  const officeAddress = String(formData.get("certifierOfficeAddress") || "");
  drawGridText(officeAddress, GRID_X, Y_COORDS.certAddress, 30);
  if (officeAddress.length > 30) {
    drawGridText(officeAddress.substring(30), GRID_X, Y_COORDS.certAddressLine2, 30);
  }
  
  // Certifier Contact starts at 11th box of Office Address in actual template
  drawGridText(String(formData.get("certifierContact") || ""), 266, Y_COORDS.certContact, 10);

  // 4. Certifier Type Checkmarks
  const cType = formData.get("certifierType") as string | null;
  const C_TYPE_Y_BASE = pdf2jsonToPdfLib(0, 43.231).y;
  const cTypeY = {
    MP_MLA_MLC: C_TYPE_Y_BASE,
    GazettedA: C_TYPE_Y_BASE - 16,
    GazettedB: C_TYPE_Y_BASE - 48, // Tehsildar/Gazetted B
    NACO: C_TYPE_Y_BASE - 64,
    HeadOfInstitute: C_TYPE_Y_BASE - 96,
    VillagePanchayat: C_TYPE_Y_BASE - 128,
    EPFO: C_TYPE_Y_BASE - 16,
  };
  
  if (cType && cType in cTypeY) {
    const yPos = cTypeY[cType as keyof typeof cTypeY];
    drawCheck(36, yPos);
  }

  // 5. Place Photo and Signature
  const embedImage = async (file: any) => {
    if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) return null;
    const buffer = await file.arrayBuffer();
    if (file.type === "image/png") return await pdfDoc.embedPng(buffer);
    if (file.type === "image/jpeg" || file.type === "image/jpg") return await pdfDoc.embedJpg(buffer);
    return null;
  };

  try {
    const photoImg = await embedImage(formData.get("photo") as File);
    if (photoImg) {
      // Photo box is roughly at top right, let's estimate from pdf2json bounds
      // The box is beside "Recent Colour Passport-Size Photograph."
      // Let's place it around x: 440, y: 550, width: 100, height: 120
      // We will adjust based on typical dimensions
      page.drawImage(photoImg, {
        x: 435,
        y: 450,
        width: 105,
        height: 125,
      });
    }

    const sigImg = await embedImage(formData.get("signature") as File);
    if (sigImg) {
      // Signature box is roughly below the text "Signature/ Thumb/ Finger Impression of Individual..."
      // y=30.696 in pdf2json -> ~350 pdflib
      page.drawImage(sigImg, {
        x: 320,
        y: 280,
        width: 180,
        height: 45,
      });
    }
  } catch (e) {
    console.error("Failed to embed images:", e);
  }

  // Generate date of issue as today
  const today = new Date();
  const dateStr = today.getDate().toString().padStart(2, "0") + 
                  (today.getMonth() + 1).toString().padStart(2, "0") + 
                  today.getFullYear().toString();
  
  const dateY = pdf2jsonToPdfLib(0, 8.817).y; // "D D M M Y Y Y Y"
  let dateX = 415;
  for (let i = 0; i < 8; i++) {
    drawText(dateStr[i], dateX + 3.0, dateY, true, 12);
    dateX += BOX_W;
    if (i === 1 || i === 3) dateX += 12; // Gap after DD and MM
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
