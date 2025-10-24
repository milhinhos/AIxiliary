import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileSubmissionZone from '../components/FileSubmissionZone';
import OneDrivePicker from '../components/OneDrivePicker';
import ClassificationConfigComponent from '../components/ClassificationConfig';
import ResultsDisplay from '../components/ResultsDisplay';
import { PickerFile, ClassificationConfig } from '../types';
import { submissionsApi } from '../api/client';

const SubmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<PickerFile[]>([]);
  const [classificationConfig, setClassificationConfig] = useState<ClassificationConfig>({
    prompt: `Analyze this document and classify it into one of the following categories:
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
- Key topics or subjects`,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = (files: PickerFile[]) => {
    setSelectedFiles([...selectedFiles, ...files]);
    setResults(null);
    setError(null);
  };

  const handleFileRemoved = (fileId: string) => {
    setSelectedFiles(selectedFiles.filter((f) => f.id !== fileId));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setResults(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    if (!classificationConfig.prompt.trim()) {
      setError('Please provide a classification prompt');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      // Create submission
      const fileIds = selectedFiles.map((f) => f.id);
      const submission = await submissionsApi.createSubmission(fileIds);

      // Process submission
      const processedSubmission = await submissionsApi.processSubmission(
        submission.id,
        classificationConfig
      );

      setResults(processedSubmission);
    } catch (err) {
      console.error('Error processing submission:', err);
      setError('Failed to process files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            File Submission & Classification
          </h1>
          <p className="text-gray-600">
            Submit files from OneDrive or your computer for AI-powered classification
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* File Selection */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Step 1: Select Files
            </h2>
            <FileSubmissionZone
              selectedFiles={selectedFiles}
              onFilesAdded={handleFilesAdded}
              onFileRemoved={handleFileRemoved}
              onClearAll={handleClearAll}
            />
            <div className="mt-4 flex justify-center">
              <OneDrivePicker onFilesSelected={handleFilesAdded} />
            </div>
          </div>

          {/* Classification Configuration */}
          <div>
            <ClassificationConfigComponent
              onConfigChange={setClassificationConfig}
              initialConfig={classificationConfig}
            />
          </div>

          {/* Submit Button */}
          {selectedFiles.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-colors ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-3">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing Files...
                  </span>
                ) : (
                  'Submit & Process Files'
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {results && results.results && (
            <ResultsDisplay results={results.results} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionPage;
