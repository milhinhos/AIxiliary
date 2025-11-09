import React, { useState } from 'react';
import { expenseApi } from '../api/client';
import { Expense } from '../types';

const ALLOWED_USERS = ['User1', 'User2', 'User3'];

const ExpenseSubmissionPage: React.FC = () => {
  const [user, setUser] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Expense | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only JPG and PDF files are allowed');
        setFile(null);
        return;
      }
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    if (!user || !description || !value || !expenseDate || !file) {
      setError('Please fill in all fields and select a file');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError('Value must be a positive number');
      return;
    }

    setSubmitting(true);

    try {
      const expense = await expenseApi.submitExpense(
        user,
        description,
        numValue,
        expenseDate,
        file
      );

      setSuccess(expense);

      // Reset form
      setUser('');
      setDescription('');
      setValue('');
      setExpenseDate('');
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err: any) {
      console.error('Error submitting expense:', err);
      setError(err.response?.data?.error || 'Failed to submit expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">NI Expenses - Submit Expense</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium">Expense submitted successfully!</p>
              <p className="text-green-700 text-sm mt-1">
                ID: {success.id} | Status: {success.state}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Selection */}
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                User *
              </label>
              <select
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a user</option>
                {ALLOWED_USERS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Office supplies, Travel expenses, etc."
                required
              />
            </div>

            {/* Value */}
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Value (€) *
              </label>
              <input
                type="number"
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            {/* Expense Date */}
            <div>
              <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Expense *
              </label>
              <input
                type="date"
                id="expenseDate"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-1">
                Expense File (JPG or PDF) *
              </label>
              <input
                type="file"
                id="file-input"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {file && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                  submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Expense'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              * All fields are required
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Submitted expenses will have an initial status of "recebida"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseSubmissionPage;
