import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      await refreshUser();
      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    };

    handleAuthSuccess();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-green-500 mx-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Successful!
        </h1>
        <p className="text-gray-600 mb-4">
          You have successfully logged in with your Microsoft account.
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-500">
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
          <span>Redirecting...</span>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccessPage;
