import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ExportData {
  headers: string[];
  data: any[][];
  title: string;
  filename: string;
}

export const exportToExcel = (exportData: ExportData) => {
  const { headers, data, filename } = exportData;
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Auto-size columns
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const colWidths = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && cell.v) {
        const cellLength = cell.v.toString().length;
        if (cellLength > maxWidth) {
          maxWidth = cellLength;
        }
      }
    }
    colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
  }
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  
  // Save file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (exportData: ExportData) => {
  const { headers, data, title, filename } = exportData;
  
  // Create PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 22);
  
  // Add creation date
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
  
  // Add table
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [4, 201, 4],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 40 },
  });
  
  // Save PDF
  doc.save(`${filename}.pdf`);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR");
};