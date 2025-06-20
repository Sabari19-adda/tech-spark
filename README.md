# eMart Inventory Management System

A comprehensive inventory management system for grocery stores with MongoDB backend integration.

## Features

- **User Authentication & Authorization**: Role-based access control (Admin, Maker, Checker)
- **Product Management**: Add, approve, reject, and manage grocery products
- **Stock Management**: Track warehouse and shelf stock with transfer capabilities
- **Alert System**: Automated alerts for low stock, expiring products, and damaged goods
- **Invoice Management**: Generate and manage supplier invoices
- **CSV Import**: Bulk import products via CSV files
- **Barcode Generation**: Generate barcodes for approved products
- **Email Notifications**: Send alerts and invoices via email
- **Real-time Dashboard**: Monitor inventory metrics and statistics

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons
- Date-fns for date handling

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email notifications
- Multer for file uploads

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd emart-inventory-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/emart_inventory
   JWT_SECRET=your_super_secret_jwt_key_here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Start MongoDB**
   - For local MongoDB: `mongod`
   - For MongoDB Atlas: Ensure your connection string is correct in `.env`

5. **Seed the database** (optional)
   ```bash
   node server/scripts/seed.js
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 5173).

### Default Login Credentials

After seeding the database:
- **Admin**: `admin` / `password123`
- **Maker**: `maker` / `password123`
- **Checker**: `checker` / `password123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `POST /api/products/:id/approve` - Approve product
- `POST /api/products/:id/reject` - Reject product
- `POST /api/products/:id/transfer` - Transfer stock
- `POST /api/products/:id/barcode` - Generate barcode

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/stats` - Get alert statistics
- `POST /api/alerts/:id/resolve` - Resolve alert
- `POST /api/alerts/:id/send-email` - Send alert email

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `POST /api/invoices/:id/pdf` - Generate PDF
- `POST /api/invoices/:id/send-email` - Send invoice email

### File Upload
- `POST /api/upload/csv` - Upload CSV file
- `GET /api/upload/sample-csv` - Download sample CSV

## User Roles & Permissions

### Maker
- Add new products
- Upload CSV files
- View inventory and alerts
- Cannot approve/reject products

### Checker
- Approve/reject products
- Manage invoices
- All maker permissions
- Cannot modify approved products

### Admin
- All system permissions
- User management
- System configuration
- Full access to all features

## CSV File Format

The system accepts CSV files with the following format:

**Header Line**: `rowCount,totalAmount,timestamp,hashCode`

**Product Lines**: `ID,VendorCode,Category,Description,Count,Cost,Currency,ExpiryDate`

Example:
```csv
5,1234.50,2025-01-08T10:00:00Z,abc123hash
ID001,VND001,Dairy,Fresh Milk 1L,100,3.99,USD,2025-02-15
ID002,VND002,Produce,Organic Bananas,50,2.49,USD,2025-01-20
```

## Alert System

The system automatically generates alerts for:
- **Low Stock**: When product stock falls below minimum threshold
- **Expiry Warning**: 3 days before product expiration
- **Damaged Goods**: When products are marked as damaged

## Email Configuration

To enable email notifications:
1. Set up an email account (Gmail recommended)
2. Generate an app password for Gmail
3. Update `.env` file with email credentials
4. Restart the server

## Production Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Use strong JWT secret
   - Configure production MongoDB URI
   - Set up proper email credentials

2. **Build Frontend**
   ```bash
   npm run build
   ```

3. **Security Considerations**
   - Use HTTPS in production
   - Implement rate limiting
   - Set up proper CORS policies
   - Use environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.