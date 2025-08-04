'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface ValidationErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const { login } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: ValidationErrors = {};

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setSubmitMessage(null);

      try {
        await login(formData.email, formData.password);
        setSubmitMessage({ type: 'success', message: 'Login successful! Redirecting...' });
        
        // Redirect to home page after successful login
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } catch (error) {
        console.error('Login error:', error);
        setSubmitMessage({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Login failed. Please try again.' 
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="font-bold text-3xl mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              href="/reset-password"
              className="text-blue-600 hover:text-blue-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Success/Error Message */}
      {submitMessage && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg max-w-md z-50 ${
          submitMessage.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span>{submitMessage.message}</span>
            <button
              onClick={() => setSubmitMessage(null)}
              className="ml-4 text-white hover:text-gray-200"
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
} 