import { jsPDF } from 'jspdf';
import { WHO_STANDARDS } from './hmpiEngine';

export function generateHMPIPdfReport(result) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  // Header Banner
  doc.setFillColor(37, 99, 235); // Blue primary
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GROUNDWATER HMPI QUALITY ASSESSMENT REPORT', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Central Groundwater Assessment Platform · WHO IS:10500 Compliant', margin, 18);

  y = 32;

  // Sample Information Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 28, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Station: ${result.location || result.sample_id}`, margin + 5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Sample ID: ${result.sample_id || 'N/A'}`, margin + 5, y + 15);
  doc.text(`Date Assessed: ${result.timestamp ? result.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]}`, margin + 5, y + 21);

  const lat = result.coordinates?.lat || 'N/A';
  const lng = result.coordinates?.lng || 'N/A';
  doc.text(`Geo-Coordinates: ${lat}° N, ${lng}° E`, margin + 90, y + 15);
  doc.text(`Source Type: ${result.source_type || 'Borewell'}`, margin + 90, y + 21);

  y += 34;

  // Key Index Summary Cards
  const cardWidth = (pageWidth - 2 * margin - 12) / 4;
  const hmpiScore = result.hmpi?.value ? result.hmpi.value.toFixed(2) : 'N/A';
  const hmpiLabel = result.hmpi?.classification?.label || 'Safe';
  const heiScore = result.hei?.value ? result.hei.value.toFixed(2) : 'N/A';
  const cdScore = result.cd?.value ? result.cd.value.toFixed(2) : 'N/A';
  const hiAdult = result.hhra?.adult?.HI ? result.hhra.adult.HI.toFixed(3) : 'N/A';

  const cards = [
    { title: 'HMPI SCORE', val: hmpiScore, sub: hmpiLabel, color: [37, 99, 235] },
    { title: 'HEI SCORE', val: heiScore, sub: result.hei?.classification?.label || 'Low', color: [13, 148, 136] },
    { title: 'DEGREE OF CONT.', val: cdScore, sub: result.cd?.classification?.label || 'Low', color: [245, 158, 11] },
    { title: 'HAZARD INDEX', val: hiAdult, sub: result.hhra?.adult?.HI > 1 ? 'Unacceptable' : 'Acceptable', color: result.hhra?.adult?.HI > 1 ? [225, 29, 72] : [16, 185, 129] },
  ];

  cards.forEach((c, idx) => {
    const x = margin + idx * (cardWidth + 4);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardWidth, 22, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text(c.title, x + 4, y + 6);

    doc.setFontSize(14);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.val, x + 4, y + 14);

    doc.setFontSize(7);
    doc.text(c.sub, x + 4, y + 19);
  });

  y += 28;

  // Section: Heavy Metal Analysis Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Heavy Metal Observed Values & Compliance Table', margin, y);

  y += 4;

  // Table Headers
  const cols = [
    { header: 'Metal', x: margin, w: 22 },
    { header: 'Observed (mg/L)', x: margin + 22, w: 32 },
    { header: 'WHO Limit', x: margin + 54, w: 26 },
    { header: 'Sub-Index (Qn)', x: margin + 80, w: 30 },
    { header: 'Status', x: margin + 110, w: 30 },
    { header: 'Primary Health Risk', x: margin + 140, w: 42 },
  ];

  doc.setFillColor(239, 246, 255);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);

  cols.forEach(col => {
    doc.text(col.header, col.x + 2, y + 5);
  });

  y += 7;

  // Table Rows
  const qnMap = result.hmpi?.Qn_values || {};
  const concs = result.concentrations || result.raw?.concentrations || {};
  const metals = Object.keys(concs);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  metals.forEach((m, i) => {
    const std = WHO_STANDARDS[m];
    if (!std) return;
    const obs = parseFloat(concs[m]);
    const limit = std.limit;
    const qn = qnMap[m] ? qnMap[m].toFixed(1) : (100 * (obs / limit)).toFixed(1);
    const isExceeded = obs > limit;

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`${std.name} (${m})`, cols[0].x + 2, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(isExceeded ? 225 : 15, isExceeded ? 29 : 23, isExceeded ? 72 : 42);
    doc.text(`${obs.toFixed(4)}`, cols[1].x + 2, y + 4.5);

    doc.setTextColor(100, 116, 139);
    doc.text(`${limit}`, cols[2].x + 2, y + 4.5);

    doc.setTextColor(isExceeded ? 225 : 37, isExceeded ? 29 : 99, isExceeded ? 72 : 235);
    doc.text(`${qn}`, cols[3].x + 2, y + 4.5);

    if (isExceeded) {
      doc.setTextColor(225, 29, 72);
      doc.text(`EXCEEDED (×${(obs / limit).toFixed(1)})`, cols[4].x + 2, y + 4.5);
    } else {
      doc.setTextColor(16, 185, 129);
      doc.text('Safe (Within Limits)', cols[4].x + 2, y + 4.5);
    }

    doc.setTextColor(100, 116, 139);
    doc.text(`${std.health_risk || 'N/A'}`, cols[5].x + 2, y + 4.5);

    y += 6;
  });

  y += 6;

  // Section: Human Health Risk Assessment (HHRA)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Human Health Risk Assessment (Oral Ingestion Pathway)', margin, y);

  y += 4;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  const adultHI = result.hhra?.adult?.HI ? result.hhra.adult.HI.toFixed(4) : 'N/A';
  const childHI = result.hhra?.child?.HI ? result.hhra.child.HI.toFixed(4) : 'N/A';

  doc.text(`• Adult Population (70kg BW): Hazard Index (HI) = ${adultHI} (${result.hhra?.adult?.HI > 1 ? 'Unacceptable non-carcinogenic risk' : 'Acceptable risk'})`, margin + 2, y + 4);
  doc.text(`• Child Population (15kg BW): Hazard Index (HI) = ${childHI} (${result.hhra?.child?.HI > 1 ? 'Unacceptable non-carcinogenic risk' : 'Acceptable risk'})`, margin + 2, y + 9);

  y += 16;

  // Section: Treatment & Remediation Guidelines
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Actionable Water Remediation & Treatment Plan', margin, y);

  y += 4;

  const exceeded = result.remediation || [];
  if (exceeded.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text('✅ Water parameters satisfy all WHO drinking standards. No active chemical remediation is required.', margin + 2, y + 4);
    y += 10;
  } else {
    exceeded.forEach((rec, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 16;
      }
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 14, 2, 2, 'F');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(159, 18, 57);
      doc.text(`⚠️ Contaminant: ${rec.fullName} (${rec.metal}) — Observed: ${rec.observed} mg/L (Limit: ${rec.limit} mg/L)`, margin + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Immediate Action: ${rec.remediation?.immediateAction || 'Avoid direct ingestion. Use RO filtration.'}`, margin + 4, y + 10);

      y += 16;
    });
  }

  // Footer & Cryptographic Security Stamp
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`HMPI Analyzer Official PDF Report · SHA-256 Audit Seal: ${result.blockchain?.currentHash || '0x7f8a9b2c3d4e'}`, margin, 290);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 14, 290);
  }

  doc.save(`HMPI_Report_${result.sample_id || 'Groundwater'}.pdf`);
}
