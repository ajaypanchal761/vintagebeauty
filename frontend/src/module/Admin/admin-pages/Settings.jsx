import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import settingsService from '../../../services/settingsService';
import { Settings as SettingsIcon, RefreshCw, Save, User, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  
  // Admin credentials state
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingCredentials, setUpdatingCredentials] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchSettings();
    fetchAdminInfo();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use real API service for settings
      const response = await settingsService.getSettings();
      
      setSettings(response.data.settings || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminInfo = async () => {
    try {
      const response = await adminService.verifyToken();
      if (response.valid && response.user) {
        setAdminCredentials(prev => ({
          ...prev,
          username: response.user.username || response.user.name || '',
          email: response.user.email || ''
        }));
      } else {
        // Use default admin credentials
        setAdminCredentials(prev => ({
          ...prev,
          username: 'admin',
          email: 'admin@vintagebeauty.com'
        }));
      }
    } catch (err) {
      console.error('Error fetching admin info:', err);
      // Use default admin credentials on error
      setAdminCredentials(prev => ({
        ...prev,
        username: 'admin',
        email: 'admin@vintagebeauty.com'
      }));
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.key === key 
          ? { ...setting, value: value }
          : setting
      )
    );
  };

  const handleSaveSetting = async (setting) => {
    if (!setting || !setting.key) {
      setError('Invalid setting data');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess("");
      
      // Use real API service for settings
      const response = await settingsService.updateSetting(setting.key, {
        value: setting.value,
        description: setting.description || '',
        type: setting.type || 'string'
      });
      
      setSuccess(response.data.message || 'Setting saved successfully');
      setTimeout(() => setSuccess(""), 3000);
      
      // Refresh settings to get updated data
      await fetchSettings();
    } catch (err) {
      console.error('Error saving setting:', err);
      setError(err.message || 'Failed to save setting');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCredentialsChange = (field, value) => {
    setAdminCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
    if (success) setSuccess("");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleUpdateCredentials = async () => {
    // Validation
    if (!adminCredentials.currentPassword) {
      setError('Current password is required');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (adminCredentials.newPassword && adminCredentials.newPassword !== adminCredentials.confirmPassword) {
      setError('New password and confirm password do not match');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (adminCredentials.newPassword && adminCredentials.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setUpdatingCredentials(true);
      setError(null);
      setSuccess("");
      
      const updateData = {
        currentPassword: adminCredentials.currentPassword
      };

      if (adminCredentials.username.trim()) {
        updateData.username = adminCredentials.username.trim();
      }
      
      if (adminCredentials.email.trim()) {
        updateData.email = adminCredentials.email.trim();
      }
      
      if (adminCredentials.newPassword.trim()) {
        updateData.newPassword = adminCredentials.newPassword.trim();
      }

      const response = await adminService.updateAdminCredentials(updateData);
      
      setSuccess(response.data?.message || 'Admin credentials updated successfully');
      setTimeout(() => setSuccess(""), 3000);
      
      // Clear password fields
      setAdminCredentials(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Update username and email from response if available
      if (response.data?.user) {
        setAdminCredentials(prev => ({
          ...prev,
          username: response.data.user.username || response.data.user.name || prev.username,
          email: response.data.user.email || prev.email
        }));
      }
      
    } catch (err) {
      console.error('Error updating admin credentials:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Failed to update admin credentials';
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingCredentials(false);
    }
  };

  const renderSettingInput = (setting) => {
    if (!setting || !setting.key) {
      return null;
    }
    const { key, value, description } = setting;
    
    // Skip COD upfront amount setting
    if (key === 'cod_upfront_amount') {
      return null;
    }
    
    // Default input for other settings
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
            placeholder={`Enter ${key.replace(/_/g, ' ')}`}
          />
          {description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error && !settings.length) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <SettingsIcon className="text-blue-600" size={28} />
          <h1 className="text-3xl font-bold text-gray-800">Application Settings</h1>
        </div>
        <button
          onClick={fetchSettings}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Admin Credentials Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <User size={20} />
          Admin Login Details
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) => handleCredentialsChange('username', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                  placeholder="Enter username"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={adminCredentials.email}
                  onChange={(e) => handleCredentialsChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                  placeholder="Enter email"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPasswords.current ? "text" : "password"}
                value={adminCredentials.currentPassword}
                onChange={(e) => handleCredentialsChange('currentPassword', e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={adminCredentials.newPassword}
                  onChange={(e) => handleCredentialsChange('newPassword', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                  placeholder="Enter new password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={adminCredentials.confirmPassword}
                  onChange={(e) => handleCredentialsChange('confirmPassword', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleUpdateCredentials}
              disabled={updatingCredentials || !adminCredentials.currentPassword}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {updatingCredentials ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update Credentials
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      {settings && settings.filter(setting => setting && setting.key && setting.key !== 'cod_upfront_amount').length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Payment Settings</h2>
          
          <div className="space-y-6">
            {settings.filter(setting => setting && setting.key && setting.key !== 'cod_upfront_amount').map((setting) => {
              const renderedInput = renderSettingInput(setting);
              if (!renderedInput) return null;
              
              return (
                <div key={setting.key} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      {renderedInput}
                    </div>
                    <div className="md:ml-4">
                      <button
                        onClick={() => handleSaveSetting(setting)}
                        disabled={saving}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    Last updated: {(() => {
                      try {
                        return setting.updatedAt ? new Date(setting.updatedAt).toLocaleString() : 'Never';
                      } catch (error) {
                        return 'Never';
                      }
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Information</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong className="text-gray-800">Admin Credentials:</strong> You can update your username, email, and password here. 
            Current password is required for any changes. New password must be at least 6 characters long.
          </p>
          <p>
            <strong className="text-gray-800">Payment Methods:</strong> For Cash on Delivery (COD) orders, customers will pay the full amount at the time of delivery. 
            For online payments, the full amount will be charged online.
          </p>
          <p>
            <strong className="text-gray-800">Note:</strong> Changes to settings take effect immediately for new orders.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
