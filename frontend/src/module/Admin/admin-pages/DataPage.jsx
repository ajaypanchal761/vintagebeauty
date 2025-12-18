import React, { useEffect, useState } from 'react';
import { FileText, Edit3, Save, X, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import policyService from '../../../services/policyService';

const TABS = [
  { key: 'terms', label: 'Terms and Conditions', icon: <FileText size={20} /> },
  { key: 'refund', label: 'Refund Policy', icon: <FileText size={20} /> },
  { key: 'privacy', label: 'Privacy Policy', icon: <FileText size={20} /> },
  { key: 'about', label: 'About Us', icon: <FileText size={20} /> }
];

const DataPage = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const [data, setData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ heading: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await policyService.getPolicyByType(activeTab);
      
      // Handle both success and failure cases
      if (response.success && response.data) {
        setData((prev) => ({ ...prev, [activeTab]: response.data }));
        setForm({ 
          heading: response.data?.heading || '', 
          content: response.data?.content || '' 
        });
        setEditMode(false);
      } else {
        // Policy doesn't exist yet - this is normal for new installations
        setData((prev) => ({ ...prev, [activeTab]: null }));
        setForm({ heading: '', content: '' });
        setEditMode(false);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      // Don't show error for 404 - it just means policy doesn't exist yet
      if (err.response?.status !== 404) {
        setError(err.message || 'Failed to fetch policy data');
      }
      setData((prev) => ({ ...prev, [activeTab]: null }));
      setForm({ heading: '', content: '' });
      setEditMode(false);
    }
    setLoading(false);
  };

  const handleEdit = () => {
    setEditMode(true);
    const d = data[activeTab];
    setForm({ heading: d?.heading || '', content: d?.content || '' });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditMode(false);
    const d = data[activeTab];
    setForm({ heading: d?.heading || '', content: d?.content || '' });
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Create or update policy (backend handles both)
      const response = await policyService.createOrUpdatePolicy({
        type: activeTab,
        heading: form.heading,
        content: form.content
      });
      
      if (response.success) {
        setSuccess(response.message || 'Policy saved successfully!');
        await fetchData();
      }
    } catch (err) {
      console.error('Error saving data:', err);
      setError(err.message || err.response?.data?.message || 'Error saving data');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-400 rounded-full mb-4">
            <FileText size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-rose-900 mb-2">Policy Management</h1>
          <p className="text-rose-700">Manage your website's legal policies and terms</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105
                ${activeTab === tab.key
                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-lg'
                  : 'bg-white text-rose-700 hover:bg-pink-50 border border-pink-200'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border-4 border-pink-200 border-t-rose-400 rounded-full animate-spin mb-4"></div>
              <p className="text-rose-700">Loading...</p>
            </div>
          ) : editMode ? (
            // Edit Mode
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-rose-900 mb-2">
                  Policy Heading
                </label>
                <input
                  type="text"
                  name="heading"
                  value={form.heading}
                  onChange={handleChange}
                  placeholder="Enter policy heading..."
                  className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-pink-50/50"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-rose-900 mb-2">
                  Policy Content
                </label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Enter policy content... Use lines ending with ':' to create section headers"
                  rows={12}
                  className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-pink-50/50 resize-vertical"
                />
                <p className="text-sm text-rose-600 mt-2">
                  💡 Tip: Use lines ending with ":" to create expandable section headers (e.g., "Terms and Conditions:")
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                  <AlertCircle size={20} className="text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-green-700">{success}</span>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-xl font-medium hover:from-pink-600 hover:to-rose-500 transition-all duration-200 disabled:opacity-50"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Policy'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-rose-900 mb-2">
                    {data[activeTab]?.heading || `${TABS.find(tab => tab.key === activeTab)?.label} - Not Set`}
                  </h2>
                  <p className="text-rose-600">
                    {data[activeTab] ? 'Policy content is configured' : 'No policy content has been set up yet'}
                  </p>
                </div>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-xl font-medium hover:from-pink-600 hover:to-rose-500 transition-all duration-200"
                >
                  {data[activeTab] ? <Edit3 size={18} /> : <Plus size={18} />}
                  {data[activeTab] ? 'Edit Policy' : 'Add Policy'}
                </button>
              </div>

              {data[activeTab]?.content ? (
                <div className="bg-pink-50 rounded-xl p-6 border border-pink-200">
                  <div className="prose prose-pink max-w-none">
                    <pre className="whitespace-pre-wrap text-rose-800 font-sans text-sm leading-relaxed">
                      {data[activeTab].content}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-pink-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-rose-900 mb-2">
                    No Content Available
                  </h3>
                  <p className="text-rose-600 mb-6">
                    This policy hasn't been set up yet. Click "Add Policy" to get started.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataPage;
