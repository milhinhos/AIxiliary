export const taxDeclarationConfig = {
  name: 'Tax Declaration Processor',
  description: 'Processes Portuguese tax declarations (IRS) and extracts financial information',

  prompt: `You are analyzing a Portuguese tax declaration (Declaração de IRS).
Extract the following information:
- Tax year (Ano fiscal)
- Taxpayer identification number (NIF)
- Taxpayer name (Nome do contribuinte)
- Total annual income (Rendimento total anual)
- Taxable income (Rendimento tributável)
- Tax withheld (Imposto retido)
- Tax to pay or refund (Imposto a pagar/receber)
- Employment income (Rendimentos do trabalho dependente - Category A)
- Business/Professional income (Rendimentos empresariais/profissionais - Category B)
- Property income (Rendimentos prediais - Category F)
- Filing date (Data de entrega)
- Household composition (Agregado familiar) - number of dependents

Return the information in a structured JSON format.
For monetary values, use numbers without currency symbols.
If a field is not found, mark it as null.`,

  extractionFields: [
    'taxYear',
    'taxIdentificationNumber',
    'taxpayerName',
    'totalAnnualIncome',
    'taxableIncome',
    'taxWithheld',
    'taxToPayOrRefund',
    'employmentIncome',
    'businessIncome',
    'propertyIncome',
    'filingDate',
    'numberOfDependents',
  ],

  categories: ['IRS Declaration', 'IRS Receipt', 'Tax Certificate'],

  model: 'gpt-4-turbo-preview',
  supportsImages: true,
};
