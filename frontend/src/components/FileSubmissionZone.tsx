import React from 'react';
import { useDropzone } from 'react-dropzone';
import { PickerFile } from '../types';

interface FileSubmissionZoneProps {
  selectedFiles: PickerFile[];
  onFilesAdded: (files: PickerFile[]) => void;
  onFileRemoved: (fileId: string) => void;
  onClearAll: () => void;
}

const FileSubmissionZone: React.FC<FileSubmissionZoneProps> = ({
  selectedFiles,
  onFilesAdded,
  onFileRemoved,
  onClearAll,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      // Simulate OneDrive file IDs for dropped files
      const newFiles: PickerFile[] = acceptedFiles.map((file) => ({
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      }));
      onFilesAdded(newFiles);
    },
    noClick: false,
    noKeyboard: true,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <svg
            className={`w-16 h-16 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to select files from your computer
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Note: For OneDrive files, use the "Select from OneDrive" button below
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Selected Files ({selectedFiles.length})
            </h3>
            <button
              onClick={onClearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg
                    className="w-8 h-8 text-blue-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {file.size > 0 ? formatFileSize(file.size) : 'Unknown size'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onFileRemoved(file.id)}
                  className="ml-3 p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                  title="Remove file"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileSubmissionZone;
