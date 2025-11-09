import React, { useState, useEffect } from 'react';
import { expenseApi } from '../api/client';
import { MonthlyExpenseReport, Expense } from '../types';

const ALLOWED_USERS = ['User1', 'User2', 'User3'];

const STATE_LABELS: Record<string, string> = {
  recebida: 'Recebida',
  paga: 'Paga',
  rejeitada: 'Rejeitada',
};

const STATE_COLORS: Record<string, string> = {
  recebida: 'bg-yellow-100 text-yellow-800',
  paga: 'bg-green-100 text-green-800',
  rejeitada: 'bg-red-100 text-red-800',
};

const ExpenseReportsPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [report, setReport] = useState<MonthlyExpenseReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingExpense, setUpdatingExpense] = useState<string | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const loadReport = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reportData = await expenseApi.getMonthlyReport(
        selectedUser,
        selectedYear,
        selectedMonth
      );
      setReport(reportData);
    } catch (err: any) {
      console.error('Error loading report:', err);
      setError(err.response?.data?.error || 'Failed to load report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = async (expenseId: string, newState: 'recebida' | 'paga' | 'rejeitada') => {
    if (!selectedUser) return;

    setUpdatingExpense(expenseId);
    try {
      await expenseApi.updateExpenseState(selectedUser, expenseId, newState);
      // Reload the report
      await loadReport();
    } catch (err: any) {
      console.error('Error updating expense state:', err);
      setError(err.response?.data?.error || 'Failed to update expense state');
    } finally {
      setUpdatingExpense(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleDownloadFile = async (expenseId: string) => {
    if (!selectedUser) return;

    try {
      const downloadUrl = await expenseApi.getExpenseFileUrl(selectedUser, expenseId);
      window.open(downloadUrl, '_blank');
    } catch (err: any) {
      console.error('Error downloading file:', err);
      setError(err.response?.data?.error || 'Failed to get file download link');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">NI Expenses - Monthly Reports</h1>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
                User
              </label>
              <select
                id="user-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a user</option>
                {ALLOWED_USERS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadReport}
                disabled={loading || !selectedUser}
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  loading || !selectedUser
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                {loading ? 'Loading...' : 'Load Report'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Report Summary */}
          {report && (
            <>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Report Summary - {selectedUser} ({report.month})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">{report.expenses.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Recebida</p>
                    <p className="text-2xl font-bold text-yellow-700">{report.countByState.recebida}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paga</p>
                    <p className="text-2xl font-bold text-green-700">{report.countByState.paga}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rejeitada</p>
                    <p className="text-2xl font-bold text-red-700">{report.countByState.rejeitada}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-300">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-3xl font-bold text-blue-900">{formatCurrency(report.total)}</p>
                </div>
              </div>

              {/* Expenses Table */}
              {report.expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          State
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.expenses.map((expense) => (
                        <tr key={expense.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(expense.expenseDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {expense.description}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(expense.value)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={() => handleDownloadFile(expense.id)}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {expense.fileName}
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <select
                              value={expense.state}
                              onChange={(e) => handleStateChange(expense.id, e.target.value as any)}
                              disabled={updatingExpense === expense.id}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${STATE_COLORS[expense.state]}`}
                            >
                              <option value="recebida">Recebida</option>
                              <option value="paga">Paga</option>
                              <option value="rejeitada">Rejeitada</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(expense.submittedAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {updatingExpense === expense.id && (
                              <span className="text-blue-600">Updating...</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No expenses found for this period.
                </div>
              )}
            </>
          )}

          {!report && !loading && !error && (
            <div className="text-center py-8 text-gray-500">
              Select a user and click "Load Report" to view expenses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseReportsPage;
