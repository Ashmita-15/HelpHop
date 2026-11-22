import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const INK = '#1f2937';
const BRAND = '#15803d';
const MUTED = '#6b7280';

/** Public URL a scanner lands on to confirm a certificate is genuine. */
export function verifyUrl(code) {
  const origin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
  return `${origin.replace(/\/$/, '')}/verify/${code}`;
}

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Streams an A4 landscape certificate straight to the response — nothing is
 * written to disk, so there are no stale files to clean up or secure.
 */
export async function streamCertificatePdf(res, { volunteerName, eventTitle, orgName, eventDate, issuedAt, code }) {
  const url = verifyUrl(code);
  const qr = await QRCode.toBuffer(url, { margin: 1, width: 300, errorCorrectionLevel: 'M' });

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  doc.pipe(res);

  const { width, height } = doc.page;

  // Double border
  doc.rect(0, 0, width, height).fill('#ffffff');
  doc.lineWidth(6).strokeColor(BRAND).rect(24, 24, width - 48, height - 48).stroke();
  doc.lineWidth(1).strokeColor('#bbf7d0').rect(38, 38, width - 76, height - 76).stroke();

  doc.fillColor(BRAND).fontSize(11).font('Helvetica-Bold')
    .text('VOLUNTEERCONNECT', 0, 72, { align: 'center', characterSpacing: 3 });

  doc.fillColor(INK).fontSize(34).font('Helvetica-Bold')
    .text('Certificate of Participation', 0, 104, { align: 'center' });

  doc.fillColor(MUTED).fontSize(12).font('Helvetica')
    .text('This is to certify that', 0, 160, { align: 'center' });

  doc.fillColor(INK).fontSize(30).font('Helvetica-Bold')
    .text(volunteerName, 60, 190, { align: 'center', width: width - 120 });

  // Underline sized to the name
  const nameWidth = Math.min(doc.widthOfString(volunteerName) + 80, width - 160);
  doc.lineWidth(1).strokeColor('#d1d5db')
    .moveTo((width - nameWidth) / 2, 232).lineTo((width + nameWidth) / 2, 232).stroke();

  doc.fillColor(MUTED).fontSize(12).font('Helvetica')
    .text('volunteered at', 0, 248, { align: 'center' });

  doc.fillColor(INK).fontSize(19).font('Helvetica-Bold')
    .text(eventTitle, 80, 272, { align: 'center', width: width - 160 });

  doc.fillColor(MUTED).fontSize(12).font('Helvetica')
    .text(`organised by ${orgName}  ·  ${formatDate(eventDate)}`, 80, 302, {
      align: 'center',
      width: width - 160,
    });

  // Footer: issue date left, QR + code right
  const footerY = height - 150;
  doc.fillColor(MUTED).fontSize(9).font('Helvetica')
    .text('ISSUED', 76, footerY, { characterSpacing: 1.5 });
  doc.fillColor(INK).fontSize(12).font('Helvetica-Bold')
    .text(formatDate(issuedAt), 76, footerY + 14);

  doc.fillColor(MUTED).fontSize(9).font('Helvetica')
    .text('CERTIFICATE ID', 76, footerY + 42, { characterSpacing: 1.5 });
  doc.fillColor(INK).fontSize(12).font('Courier-Bold')
    .text(code, 76, footerY + 56);

  const qrSize = 92;
  const qrX = width - 76 - qrSize;
  doc.image(qr, qrX, footerY - 4, { width: qrSize, height: qrSize });
  doc.fillColor(MUTED).fontSize(8).font('Helvetica')
    .text('Scan to verify', qrX - 20, footerY + qrSize + 2, { width: qrSize + 40, align: 'center' });

  doc.end();
}
