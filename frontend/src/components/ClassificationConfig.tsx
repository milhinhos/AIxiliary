import React, { useState } from 'react';
import { ClassificationConfig as Config } from '../types';

interface ClassificationConfigProps {
  onConfigChange: (config: Config) => void;
  initialConfig?: Config;
}

const defaultPrompt = `Analyze this document and classify it into one of the following categories:
- Invoice
- Receipt
- Contract
- Report
- Email
- Other

Extract the following information if available:
- Date
- Amount (if applicable)
- Parties involved
- Key topics or subjects`;

const ClassificationConfigComponent: React.FC<ClassificationConfigProps> = ({
  onConfigChange,
  initialConfig,
}) => {
  const [config, setConfig] = useState<Config>(
    initialConfig || {
      prompt: defaultPrompt,
      categories: [],
      extractionFields: [],
    }
  );

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categoriesInput, setCategoriesInput] = useState(
    initialConfig?.categories?.join(', ') || ''
  );
  const [fieldsInput, setFieldsInput] = useState(
    initialConfig?.extractionFields?.join(', ') || ''
  );

  const handlePromptChange = (value: string) => {
    const newConfig = { ...config, prompt: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleCategoriesChange = (value: string) => {
    setCategoriesInput(value);
    const categories = value
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    const newConfig = { ...config, categories };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleFieldsChange = (value: string) => {
    setFieldsInput(value);
    const fields = value
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    const newConfig = { ...config, extractionFields: fields };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Classification Configuration
      </h2>

      <div className="space-y-4">
        {/* Classification Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Classification Prompt
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={config.prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Enter your classification instructions..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe how the AI should classify and analyze the files
          </p>
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          {showAdvanced ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Hide Advanced Options
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Show Advanced Options
            </>
          )}
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4 pl-4 border-l-2 border-blue-200">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Categories (optional)
              </label>
              <input
                type="text"
                value={categoriesInput}
                onChange={(e) => handleCategoriesChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="e.g., Invoice, Receipt, Contract (comma-separated)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limit classification to specific categories
              </p>
            </div>

            {/* Extraction Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extraction Fields (optional)
              </label>
              <input
                type="text"
                value={fieldsInput}
                onChange={(e) => handleFieldsChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="e.g., date, amount, vendor (comma-separated)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify fields to extract from documents
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassificationConfigComponent;
