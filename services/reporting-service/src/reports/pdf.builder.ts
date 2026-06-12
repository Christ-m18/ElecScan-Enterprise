import PDFDocument from 'pdfkit';

interface PdfRow {
  ts: string;
  metric_key: string;
  phase: string;
  value: number;
}

interface PdfOptions {
  deviceId: string;
  type: string;
  from: string;
  to: string;
  rows: PdfRow[];
  aliases: string[];
}

export function buildPdf(opts: PdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Header ──────────────────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#2D2D2D')
      .text('ElecScan Enterprise', 40, 40);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#5A6B7B')
      .text('Reporte de Calidad de Energía Eléctrica', 40, 62);

    doc.moveTo(40, 80).lineTo(555, 80).lineWidth(1).strokeColor('#D0D0D0').stroke();

    // ── Metadata ─────────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor('#777777');
    doc.text(`Dispositivo: ${opts.deviceId}`, 40, 92);
    doc.text(`Tipo: ${opts.type}`, 40, 106);
    doc.text(
      `Período: ${new Date(opts.from).toLocaleString('es')} → ${new Date(opts.to).toLocaleString('es')}`,
      40,
      120,
    );
    doc.text(`Generado: ${new Date().toLocaleString('es')}`, 40, 134);
    doc.text(`Total registros: ${opts.rows.length}`, 40, 148);

    doc.moveTo(40, 164).lineTo(555, 164).lineWidth(0.5).strokeColor('#E0E0E0').stroke();

    // ── Table ─────────────────────────────────────────────────────────────────
    const COL_W = 90;
    const ROW_H = 16;
    const TABLE_TOP = 175;
    const headers = ['Timestamp', ...opts.aliases.slice(0, 5)];

    // Group rows by timestamp
    const byTs = new Map<string, Record<string, string>>();
    for (const row of opts.rows) {
      const key = `${row.metric_key}${row.phase && row.phase !== 'total' ? `_${row.phase}` : ''}`;
      const ts = new Date(row.ts).toLocaleString('es');
      const existing = byTs.get(ts) ?? {};
      existing[key] = Number(row.value).toFixed(3);
      byTs.set(ts, existing);
    }
    const tableRows = [...byTs.entries()].sort(([a], [b]) => a.localeCompare(b));

    // Draw header row
    doc.rect(40, TABLE_TOP, 515, ROW_H).fillColor('#5A6B7B').fill();
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF');
    headers.forEach((h, i) => {
      doc.text(h, 42 + i * COL_W, TABLE_TOP + 4, { width: COL_W - 4, ellipsis: true });
    });

    // Draw data rows (max 200 rows to keep PDF size reasonable)
    let y = TABLE_TOP + ROW_H;
    const maxRows = Math.min(tableRows.length, 200);

    for (let i = 0; i < maxRows; i++) {
      const [ts, vals] = tableRows[i] as [string, Record<string, string>];
      const bg = i % 2 === 0 ? '#FFFFFF' : '#F8F8F8';
      doc.rect(40, y, 515, ROW_H).fillColor(bg).fill();
      doc.font('Helvetica').fontSize(6.5).fillColor('#333333');

      const cells = [ts, ...opts.aliases.slice(0, 5).map((a) => vals[a] ?? '')];
      cells.forEach((cell, ci) => {
        doc.text(cell, 42 + ci * COL_W, y + 4, { width: COL_W - 4, ellipsis: true });
      });

      y += ROW_H;

      // New page if needed
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }
    }

    if (tableRows.length > 200) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(8)
        .fillColor('#777777')
        .text(
          `… y ${tableRows.length - 200} registros adicionales (ver CSV para datos completos)`,
          40,
          y + 8,
        );
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#AAAAAA')
      .text('ElecScan Enterprise — Reporte generado automáticamente', 40, doc.page.height - 30, {
        align: 'center',
        width: 515,
      });

    doc.end();
  });
}
