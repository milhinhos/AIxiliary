# AIxiliary - AI-Powered File Classification & Expense Management System

A web application that combines two powerful features:
1. **AI Classification**: Submit files from OneDrive (or local computer) and have them automatically classified and analyzed using OpenAI's GPT-4
2. **NI Expenses**: A simple expense management system for tracking and managing expenses with OneDrive storage

## Features

### AI Classification
- **OneDrive Integration**: Authenticate with Microsoft OAuth and access OneDrive files
- **Drag & Drop Interface**: Simple, intuitive file submission interface
- **AI-Powered Classification**: Use GPT-4 to automatically classify and extract information from documents
- **Custom Configuration**: Define your own classification prompts and extraction rules
- **Multiple File Formats**: Support for PDF, DOCX, TXT, JSON, CSV, XML, HTML, and more
- **Real-time Processing**: Submit and process files with immediate feedback
- **Results Display**: View classification results and extracted information in an organized manner

### NI Expenses
- **Expense Submission**: Simple form to submit expenses with details and attachments
- **OneDrive Storage**: All expenses and files are stored in your OneDrive account
- **Multi-User Support**: Supports 3 users (User1, User2, User3)
- **File Attachments**: Upload JPG or PDF receipts/invoices (up to 10MB)
- **State Management**: Track expense states (recebida, paga, rejeitada)
- **Monthly Reports**: View and filter expenses by user and month
- **Expense Tracking**: Monitor total expenses and status breakdowns

## Architecture

```
AIxiliary/
├── backend/              # Node.js/Express API server
│   ├── src/
│   │   ├── config/       # Configuration management
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript types
│   │   └── index.ts      # Server entry point
│   └── package.json
├── frontend/             # React web application
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── context/      # React context providers
│   │   ├── pages/        # Page components
│   │   ├── types/        # TypeScript types
│   │   └── main.tsx      # App entry point
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Microsoft Azure AD application (for OneDrive OAuth)

## Setup Instructions

### 1. Microsoft Azure AD Configuration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations** > **New registration**
3. Set up your application:
   - **Name**: AIxiliary (or your preferred name)
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Web - `http://localhost:3001/auth/callback`
4. After creation, note down:
   - **Application (client) ID**
   - **Directory (tenant) ID**
5. Go to **Certificates & secrets** > **New client secret**
   - Create a new secret and save the **Value** immediately
6. Go to **API permissions** > **Add a permission** > **Microsoft Graph** > **Delegated permissions**
   - Add: `User.Read`, `Files.Read`, `Files.Read.All`
7. Click **Grant admin consent** if required

### 2. OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to **API keys** section
3. Create a new API key and save it

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your credentials
nano .env
```

Configure the following in `.env`:

```env
PORT=3001
NODE_ENV=development
SESSION_SECRET=your-random-secret-key-here

# Microsoft Configuration
MICROSOFT_CLIENT_ID=your-microsoft-app-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-app-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3001/auth/callback

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### 5. Running the Application

You can run both backend and frontend simultaneously from the root directory:

```bash
# From the root AIxiliary directory
npm install
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## Usage

### Initial Setup - Login

1. Click "Sign in with Microsoft" on the login page
2. Authenticate with your Microsoft account
3. Grant permissions for OneDrive access

Once logged in, you'll have access to both AI Classification and NI Expenses features through the navigation menu.

---

## Using AI Classification

### 1. Login (Already completed above)

### 2. Submit Files

**Option A: Drag & Drop**
- Drag files from your computer to the drop zone
- Files will be added to the submission list

**Option B: OneDrive Files**
- Click "Select Files from OneDrive"
- Enter OneDrive file IDs (comma-separated)
- Note: In production, this would open the OneDrive picker UI

### 3. Configure Classification

The classification configuration allows you to customize how files are analyzed:

**Basic Configuration:**
- Edit the classification prompt to describe your requirements
- Example prompts:
  ```
  Classify this document as Invoice, Receipt, Contract, or Report.
  Extract: date, amount, vendor name, and description.
  ```

**Advanced Options:**
- **Categories**: Limit classification to specific categories
- **Extraction Fields**: Specify fields to extract from documents

### 4. Process Files

- Click "Submit & Process Files"
- The system will:
  1. Download files from OneDrive (or use uploaded files)
  2. Extract text content from each file
  3. Send content to GPT-4 for classification
  4. Return structured results

### 5. View Results

Results include:
- **Classification**: The category assigned to each file
- **Confidence Score**: AI's confidence level (0-1)
- **Extracted Information**: Key-value pairs of extracted data
- **Error Messages**: If any files failed to process

---

## Using NI Expenses

### 1. Submit an Expense

Navigate to **Submit Expense** from the top menu.

**Required Information:**
- **User**: Select from User1, User2, or User3
- **Description**: Brief description of the expense (e.g., "Office supplies", "Travel expenses")
- **Value**: Amount in Euros (€)
- **Date of Expense**: When the expense occurred
- **File**: Upload a JPG or PDF receipt/invoice (max 10MB)

**Submission Process:**
1. Fill in all required fields
2. Upload your receipt/invoice file
3. Click "Submit Expense"
4. The expense will be created with status "recebida" (received)
5. Files are automatically organized in OneDrive: `/NI-Expenses/{User}/{Year}/{Month}/expense-{id}/`

### 2. View Monthly Reports

Navigate to **Expense Reports** from the top menu.

**Features:**
- Filter by User, Year, and Month
- View expense summary:
  - Total number of expenses
  - Count by state (recebida, paga, rejeitada)
  - Total amount in Euros
- Detailed expense table showing:
  - Date of expense
  - Description
  - Value
  - Download link for attached file
  - Current state (editable)
  - Submission date

**Updating Expense State:**
- In the reports page, use the dropdown in the "State" column
- Select new state: Recebida, Paga, or Rejeitada
- Changes are saved automatically to OneDrive

### 3. OneDrive Storage Structure

Expenses are organized in your OneDrive as follows:

```
OneDrive/
└── NI-Expenses/
    ├── User1/
    │   ├── 2024/
    │   │   ├── 01/  (January)
    │   │   │   ├── expense-{uuid}/
    │   │   │   │   ├── metadata.json
    │   │   │   │   └── receipt.pdf
    │   │   │   └── expense-{uuid}/
    │   │   │       ├── metadata.json
    │   │   │       └── invoice.jpg
    │   │   └── 02/  (February)
    │   └── 2025/
    ├── User2/
    └── User3/
