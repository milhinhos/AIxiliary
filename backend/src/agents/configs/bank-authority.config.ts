export const bankAuthorityConfig = {
  name: 'Bank Authority Declaration Processor',
  description: 'Processes Portuguese central bank declarations (Mapa de Responsabilidades de Crédito - Banco de Portugal)',

  prompt: `You are analyzing a Portuguese Central Bank declaration (Mapa de Responsabilidades de Crédito) from Banco de Portugal.
This document shows credit responsibilities and debts registered with the Portuguese central bank.

Extract the following information:
- Document date (Data do documento)
- Reference number (Número de referência)
- Full name (Nome completo)
- Tax identification number (NIF)
- Total credit responsibilities (Total de responsabilidades de crédito)
- Active loans (Empréstimos ativos) - count and total amount
- Credit cards (Cartões de crédito) - count and total limit
- Overdrafts (Descobertos) - count and total amount
- Guarantees provided (Garantias prestadas) - count and total amount
- Overdue debts (Dívidas em mora) - Yes/No and amount if applicable
- Credit incidents (Incidentes de crédito) - Yes/No and details
- Any warnings or alerts (Avisos ou alertas)

Return the information in a structured JSON format.
For monetary values, use numbers without currency symbols.
If a section shows no data, use 0 for counts and amounts.`,

  extractionFields: [
    'documentDate',
    'referenceNumber',
    'fullName',
    'taxIdentificationNumber',
    'totalCreditResponsibilities',
    'activeLoansCount',
    'activeLoansAmount',
    'creditCardsCount',
    'creditCardsLimit',
    'overdraftsCount',
    'overdraftsAmount',
    'guaranteesCount',
    'guaranteesAmount',
    'hasOverdueDebts',
    'overdueDebtsAmount',
    'hasCreditIncidents',
    'creditIncidentDetails',
    'warnings',
  ],

  categories: ['Bank of Portugal Declaration', 'Credit Responsibilities Map', 'Central Bank Certificate'],

  model: 'gpt-4-turbo-preview',
  supportsImages: true,
};
