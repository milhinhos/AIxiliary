export const justiceDeclarationConfig = {
  name: 'Justice Declaration Processor',
  description: 'Processes Portuguese criminal record certificates (Certificado de Registo Criminal)',

  prompt: `You are analyzing a Portuguese criminal record certificate (Certificado de Registo Criminal).
This document certifies whether a person has any criminal records, debts, or legal charges.

Extract the following information:
- Certificate number (Número do certificado)
- Issue date (Data de emissão)
- Full name (Nome completo)
- Date of birth (Data de nascimento)
- ID number (Número de identificação)
- Purpose of request (Finalidade do pedido)
- Criminal record status (Estado do registo criminal) - typically "Sem registo" (no records) or details of any records
- Issuing authority (Entidade emissora)
- Validity period (Período de validade)
- Any notes or observations (Observações)

Return the information in a structured JSON format.
For the criminal record status, provide a boolean field "hasCriminalRecord" (true/false) and a text field "details".`,

  extractionFields: [
    'certificateNumber',
    'issueDate',
    'fullName',
    'dateOfBirth',
    'idNumber',
    'purposeOfRequest',
    'hasCriminalRecord',
    'recordDetails',
    'issuingAuthority',
    'validityPeriod',
    'observations',
  ],

  categories: ['Criminal Record Certificate', 'Justice Declaration', 'Legal Certificate'],

  model: 'gpt-4-turbo-preview',
  supportsImages: true,
};
