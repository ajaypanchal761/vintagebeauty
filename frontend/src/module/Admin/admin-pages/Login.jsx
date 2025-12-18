import React, { useState, useEffect } from "react";
import adminService from "../admin-services/adminService";
import authService from "../../../services/authService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, Shield, UserPlus, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // 'phone' or 'otp'
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRegistrationMode, setIsRegistrationMode] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const checkAdminStatus = async () => {
    try {
      setStatusLoading(true);
      const status = await adminService.checkAdminStatus();
      setStatusLoading(false);
      setIsRegistrationMode(!status.data.adminExists);
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setStatusLoading(false);
      setIsRegistrationMode(true);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await authService.adminLogin(phone);
      if (response.success) {
        setStep("otp");
        setTimer(300); // 5 minutes (300 seconds) timer to match backend expiry
        toast.success('OTP sent successfully to your phone number!', { duration: 5000 });
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      const errorMessage = error.message || "Failed to send OTP. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await authService.adminVerifyOTP(phone, otp);
      if (response.success && response.data.token) {
        // Note: OTP login uses token (for backward compatibility)
        // For new admin login, use EmailLogin which uses adminToken
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("admin_logged_in", "true");
        setSuccess("Login successful! Redirecting...");
        toast.success("Admin login successful!");
        setTimeout(() => {
          navigate("/admin");
        }, 1500);
      } else {
        setError("Login failed. Please try again.");
        toast.error("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      const errorMessage = error.message || "Invalid OTP or access denied.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) {
      const minutes = Math.floor(timer / 60);
      const seconds = timer % 60;
      toast.error(`Please wait ${minutes}:${String(seconds).padStart(2, '0')} before resending OTP`);
      return;
    }

    setLoading(true);
    try {
      const response = await authService.adminLogin(phone);
      if (response.success) {
        setOtp("");
        setTimer(300); // Reset timer to 5 minutes
        toast.success('OTP resent successfully to your phone number!', { duration: 5000 });
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to resend OTP. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.slice(0, 10);
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setOtp("");
    setError("");
    setSuccess("");
    setTimer(0);
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full mb-2.5">
              <img 
                src="/vintage-beauty-logo.svg" 
                alt="Vintage Beauty Logo" 
                className="w-9 h-9 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-lg hidden">V</div>
            </div>
            <h1 className="text-lg font-bold text-white mb-1.5">Vintage Admin</h1>
            <p className="text-sm text-blue-100">
              {step === 'phone' ? 'Sign in to manage your store' : 'Enter OTP to continue'}
            </p>
          </div>

          <div className="px-5 py-5">
            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">{success}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm pl-10">+91</span>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        maxLength="10"
                        className="flex-1 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">We'll send you a 6-digit OTP to verify your number</p>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={loading || phone.length !== 10}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending OTP...</span>
                    </div>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">{success}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Enter OTP *
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={otp[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value) {
                            const newOtp = otp.split('');
                            newOtp[index] = value;
                            setOtp(newOtp.join(''));
                            if (index < 5 && e.target.nextSibling) {
                              e.target.nextSibling.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otp[index] && index > 0) {
                            e.target.previousSibling.focus();
                          }
                        }}
                        className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg text-center text-lg font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    OTP sent to +91 {phone}
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    OTP is valid for 5 minutes
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Didn't receive OTP?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={timer > 0}
                    className={`font-medium transition-colors ${
                      timer > 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {timer > 0 ? (
                      `Resend in ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`
                    ) : (
                      'Resend OTP'
                    )}
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify & Login'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  ← Change Phone Number
                </button>
              </form>
            )}

            {step === 'phone' && (
              <div className="mt-5 text-center space-y-2">
                <p className="text-xs text-gray-500">
                  {isRegistrationMode 
                    ? 'First user to verify OTP will become admin' 
                    : 'Admin access via OTP verification'
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Don't have an account?{" "}
                  <Link to="/admin/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                    Register
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Secure admin access via OTP verification
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

