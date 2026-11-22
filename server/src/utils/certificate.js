import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/**
 * The certificate PDF.
 *
 * It is generated on demand from the certificate row and streamed straight to
 * the response — nothing is written to disk, so there are no temporary files
 * to lose on a redeploy, no object storage to configure, and no public URL
 * that bypasses the ownership check in the controller. The database row is
 * the persistent artefact; the PDF is a rendering of it.
 *
 * Every value on the page comes from that row's own volunteer and event.
 */

// The HelpHop palette, matching the web application.
const LINEN = '#F6F0E6';
const PAPER = '#FFFCF7';
const SAGE = '#5C6C57';
const SAGE_SOFT = '#A8B6A4';
const TERRA = '#B9674E';
const ESPRESSO = '#493D34';
const MUTED = '#74685D';
const OAT = '#D8B99A';

/** Public URL a scanner lands on to confirm a certificate is genuine. */
export function verifyUrl(code) {
  const origin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
  return `${origin.replace(/\/$/, '')}/verify/${code}`;
}

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** Centres a line of text across the page, whatever the current font. */
function centred(doc, text, y, { size, font, color, width }) {
  const pageWidth = doc.page.width;
  const inset = (pageWidth - width) / 2;
  doc.font(font).fontSize(size).fillColor(color).text(text, inset, y, { width, align: 'center' });
}

/**
 * Streams an A4 landscape certificate for one volunteer to `res`.
 * Every field is required — there is no sample data and no default name.
 */
export async function streamCertificatePdf(
  res,
  { volunteerName, eventTitle, orgName, eventDate, issuedAt, code }
) {
  const url = verifyUrl(code);
  const qr = await QRCode.toBuffer(url, {
    margin: 0,
    width: 320,
    errorCorrectionLevel: 'M',
    color: { dark: ESPRESSO, light: PAPER },
  });

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0,
    info: {
      Title: `Certificate of Participation — ${volunteerName}`,
      Author: orgName,
      Subject: eventTitle,
      Keywords: `HelpHop, certificate, ${code}`,
    },
  });
  doc.pipe(res);

  const { width, height } = doc.page;
  const text = width - 220; // the measure body copy is set to

  // ---------------------------------------------------------------- ground
  doc.rect(0, 0, width, height).fill(LINEN);
  doc.rect(28, 28, width - 56, height - 56).fill(PAPER);

  // A single sage keyline, with a thin oat rule inside it.
  doc.lineWidth(1.6).strokeColor(SAGE).rect(28, 28, width - 56, height - 56).stroke();
  doc.lineWidth(0.6).strokeColor(OAT).rect(40, 40, width - 80, height - 80).stroke();

  // A terracotta tick in the top corner — the one accent on the page. Drawn
  // on the inner rule rather than the outer keyline so the stroke sits wholly
  // inside the frame instead of half-spilling into the margin.
  doc.lineWidth(2.5).strokeColor(TERRA).moveTo(40, 104).lineTo(40, 40).lineTo(104, 40).stroke();

  // ------------------------------------------------------------- masthead
  centred(doc, 'HELPHOP', 76, {
    size: 10,
    font: 'Helvetica-Bold',
    color: SAGE,
    width: text,
  });
  doc.font('Helvetica').fontSize(10).fillColor(SAGE);
  centred(doc, 'A little help can go a long way', 92, {
    size: 9,
    font: 'Helvetica-Oblique',
    color: SAGE_SOFT,
    width: text,
  });

  // ---------------------------------------------------------------- title
  centred(doc, 'Certificate of Participation', 126, {
    size: 32,
    font: 'Times-Roman',
    color: ESPRESSO,
    width: text,
  });

  const ruleWidth = 90;
  doc
    .lineWidth(0.8)
    .strokeColor(OAT)
    .moveTo((width - ruleWidth) / 2, 176)
    .lineTo((width + ruleWidth) / 2, 176)
    .stroke();

  // ------------------------------------------------------- the volunteer
  centred(doc, 'This is to certify that', 198, {
    size: 11,
    font: 'Helvetica',
    color: MUTED,
    width: text,
  });

  // The name is the largest thing on the page, and it is this volunteer's
  // alone — one certificate row, one person.
  centred(doc, volunteerName, 222, {
    size: 30,
    font: 'Times-Bold',
    color: ESPRESSO,
    width: text,
  });

  doc.font('Times-Bold').fontSize(30);
  const nameRule = Math.min(doc.widthOfString(volunteerName) + 70, text);
  doc
    .lineWidth(0.8)
    .strokeColor(SAGE_SOFT)
    .moveTo((width - nameRule) / 2, 266)
    .lineTo((width + nameRule) / 2, 266)
    .stroke();

  // ------------------------------------------------------------ the event
  centred(doc, 'gave their time as a volunteer at', 284, {
    size: 11,
    font: 'Helvetica',
    color: MUTED,
    width: text,
  });

  centred(doc, eventTitle, 306, {
    size: 18,
    font: 'Times-Bold',
    color: SAGE,
    width: text,
  });

  centred(doc, `organised by ${orgName}  ·  ${formatDate(eventDate)}`, 336, {
    size: 11,
    font: 'Helvetica',
    color: MUTED,
    width: text,
  });

  centred(doc, 'with the thanks of everyone they helped.', 358, {
    size: 11,
    font: 'Helvetica-Oblique',
    color: MUTED,
    width: text,
  });

  // --------------------------------------------------------------- footer
  const footerY = height - 142;
  doc
    .lineWidth(0.6)
    .strokeColor(OAT)
    .moveTo(90, footerY - 18)
    .lineTo(width - 90, footerY - 18)
    .stroke();

  const field = (label, value, x, valueFont = 'Helvetica-Bold') => {
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(label, x, footerY, {
      characterSpacing: 1.4,
      lineBreak: false,
    });
    doc.font(valueFont).fontSize(11).fillColor(ESPRESSO).text(value, x, footerY + 14, {
      lineBreak: false,
    });
  };

  field('ISSUED', formatDate(issuedAt), 90);

  // Same two-line rhythm, one row down.
  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('CERTIFICATE NUMBER', 90, footerY + 40, {
    characterSpacing: 1.4,
    lineBreak: false,
  });
  doc.font('Courier-Bold').fontSize(12).fillColor(ESPRESSO).text(code, 90, footerY + 54, {
    lineBreak: false,
  });

  // Authorised by the organisation that ran the event.
  const signX = width / 2 - 20;
  doc
    .lineWidth(0.8)
    .strokeColor(SAGE_SOFT)
    .moveTo(signX, footerY + 34)
    .lineTo(signX + 190, footerY + 34)
    .stroke();
  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('AUTHORISED BY', signX, footerY + 42, {
    characterSpacing: 1.4,
    lineBreak: false,
  });
  doc.font('Helvetica-Bold').fontSize(11).fillColor(ESPRESSO).text(orgName, signX, footerY + 56, {
    width: 190,
    lineBreak: false,
    ellipsis: true,
  });

  const qrSize = 84;
  const qrX = width - 90 - qrSize;
  doc.image(qr, qrX, footerY - 2, { width: qrSize, height: qrSize });
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(MUTED)
    .text('Scan to verify', qrX - 25, footerY + qrSize + 3, {
      width: qrSize + 50,
      align: 'center',
    });

  doc.end();
}
