# School Management System - Backend API

A comprehensive Node.js backend API for a multi-tenant School Management System.

## Features

- **Multi-tenant Architecture**: Complete data isolation between different schools
- **RESTful API**: Well-structured API endpoints with proper HTTP methods
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation using Joi
- **Error Handling**: Centralized error handling with proper HTTP responses
- **Rate Limiting**: API rate limiting for security
- **Campus Module**: Sample implementation with CRUD operations

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (schema ready)
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Custom middleware
│   ├── models/        # Data models (mock implementation)
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic
│   ├── utils/         # Helper functions
│   ├── validators/    # Input validation schemas
│   └── app.js         # Express app configuration
├── tests/             # Test files
├── package.json
├── server.js          # Application entry point
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn
- PostgreSQL (for production use)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues

## API Endpoints

### Health Check
- `GET /health` - Health status of the API

### Campus Module (Sample Implementation)
- `GET /api/campus` - Get all campuses with filtering and pagination
- `GET /api/campus/:id` - Get campus by ID
- `POST /api/campus` - Create new campus (Admin only)
- `PUT /api/campus/:id` - Update campus (Admin only)
- `DELETE /api/campus/:id` - Delete campus (Admin only)

### Future Endpoints
- Authentication: `/api/auth/*`
- Students: `/api/students/*`
- Staff: `/api/staff/*`
- Attendance: `/api/attendance/*`
- Grades: `/api/grades/*`
- Fees: `/api/fees/*`

## Sample API Usage

### Get All Campuses
```bash
curl -X GET "http://localhost:5000/api/campus" \
  -H "X-Tenant-ID: default-tenant"
```

### Get Campus by ID
```bash
curl -X GET "http://localhost:5000/api/campus/campus-1" \
  -H "X-Tenant-ID: default-tenant"
```

## Configuration

### Environment Variables

Key environment variables (see `.env.example`):

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sms_database
DB_USERNAME=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Multi-Tenant Architecture

The application supports multi-tenancy through:

1. **Tenant Resolution**: Automatically resolves tenant from request headers or subdomain
2. **Data Isolation**: All data operations are scoped to the current tenant
3. **Tenant Middleware**: Validates and attaches tenant information to requests

### Tenant Identification

Tenants can be identified through:
- `X-Tenant-ID` header
- Subdomain (e.g., `school1.domain.com`)
- Query parameter: `?tenantId=school1`

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Joi schema validation
- **JWT Authentication**: Secure token-based auth
- **Error Handling**: Prevents information leakage

## Mock Data

The application includes mock data for development:

- **Tenants**: `default-tenant`, `demo-school`
- **Campuses**: Multiple sample campuses with different locations
- **Users**: Admin and teacher demo accounts

## Database Integration

Currently uses mock data for development. To integrate with PostgreSQL:

1. Install database connection package
2. Update model files to use actual database queries
3. Run migrations to create tables
4. Update configuration

## Testing

Run tests with:
```bash
npm test
```

Test structure:
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Test helpers: `tests/helpers/`

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure proper database connection
- Set secure JWT secrets
- Configure CORS for production domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.