```

**metadata.json structure:**
```json
{
  "id": "uuid",
  "user": "User1",
  "description": "Office supplies",
  "value": 45.99,
  "expenseDate": "2024-01-15",
  "fileName": "receipt.pdf",
  "fileId": "onedrive-file-id",
  "state": "recebida",
  "submittedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Supported File Types

### AI Classification

- **Documents**: PDF, DOCX
- **Text Files**: TXT, MD, CSV, JSON, XML, HTML
- **Other**: Any UTF-8 text-based format

### NI Expenses

- **Receipts/Invoices**: JPG, JPEG, PDF (max 10MB)

## API Endpoints

### Authentication
- `GET /auth/login` - Get Microsoft OAuth URL
- `GET /auth/callback` - Handle OAuth callback
- `GET /auth/user` - Get current user info
- `POST /auth/logout` - Logout user

### Files
- `GET /files` - List OneDrive files
- `GET /files/:fileId` - Get file metadata
- `POST /files/batch` - Get multiple files metadata

### Submissions (AI Classification)
- `POST /submissions` - Create new submission
- `POST /submissions/:id/process` - Process submission with classification
- `GET /submissions/:id` - Get submission status and results
- `GET /submissions` - List all user submissions
- `DELETE /submissions/:id` - Delete submission

### Expenses (NI Expenses)
- `POST /api/expenses` - Submit a new expense
- `GET /api/expenses/user/:user` - Get all expenses for a user
- `GET /api/expenses/report/:user/:year/:month` - Get monthly report
- `PATCH /api/expenses/:user/:id/state` - Update expense state
- `GET /api/expenses/:user/:id/file` - Get expense file download URL

## Classification Configuration Schema

```json
{
  "prompt": "Your classification instructions",
  "categories": ["Category1", "Category2"],
  "extractionFields": ["field1", "field2"],
  "model": "gpt-4-turbo-preview"
}
```

## Example Classification Prompts

### Invoice Processing
```
Classify this document as an Invoice, Receipt, or Purchase Order.

Extract the following information:
- Invoice Number
- Date
- Vendor Name
- Total Amount
- Line Items (description and amount)
- Payment Terms
```

### Resume Screening
```
Analyze this resume and extract:
- Candidate Name
- Email and Phone
- Years of Experience
- Top 3 Skills
- Education Level
- Current/Most Recent Position

Classify the candidate as: Junior, Mid-Level, Senior, or Executive
```

### Contract Analysis
```
Identify the type of contract:
- Employment Agreement
- Service Agreement
- NDA
- License Agreement
- Other

Extract:
- Parties involved
- Effective Date
- Expiration Date
- Key Terms and Obligations
- Payment Terms (if applicable)
```

## Security Notes

- **Session Management**: Sessions are stored in memory (use Redis for production)
- **API Keys**: Never commit `.env` files to version control
- **HTTPS**: Use HTTPS in production environments
- **CORS**: Configure appropriate CORS settings for production

## Production Deployment

For production deployment:

1. **Environment Variables**:
   - Set all required environment variables
   - Use strong session secrets
   - Update redirect URIs to production URLs

2. **Database**:
   - Replace in-memory storage with PostgreSQL/MongoDB
   - Implement proper data persistence

3. **File Storage**:
   - Consider caching downloaded files
   - Implement file size limits
   - Add rate limiting

4. **Security**:
   - Enable HTTPS
   - Implement CSRF protection
   - Add input validation
   - Set up proper CORS policies

5. **Monitoring**:
   - Add logging (Winston, Pino)
   - Implement error tracking (Sentry)
   - Set up performance monitoring

## Troubleshooting

### Authentication Issues
- Verify Microsoft App credentials in Azure Portal
- Check redirect URI matches exactly
- Ensure API permissions are granted

### File Processing Errors
- Check OpenAI API key is valid
- Verify file format is supported
- Check file size limits

### OneDrive Access Issues
- Verify user has granted permissions
- Check access token is valid
- Ensure file IDs are correct

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
