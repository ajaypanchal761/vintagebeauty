import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo vintage.png';
import policyService from '../services/policyService';

const AboutUs = () => {
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await policyService.getPolicyByType('about');
      
      // Handle both success and failure cases
      if (response.success && response.data) {
        setPolicy(response.data);
      } else {
        // Policy doesn't exist yet - this is normal, show empty state
        setPolicy(null);
      }
    } catch (error) {
      console.error('Error fetching about us:', error);
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden pb-20 md:pb-0">
      {/* Navigation Bar */}
      <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Back"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Logo/Brand Name */}
            <div className="flex items-center gap-2 md:gap-3">
              {logo && (
                <img 
                  src={logo} 
                  alt="VINTAGE BEAUTY Logo" 
                  className="h-6 md:h-8 w-auto"
                />
              )}
              <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                VINTAGE BEAUTY
              </h1>
            </div>

            {/* Shopping Bag Icon */}
            <button
              onClick={() => navigate('/cart')}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors relative"
              aria-label="Shopping Cart"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="w-full bg-black border-b border-gray-800 py-6 md:py-8">
        <div className="w-full px-4 md:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">
            {policy?.heading || 'About Us'}
          </h2>
          <p className="text-center text-gray-400 mt-2">
            {policy?.updatedAt 
              ? `Last updated: ${new Date(policy.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`
              : ''
            }
          </p>
        </div>
      </div>

      {/* Content Section */}
      <section className="w-full bg-black py-8 md:py-12">
        <div className="w-full">
          <div className="bg-gray-900 rounded-xl p-6 md:p-8 border border-gray-800">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-4">Loading...</p>
              </div>
            ) : policy?.content ? (
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-gray-300 leading-relaxed font-sans text-sm md:text-base">
                  {policy.content}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No content available</p>
                <p className="text-gray-500 text-sm">The about us page has not been set up yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;

