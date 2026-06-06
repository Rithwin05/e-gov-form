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
  certAddress: pdf2jsonToPdfLib(0, 36.767).y,     // Office Address
  certContact: pdf2jsonToPdfLib(0, 39.42).y,      // Contact Number
};

  // Start of standard text grids
  const GRID_X = 142;
  const BOX_W = 14.4;

  const drawGridText = (text: string, startX: number, y: number) => {
    const str = String(text || "").toUpperCase().replace(/[^A-Z0-9 \/-]/g, '');
    let currentX = startX;
    for (let i = 0; i < str.length; i++) {
      if (str[i] !== ' ') {
        drawText(str[i], currentX + 3.5, y, true, 11);
      }
      currentX += BOX_W;
    }
  };

  // 1. Resident Category & Request Type
  const residentCategory = formData.get("residentCategory");
  if (residentCategory === "Resident") drawCheck(34, Y_COORDS.residency);
  else if (residentCategory === "NRI") drawCheck(94, Y_COORDS.residency);
  else if (residentCategory === "OCI") drawCheck(210, Y_COORDS.residency);

  const requestType = formData.get("requestType");
  if (requestType === "NewEnrolment") drawCheck(408, Y_COORDS.residency);
  else if (requestType === "UpdateRequest") drawCheck(488, Y_COORDS.residency);

  // 2. Personal Info
  // Aadhaar Number is spaced out in boxes with gaps
  const aadhaarStr = String(formData.get("aadhaarNumber") || "").padEnd(12, " ");
  let aadhaarX = 183;
  for (let i = 0; i < 12; i++) {
    if (aadhaarStr[i] !== ' ') drawText(aadhaarStr[i], aadhaarX + 3.5, Y_COORDS.aadhaar, true, 12);
    aadhaarX += BOX_W;
    if (i === 3 || i === 7) aadhaarX += 7; // Gap after 4th and 8th digit
  }

  // Draw other fields using grid
  drawGridText(String(formData.get("fullName") || ""), GRID_X, Y_COORDS.name);
  drawGridText(String(formData.get("houseNo") || ""), GRID_X, Y_COORDS.houseNo);
  drawGridText(String(formData.get("street") || ""), GRID_X, Y_COORDS.street);
  drawGridText(String(formData.get("landmark") || ""), GRID_X, Y_COORDS.landmark);
  drawGridText(String(formData.get("area") || ""), GRID_X, Y_COORDS.area);
  drawGridText(String(formData.get("city") || ""), GRID_X, Y_COORDS.city);
  drawGridText(String(formData.get("postOffice") || ""), GRID_X, Y_COORDS.postOffice);
  drawGridText(String(formData.get("district") || ""), GRID_X, Y_COORDS.district);
  drawGridText(String(formData.get("state") || ""), GRID_X, Y_COORDS.state);
  
  // PIN Code boxes start further right
  drawGridText(String(formData.get("pinCode") || ""), GRID_X + 2 * BOX_W, Y_COORDS.pinCode);

  // 3. Certifier Details
  drawGridText(String(formData.get("certifierName") || ""), GRID_X, Y_COORDS.certName);
  drawGridText(String(formData.get("certifierDesignation") || ""), GRID_X, Y_COORDS.certDesignation);
  drawGridText(String(formData.get("certifierOfficeAddress") || ""), GRID_X, Y_COORDS.certAddress);
  
  // Certifier Contact
  drawGridText(String(formData.get("certifierContact") || ""), GRID_X + 3 * BOX_W, Y_COORDS.certContact);

  // 4. Certifier Type Checkmarks
  const cType = formData.get("certifierType") as string | null;
  const cTypeY = {
    MP_MLA_MLC: pdf2jsonToPdfLib(0, 42.619).y,
    GazettedA: pdf2jsonToPdfLib(0, 43.231).y,
    GazettedB: pdf2jsonToPdfLib(0, 44.279).y,
    NACO: pdf2jsonToPdfLib(0, 44.891).y,
    HeadOfInstitute: pdf2jsonToPdfLib(0, 45.938).y,
    VillagePanchayat: pdf2jsonToPdfLib(0, 46.985).y,
    EPFO: pdf2jsonToPdfLib(0, 43.231).y, // Same row as GazettedA
  };
  
  if (cType && cType in cTypeY) {
    const yPos = cTypeY[cType as keyof typeof cTypeY];
    drawCheck(34, yPos);
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
  let currentX = 405;
  for (let i = 0; i < 8; i++) {
    drawText(dateStr[i], currentX + 3.5, dateY, true, 12);
    currentX += BOX_W;
    if (i === 1 || i === 3) currentX += 7; // Gap after DD and MM
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
