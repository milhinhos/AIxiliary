# AIxiliary - AI-Powered Document Processing for Credit Applications

A sophisticated web application for processing Portuguese house credit application documents using AI-powered orchestration, specialized document agents, and automated data extraction with Excel export capabilities.

## Features

### Core Features
- **OneDrive Integration**: Authenticate with Microsoft OAuth and access OneDrive files and folders
- **Intelligent Document Classification**: LangChain-powered orchestrator agent automatically identifies document types
- **Specialized Processing Agents**: Five dedicated agents for Portuguese credit application documents:
  - ID Card (Cartão de Cidadão) Processor
  - Tax Declaration (IRS) Processor
  - Justice Declaration (Criminal Record) Processor
  - Bank Authority Declaration (Banco de Portugal) Processor
  - FIN Process (Bank Proposal) Processor
- **Image Processing**: Full support for PDF and image files (JPG, PNG, etc.) using GPT-4 Vision
- **Multi-Format Support**: Process PDFs, images, and text documents
- **Excel Export**: Automatic generation of formatted Excel workbooks with summary sheets
- **JSON/CSV Export**: Alternative export formats for integration with other systems
- **Real-time Processing**: Folder-based batch processing with progress tracking

### Advanced Features
- **LangChain Orchestration**: Intelligent document routing using LangChain agents
- **Configurable Agents**: Each specialized agent has independent configuration for prompts and extraction fields
- **Vision API Integration**: Seamless processing of scanned documents and ID cards
- **Structured Data Extraction**: Extract specific fields from each document type
- **Confidence Scoring**: AI confidence levels for classification and extraction
- **Error Handling**: Robust error handling with detailed error reporting

## Architecture

```
AIxiliary/
├── backend/                      # Node.js/Express API server
│   ├── src/
│   │   ├── agents/              # LangChain AI agents
│   │   │   ├── configs/         # Agent configurations
│   │   │   │   ├── id-card.config.ts
│   │   │   │   ├── tax-declaration.config.ts
│   │   │   │   ├── justice-declaration.config.ts
│   │   │   │   ├── bank-authority.config.ts
│   │   │   │   ├── fin-process.config.ts
│   │   │   │   └── index.ts
│   │   │   ├── orchestrator.agent.ts    # Document classification orchestrator
│   │   │   └── specialized.agent.ts     # Specialized processing agents
│   │   ├── config/              # Configuration management
│   │   ├── middleware/          # Express middleware
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   │   ├── document-processor.service.ts  # Main processing orchestration
│   │   │   ├── excel-export.service.ts        # Excel generation
│   │   │   ├── file-processor.service.ts      # File/image handling
│   │   │   ├── onedrive.service.ts            # OneDrive integration
│   │   │   └── submission.service.ts          # Submission management
│   │   ├── types/               # TypeScript types
│   │   └── index.ts             # Server entry point
│   └── package.json
├── frontend/                    # React web application
│   ├── src/
│   │   ├── api/                 # API client
│   │   ├── components/          # React components
│   │   ├── context/             # React context providers
│   │   ├── pages/               # Page components
│   │   ├── types/               # TypeScript types
│   │   └── main.tsx             # App entry point
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
   - **Application (client) ID**  bca6a641-b7ae-46ca-a752-93d58aeeb111
   - **Directory (tenant) ID**  82a7b152-bdca-42b8-9844-87aa3e811166
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

### 1. Login

- Click "Sign in with Microsoft" on the login page
- Authenticate with your Microsoft account
- Grant permissions for OneDrive access

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

## Document Types

The system is configured to process five types of Portuguese credit application documents:

### 1. ID Card (Cartão de Cidadão)
Extracts personal identification information:
- Full name, document numbers, date of birth
- ID number, expiration date, gender
- Nationality, height, parents' names
- Address (if visible)
- Supports both image and PDF formats

### 2. Tax Declaration (Declaração de IRS)
Extracts tax and income information:
- Tax year, NIF (taxpayer ID), taxpayer name
- Total annual income, taxable income
- Tax withheld, tax to pay/refund
- Employment, business, and property income
- Household composition

### 3. Justice Declaration (Certificado de Registo Criminal)
Extracts criminal record information:
- Certificate number, issue date
- Full name, date of birth, ID number
- Criminal record status (has records or not)
- Issuing authority, validity period
- Any observations or notes

### 4. Bank Authority Declaration (Banco de Portugal)
Extracts credit responsibility information:
- Document date, reference number
- Total credit responsibilities
- Active loans, credit cards, overdrafts
- Guarantees provided
- Overdue debts and credit incidents

### 5. FIN Process (Bank Loan Proposal)
Extracts loan proposal details:
- Process number, bank name, proposal date
- Applicant and co-applicant names
- Requested and approved amounts
- Interest rates (TAEG, TAN), loan term
- Monthly payment, total repayment amount
- Required guarantees and insurance
- Decision status

## Supported File Formats

- **PDF Files**: All document types
- **Image Files**: JPG, JPEG, PNG, GIF, BMP, TIFF (processed with GPT-4 Vision)
- **Text Files**: TXT, MD, CSV, JSON, XML, HTML (for reference documents)
- **Word Documents**: DOCX

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

### Submissions
- `POST /submissions` - Create new submission (legacy)
- `POST /submissions/:id/process` - Process submission with classification (legacy)
- `POST /submissions/process-folder` - **Process entire OneDrive folder with orchestrator**
- `GET /submissions/:id` - Get submission status and results
- `GET /submissions` - List all user submissions
- `GET /submissions/:id/export/excel` - **Download Excel export**
- `GET /submissions/:id/export/json` - **Download JSON export**
- `DELETE /submissions/:id` - Delete submission

## Classification Configuration Schema

```json
{
  "prompt": "Your classification instructions",
  "categories": ["Category1", "Category2"],
  "extractionFields": ["field1", "field2"],
  "model": "gpt-4-turbo-preview"
}
```

## How It Works

### Processing Flow

1. **Folder Upload**: User uploads files to a OneDrive folder designated for a specific credit application
2. **Document Classification**: Orchestrator agent analyzes each file and determines its type
3. **Specialized Processing**: Each document is routed to its specialized agent for data extraction
4. **Excel Generation**: Results are compiled into a formatted Excel workbook with:
   - Summary sheet with statistics
   - Detailed data sheet with all extracted information
   - Color-coded rows by document type
5. **Export**: Download Excel, JSON, or CSV formats

### Agent Configuration

Each specialized agent can be configured independently in `/backend/src/agents/configs/`:

```typescript
export const documentTypeConfig = {
  name: 'Agent Name',
  description: 'What this agent processes',
  prompt: 'Detailed prompt for the agent...',
  extractionFields: ['field1', 'field2', ...],
  categories: ['Category1', 'Category2', ...],
  model: 'gpt-4-turbo-preview' or 'gpt-4-vision-preview',
  supportsImages: true/false
};
```

### Using the Orchestrator API

**Process a folder:**

```bash
POST /submissions/process-folder
Content-Type: application/json

