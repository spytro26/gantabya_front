import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export const EsewaSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'confirming' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const verifyAndConfirm = async () => {
      try {
        // 1. Extract parameters
        const data = searchParams.get('data'); // eSewa v2 returns 'data'
        // paymentId is now from URL params

        if (!data || !paymentId) {
          throw new Error('Missing payment data');
        }

        // 2. Decode data (Base64)
        let esewaRefId;
        try {
            const decodedData = JSON.parse(atob(data));
            esewaRefId = decodedData.transaction_code;
        } catch (e) {
            console.error("Failed to decode eSewa data", e);
            throw new Error("Invalid response from payment gateway");
        }

        if (!esewaRefId) {
            throw new Error('Invalid eSewa response data');
        }

        // 3. Verify Payment
        setStatus('verifying');
        setMessage('Verifying payment with eSewa...');
        
        await api.post('/user/payments/verify', {
          paymentId,
          esewaRefId,
        });

        // 4. Confirm Booking
        setStatus('confirming');
        setMessage('Confirming your booking...');

        await api.post('/user/payments/confirm', {
          paymentId,
        });

        // 5. Success
        setStatus('success');
        setMessage('Booking confirmed successfully! Redirecting...');
        
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2000);

      } catch (error: any) {
        console.error('Payment processing error:', error);
        setStatus('error');
        setMessage(error.response?.data?.errorMessage || error.message || 'Payment verification failed');
      }
    };

    verifyAndConfirm();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'verifying' || status === 'confirming' ? (
          <>
            <FaSpinner className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        ) : status === 'success' ? (
          <>
            <FaCheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful</h2>
            <p className="text-gray-600">{message}</p>
          </>
        ) : (
          <>
            <FaTimesCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-red-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/home')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};
