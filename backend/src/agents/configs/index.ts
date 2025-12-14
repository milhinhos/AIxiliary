import { idCardConfig } from './id-card.config';
import { taxDeclarationConfig } from './tax-declaration.config';
import { justiceDeclarationConfig } from './justice-declaration.config';
import { bankAuthorityConfig } from './bank-authority.config';
import { finProcessConfig } from './fin-process.config';

export interface AgentConfig {
  name: string;
  description: string;
  prompt: string;
  extractionFields: string[];
  categories: string[];
  model: string;
  supportsImages: boolean;
}

export const agentConfigs = {
  'id-card': idCardConfig,
  'tax-declaration': taxDeclarationConfig,
  'justice-declaration': justiceDeclarationConfig,
  'bank-authority': bankAuthorityConfig,
  'fin-process': finProcessConfig,
};

export type AgentType = keyof typeof agentConfigs;

export {
  idCardConfig,
  taxDeclarationConfig,
  justiceDeclarationConfig,
  bankAuthorityConfig,
  finProcessConfig,
};
