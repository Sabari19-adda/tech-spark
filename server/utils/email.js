import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

export const sendAlertEmail = async (alert) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration not set, skipping email send');
      return;
    }

    const transporter = createTransporter();
    const product = alert.productId;

    const subject = `eMart Alert: ${alert.type.replace('_', ' ').toUpperCase()} - ${product.description}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">eMart Inventory Alert</h2>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Alert Details</h3>
          <p><strong>Type:</strong> ${alert.type.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Created:</strong> ${new Date(alert.createdAt).toLocaleString()}</p>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #374151; margin-top: 0;">Product Information</h3>
          <p><strong>Description:</strong> ${product.description}</p>
          <p><strong>Vendor Code:</strong> ${product.vendorCode}</p>
          <p><strong>Category:</strong> ${product.category}</p>
          <p><strong>Warehouse Stock:</strong> ${product.warehouseStock}</p>
          <p><strong>Shelf Stock:</strong> ${product.shelfStock}</p>
          <p><strong>Total Stock:</strong> ${product.warehouseStock + product.shelfStock}</p>
          <p><strong>Minimum Threshold:</strong> ${product.minThreshold}</p>
          <p><strong>Expiry Date:</strong> ${new Date(product.expiryDate).toLocaleDateString()}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          This is an automated alert from the eMart Inventory Management System.
          Please take appropriate action to resolve this issue.
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'admin@emart.com', // In production, this should be configurable
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Alert email sent for product: ${product.description}`);
  } catch (error) {
    console.error('Error sending alert email:', error);
    throw error;
  }
};

export const sendInvoiceEmail = async (invoice) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration not set, skipping email send');
      return;
    }

    const transporter = createTransporter();

    const subject = `eMart Invoice ${invoice.invoiceNumber} - ${invoice.type.toUpperCase()}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">eMart Invoice</h2>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #059669; margin-top: 0;">Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Type:</strong> ${invoice.type.toUpperCase()}</p>
          <p><strong>Vendor Code:</strong> ${invoice.vendorCode}</p>
          <p><strong>Amount:</strong> ${invoice.amount} ${invoice.currency}</p>
          <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Created:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
        </div>

        ${invoice.products && invoice.products.length > 0 ? `
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #374151; margin-top: 0;">Products</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Product</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Qty</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Unit Price</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.products.map(product => `
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${product.productId.description}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${product.quantity}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${product.unitPrice}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${product.totalPrice}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${invoice.notes ? `
        <div style="background-color: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #d97706; margin-top: 0;">Notes</h3>
          <p>${invoice.notes}</p>
        </div>
        ` : ''}

        <p style="color: #6b7280; font-size: 14px;">
          This is an automated invoice from the eMart Inventory Management System.
          Please process this invoice according to your payment terms.
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: `vendor-${invoice.vendorCode}@example.com`, // In production, maintain vendor email database
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent for: ${invoice.invoiceNumber}`);
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};