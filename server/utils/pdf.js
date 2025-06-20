import fs from 'fs';
import path from 'path';

export const generateInvoicePDF = async (invoice) => {
  try {
    // Simple text-based PDF generation for demo
    // In production, use a proper PDF library like jsPDF or PDFKit
    
    const pdfContent = `
EMART GROCERY STORE
Invoice: ${invoice.invoiceNumber}
=====================================

Vendor Code: ${invoice.vendorCode}
Type: ${invoice.type.toUpperCase()}
Status: ${invoice.status.toUpperCase()}
Amount: ${invoice.amount} ${invoice.currency}

Created: ${new Date(invoice.createdAt).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}

${invoice.products && invoice.products.length > 0 ? `
PRODUCTS:
---------
${invoice.products.map(product => `
${product.productId.description}
Quantity: ${product.quantity}
Unit Price: ${product.unitPrice} ${invoice.currency}
Total: ${product.totalPrice} ${invoice.currency}
`).join('\n')}
` : ''}

${invoice.notes ? `
NOTES:
------
${invoice.notes}
` : ''}

Total Amount: ${invoice.amount} ${invoice.currency}

=====================================
Generated on: ${new Date().toLocaleString()}
eMart Inventory Management System
    `;

    // Return as buffer (in production, generate actual PDF)
    return Buffer.from(pdfContent, 'utf8');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};