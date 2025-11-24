// Mobile friendly dimensions (approx 4.5 inches width)
// TWIPS = 1/20th of a point. 1 inch = 1440 TWIPS.
const MOBILE_WIDTH_TWIPS = 6480; // 4.5 inches
const MOBILE_HEIGHT_TWIPS = 11520; // 8 inches
const MARGIN_TWIPS = 720; // 0.5 inch

export const generateMobileDocx = async (text: string): Promise<Blob> => {
  // Use exact import name from import map
  const { Document, Packer, Paragraph, TextRun, PageOrientation } = await import("docx");

  // Split text by newlines to create paragraphs
  const paragraphs = text.split('\n').filter(line => line.trim().length > 0).map(line => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line.trim(),
          font: {
            name: "Vazirmatn", // Primary font
            hint: "cs", // Complex Script hint for Word
          }, 
          size: 28, // 14pt (Twips 1/2)
          rightToLeft: true,
        }),
      ],
      bidirectional: true, // Critical for RTL
      spacing: {
        after: 200, // Space after paragraph
        line: 360, // 1.5 Line spacing
      },
    });
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: {
              name: "Tahoma", // Fallback for Win7 if Vazir isn't installed
              cs: "Tahoma",
              hint: "cs",
            }
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: MOBILE_WIDTH_TWIPS,
              height: MOBILE_HEIGHT_TWIPS,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  // Use Packer to create Blob
  const blob = await Packer.toBlob(doc);
  return blob;
};
