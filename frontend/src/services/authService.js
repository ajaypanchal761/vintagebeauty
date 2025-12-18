import api from './api';

const authService = {
  // Login with email and password
  login: async (email, password) => {
    try {
      const emailStr = String(email || '').trim();
      const passwordStr = String(password || '').trim();
      
      if (!emailStr) {
        throw { 
          message: 'Please provide your email',
          response: { data: { success: false, message: 'Please provide your email' } }
        };
      }
      if (!passwordStr) {
        throw { 
          message: 'Please provide your password',
          response: { data: { success: false, message: 'Please provide your password' } }
        };
      }
      
      console.log('Login request:', { email: emailStr });
      const response = await api.post('/auth/login', {
        email: emailStr,
        password: passwordStr
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data) { 
        throw error.response.data; 
      }
      if (error.message) { 
        throw { success: false, message: error.message }; 
      }
      throw { success: false, message: 'Failed to login. Please try again.' };
    }
  },

  // Register with name, email, password, and optional phone
  register: async (name, email, password, phone = null) => {
    try {
      const nameStr = String(name || '').trim();
      const emailStr = String(email || '').trim();
      const passwordStr = String(password || '').trim();
      const phoneStr = phone ? String(phone || '').replace(/\D/g, '').trim() : null;
      
      if (!nameStr) {
        throw { 
          message: 'Please provide your name',
          response: { data: { success: false, message: 'Please provide your name' } }
        };
      }
      if (!emailStr) {
        throw { 
          message: 'Please provide your email',
          response: { data: { success: false, message: 'Please provide your email' } }
        };
      }
      if (!passwordStr || passwordStr.length < 6) {
        throw { 
          message: 'Password must be at least 6 characters long',
          response: { data: { success: false, message: 'Password must be at least 6 characters long' } }
        };
      }
      
      const registerData = {
        name: nameStr,
        email: emailStr,
        password: passwordStr
      };
      
      // Add phone if provided
      if (phoneStr && phoneStr.length === 10) {
        registerData.phone = phoneStr;
      }
      
      console.log('Register request:', { name: nameStr, email: emailStr, hasPhone: !!phoneStr });
      const response = await api.post('/auth/register', registerData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      if (error.response?.data) { 
        throw error.response.data; 
      }
      if (error.message) { 
        throw { success: false, message: error.message }; 
      }
      throw { success: false, message: 'Failed to register. Please try again.' };
    }
  },

  // Keep OTP methods for backward compatibility (if needed elsewhere)
  sendOTP: async (phone, isLogin = false) => {
    try {
      const phoneStr = String(phone || '').replace(/\D/g, '').trim();
      if (!phoneStr || phoneStr.length !== 10) {
        throw { 
          message: 'Phone number must be exactly 10 digits',
          response: { data: { success: false, message: 'Phone number must be exactly 10 digits' } }
        };
      }
      
      console.log('Sending OTP request:', { phone: phoneStr, isLogin });
      const response = await api.post('/auth/send-otp', { phoneNumber: phoneStr, isLogin });
      return response.data;
    } catch (error) {
      console.error('Send OTP error:', error);
      if (error.response?.data) { 
        throw error.response.data; 
      }
      if (error.message) { 
        throw { success: false, message: error.message }; 
      }
      throw { success: false, message: 'Failed to send OTP. Please try again.' };
    }
  },

  verifyOTP: async (phone, otp, name = null, email = null) => {
    try {
      const phoneStr = String(phone || '').replace(/\D/g, '').trim();
      const otpStr = String(otp || '').trim();
      
      if (!phoneStr || phoneStr.length !== 10) {
        throw { 
          message: 'Phone number must be exactly 10 digits',
          response: { data: { success: false, message: 'Phone number must be exactly 10 digits' } } 
        };
      }
      if (!otpStr || otpStr.length !== 6) {
        throw { 
          message: 'OTP must be exactly 6 digits',
          response: { data: { success: false, message: 'OTP must be exactly 6 digits' } } 
        };
      }
      
      console.log('Verifying OTP:', { phone: phoneStr, otp: otpStr });
      const response = await api.post('/auth/verify-otp', {
        phoneNumber: phoneStr,
        otp: otpStr,
        ...(name && { name: String(name).trim() }),
        ...(email && { email: String(email).trim() }),
      });
      
      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      if (error.response?.data) { 
        throw error.response.data; 
      }
      if (error.message) { 
        throw { success: false, message: error.message }; 
      }
      throw { success: false, message: 'Failed to verify OTP. Please try again.' };
    }
  },

  adminLogin: async (phone) => {
    try {
      const phoneStr = String(phone || '').replace(/\D/g, '').trim();
      if (!phoneStr || phoneStr.length !== 10) {
        throw { 
          message: 'Phone number must be exactly 10 digits',
          response: { data: { success: false, message: 'Phone number must be exactly 10 digits' } } 
        };
      }
      
      const response = await api.post('/auth/send-otp', { phoneNumber: phoneStr, isLogin: false });
      return response.data;
    } catch (error) {
      console.error('Admin login error:', error);
      if (error.response?.data) { 
        throw error.response.data; 
      }
      throw { success: false, message: error.message || 'Failed to send OTP' };
    }
  },

  adminVerifyOTP: async (phone, otp) => {
    try {
      const phoneStr = String(phone || '').replace(/\D/g, '').trim();
      const otpStr = String(otp || '').trim();
      
      if (!phoneStr || phoneStr.length !== 10) {
        throw { 
          message: 'Phone number must be exactly 10 digits',
          response: { data: { success: false, message: 'Phone number must be exactly 10 digits' } } 
        };
      }
      if (!otpStr || otpStr.length !== 6) {
        throw { 
          message: 'OTP must be exactly 6 digits',
          response: { data: { success: false, message: 'OTP must be exactly 6 digits' } } 
        };
      }
      
      const response = await api.post('/auth/verify-otp', {
        phoneNumber: phoneStr,
        otp: otpStr,
      });
      
      if (response.data.data?.user?.role !== 'admin') {
        throw { 
          message: 'Access denied. Admin privileges required.',
          response: { data: { success: false, message: 'Access denied. Admin privileges required.' } } 
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Admin verify OTP error:', error);
      if (error.response?.data) { 
        throw error.response.data; 
      }
      if (error.message) { 
        throw { success: false, message: error.message }; 
      }
      throw { success: false, message: 'Failed to verify OTP. Please try again.' };
    }
  },
};

export default authService;