{
  "folderId": "your-onedrive-folder-id"
}
```

**Response:**

```json
{
  "submission": {
    "id": "submission-uuid",
    "status": "completed",
    "submittedAt": "2024-01-20T10:00:00Z",
    "completedAt": "2024-01-20T10:05:00Z",
    "results": [
      {
        "fileName": "id_card.jpg",
        "documentType": "id-card",
        "classificationConfidence": 0.98,
        "extractedData": {
          "fullName": "João Silva",
          "documentNumber": "123456789",
          ...
        },
        "processingStatus": "success"
      },
      ...
    ],
    "hasExcelExport": true
  }
}
```

**Download Excel:**

```bash
GET /submissions/{submission-id}/export/excel
```

Returns an Excel file with:
- Summary sheet with document type breakdown
- Detailed data sheet with all extracted fields
- Color-coded by document type
- Frozen headers for easy navigation

## Example Use Case: Credit Application Processing

1. Customer applies for a house loan
2. Customer uploads documents to their OneDrive folder:
   - ID card (front and back as images)
   - Tax declarations (PDF)
   - Criminal record certificate (PDF)
   - Bank of Portugal declaration (PDF)
   - FIN process from another bank (PDF)

3. Credit officer processes the folder via the API:
```bash
POST /submissions/process-folder
{
  "folderId": "customer-123-application"
}
```

4. System automatically:
   - Identifies each document type with 95%+ confidence
   - Extracts all relevant data using specialized agents
   - Generates comprehensive Excel report

5. Credit officer downloads Excel file containing:
   - Customer's personal information (from ID)
   - Income and tax details (from IRS)
   - Criminal record status
   - Existing credit responsibilities
   - Competing loan offers

6. Officer uses Excel data to make informed credit decision

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
