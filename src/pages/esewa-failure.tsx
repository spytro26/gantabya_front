import { useNavigate } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';

export const EsewaFailurePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <FaTimesCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-6">
          Your payment could not be processed or was cancelled. No charges were made.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/home')}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Return Home
          </button>
          <button
            onClick={() => navigate(-1)} // Go back to try again
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};
