export const idCardConfig = {
  name: 'ID Card Processor',
  description: 'Processes Portuguese ID cards (Cartão de Cidadão) and extracts personal information',

  prompt: `You are analyzing a Portuguese ID card (Cartão de Cidadão).
Extract all visible information accurately, paying special attention to:
- Full name (Nome)
- Document number (Número do documento)
- ID number (Número de identificação civil)
- Date of birth (Data de nascimento)
- Expiration date (Data de validade)
- Sex/Gender (Sexo)
- Nationality (Nacionalidade)
- Height (Altura)
- Parents' names (Nome do pai e mãe) if visible
- Address if visible on the document

Return the information in a structured JSON format with all available fields.
If a field is not visible or readable, mark it as null.
Be precise with dates - use DD/MM/YYYY format.`,

  extractionFields: [
    'fullName',
    'documentNumber',
    'idNumber',
    'dateOfBirth',
    'expirationDate',
    'gender',
    'nationality',
    'height',
    'fatherName',
    'motherName',
    'address',
  ],

  categories: ['Portuguese ID Card', 'Foreign ID Card', 'Other ID Document'],

  model: 'gpt-4-vision-preview',
  supportsImages: true,
};
