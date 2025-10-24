import React, { useState } from 'react';
import { ClassificationResult } from '../types';

interface ResultsDisplayProps {
  results: ClassificationResult[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const toggleExpanded = (fileId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedResults(newExpanded);
  };

  const getStatusColor = (result: ClassificationResult) => {
    if (result.error) return 'text-red-600 bg-red-50';
    if (result.confidence && result.confidence > 0.8) return 'text-green-600 bg-green-50';
    if (result.confidence && result.confidence > 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getStatusIcon = (result: ClassificationResult) => {
    if (result.error) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Classification Results
      </h2>

      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.fileId}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Result Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpanded(result.fileId)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-full ${getStatusColor(result)}`}>
                  {getStatusIcon(result)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {result.fileName}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-medium text-gray-600">
                      {result.classification}
                    </span>
                    {result.confidence !== undefined && (
                      <span className="text-xs text-gray-500">
                        {Math.round(result.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedResults.has(result.fileId) ? 'transform rotate-180' : ''
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* Expanded Details */}
            {expandedResults.has(result.fileId) && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                {result.error ? (
                  <div className="text-red-600 text-sm">
                    <p className="font-medium mb-1">Error:</p>
                    <p>{result.error}</p>
                  </div>
                ) : (
                  <>
                    {/* Extracted Information */}
                    {Object.keys(result.extractedInfo).length > 0 && (
                      <div className="mb-4">
                        <p className="font-medium text-gray-700 mb-2 text-sm">
                          Extracted Information:
                        </p>
                        <div className="bg-white rounded p-3 space-y-2">
                          {Object.entries(result.extractedInfo).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium text-gray-600 text-sm min-w-[120px]">
                                {key}:
                              </span>
                              <span className="text-gray-800 text-sm flex-1">
                                {typeof value === 'object'
                                  ? JSON.stringify(value, null, 2)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Processing Time */}
                    <p className="text-xs text-gray-500">
                      Processed: {new Date(result.processedAt).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-800">{results.length}</p>
            <p className="text-sm text-gray-600">Total Files</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {results.filter((r) => !r.error).length}
            </p>
            <p className="text-sm text-gray-600">Successful</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {results.filter((r) => r.error).length}
            </p>
            <p className="text-sm text-gray-600">Errors</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
