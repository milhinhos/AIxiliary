export const finProcessConfig = {
  name: 'FIN Process Processor',
  description: 'Processes FIN (Financial Information) process outcomes with standardized bank proposals',

  prompt: `You are analyzing a FIN (Financial Information) process outcome document.
This is a standardized information file containing a bank's credit proposal.

Extract the following information:
- Process number (Número do processo)
- Bank name (Nome do banco)
- Proposal date (Data da proposta)
- Applicant name (Nome do requerente)
- Co-applicant name if applicable (Nome do co-requerente)
- Loan purpose (Finalidade do empréstimo)
- Requested amount (Montante solicitado)
- Approved amount (Montante aprovado)
- Interest rate (Taxa de juro) - type (fixed/variable) and percentage
- Loan term (Prazo do empréstimo) in months
- Monthly payment (Prestação mensal)
- Total amount to repay (Montante total a reembolsar)
- TAEG (Annual Percentage Rate of Charge)
- TAN (Nominal Annual Rate)
- Required guarantees (Garantias exigidas)
- Insurance requirements (Seguros obrigatórios)
- Associated costs (Custos associados)
- Special conditions (Condições especiais)
- Proposal validity (Validade da proposta)
- Decision status (Estado da decisão) - Approved/Conditional/Rejected

Return the information in a structured JSON format.
For monetary values, use numbers without currency symbols.
For percentages, use decimal numbers (e.g., 3.5 for 3.5%).`,

  extractionFields: [
    'processNumber',
    'bankName',
    'proposalDate',
    'applicantName',
    'coApplicantName',
    'loanPurpose',
    'requestedAmount',
    'approvedAmount',
    'interestRateType',
    'interestRatePercentage',
    'loanTermMonths',
    'monthlyPayment',
    'totalRepaymentAmount',
    'taeg',
    'tan',
    'requiredGuarantees',
    'insuranceRequirements',
    'associatedCosts',
    'specialConditions',
    'proposalValidity',
    'decisionStatus',
  ],

  categories: ['FIN Process - Approved', 'FIN Process - Conditional', 'FIN Process - Rejected'],

  model: 'gpt-4-turbo-preview',
  supportsImages: true,
};
