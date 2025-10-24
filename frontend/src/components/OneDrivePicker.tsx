import React from 'react';
import { PickerFile } from '../types';

interface OneDrivePickerProps {
  onFilesSelected: (files: PickerFile[]) => void;
}

const OneDrivePicker: React.FC<OneDrivePickerProps> = ({ onFilesSelected }) => {
  const openPicker = () => {
    // Note: In a real implementation, you would use the OneDrive Picker SDK
    // For now, we'll use a simplified approach with manual file ID input
    // or integrate with Microsoft Graph File Picker

    // Example implementation would use:
    // https://docs.microsoft.com/en-us/onedrive/developer/controls/file-pickers/js-v72/

    const fileIdsInput = prompt(
      'Enter OneDrive file IDs (comma-separated):\n\nNote: In production, this would open the OneDrive file picker UI.'
    );

    if (fileIdsInput) {
      const fileIds = fileIdsInput.split(',').map((id) => id.trim());
      const mockFiles: PickerFile[] = fileIds.map((id, index) => ({
        id,
        name: `File ${index + 1}`,
        size: 0,
        mimeType: 'application/octet-stream',
      }));
      onFilesSelected(mockFiles);
    }
  };

  return (
    <button
      onClick={openPicker}
      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M13.5 1.5L0 9l5.5 3.5v7L13.5 24l8-4.5v-7L24 9l-10.5-7.5zm0 2.8L20.7 9l-7.2 4.7L6.3 9l7.2-4.7zM7 11.5l5.5 3.5v6.2L7 17.7v-6.2zm11 0v6.2l-5.5 3.5V15l5.5-3.5z" />
      </svg>
      Select Files from OneDrive
    </button>
  );
};

export default OneDrivePicker;
