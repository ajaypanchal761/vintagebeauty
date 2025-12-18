const axios = require('axios');

/**
 * Normalize phone number to Indian format with country code
 * @param {string} phone - Phone number to normalize
 * @returns {string} - Normalized phone number (91XXXXXXXXXX)
 */
const normalizePhoneNumber = (phone) => {
  // Remove all non-digit characters
  const digits = phone.replace(/[^0-9]/g, '');
  
  // If it already has country code 91 and is 12 digits, return as is
  if (digits.startsWith('91') && digits.length === 12) {
    return digits;
  }
  
  // If it's 10 digits, add country code 91
  if (digits.length === 10) {
    return '91' + digits;
  }
  
  // If it's 11 digits and starts with 0, remove the 0 and add country code
  if (digits.length === 11 && digits.startsWith('0')) {
    return '91' + digits.substring(1);
  }
  
  // Return with country code as fallback
  return '91' + digits.slice(-10);
};

/**
 * Send OTP SMS using SMSINDIAHUB API
 * @param {string} phoneNumber - 10 digit phone number
 * @param {string} otp - 6 digit OTP
 * @returns {Promise<Object>} - Response from SMSINDIAHUB
 */
const sendOTPSMS = async (phoneNumber, otp) => {
  try {
    const API_KEY = process.env.SMSINDIAHUB_API_KEY;
    const SENDER_ID = process.env.SMSINDIAHUB_SENDER_ID;

    if (!API_KEY || !SENDER_ID) {
      throw new Error('SMSINDIAHUB credentials not configured');
    }

    // Normalize phone number to 12 digits with country code
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Validate phone number (should be 12 digits with country code)
    if (normalizedPhone.length !== 12 || !normalizedPhone.startsWith('91')) {
      throw new Error(`Invalid phone number format: ${phoneNumber}. Expected 10-digit Indian mobile number.`);
    }

    // OTP message
    const message = `Welcome to the VINTAGE BEAUTY powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;

    // IMPORTANT: Use the correct base URL - HTTP (not HTTPS) and correct domain
    const baseUrl = 'http://cloud.smsindiahub.in/vendorsms/pushsms.aspx';

    // Build query parameters
    const params = new URLSearchParams({
      APIKey: API_KEY,
      msisdn: normalizedPhone,
      sid: SENDER_ID,
      msg: message,
      fl: '0',  // Flash message flag (0 = normal SMS)
      dc: '0',  // Delivery confirmation (0 = no confirmation)
      gwid: '2' // Gateway ID (2 = transactional)
    });

    // Build the complete API URL
    const apiUrl = `${baseUrl}?${params.toString()}`;

    // Make GET request to SMSINDIAHUB API
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'VintageBeauty/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000 // 15 second timeout
    });

    // Parse response
    let responseData = response.data;

    // Handle case where response might be a string
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (e) {
        // If parsing fails, check if it contains success indicators
        const responseText = responseData.toString();
        if (responseText.includes('success') || responseText.includes('sent') || responseText.includes('Done')) {
          return {
            success: true,
            messageId: `sms_${Date.now()}`,
            status: 'sent',
            to: normalizedPhone,
            body: message,
            provider: 'SMSINDIAHUB',
          };
        } else {
          throw new Error(`SMSINDIAHUB API error: ${responseText}`);
        }
      }
    }

    // Check for success indicators in the response
    if (responseData && responseData.ErrorCode === '000' && responseData.ErrorMessage === 'Done') {
      const messageId = responseData.MessageData && responseData.MessageData[0]
        ? responseData.MessageData[0].MessageId
        : `sms_${Date.now()}`;

      return {
        success: true,
        messageId: messageId,
        jobId: responseData.JobId,
        status: 'sent',
        to: normalizedPhone,
        body: message,
        provider: 'SMSINDIAHUB',
      };
    } else if (responseData && responseData.ErrorCode && responseData.ErrorCode !== '000') {
      throw new Error(`SMSINDIAHUB API error: ${responseData.ErrorMessage || 'Unknown error'} (Code: ${responseData.ErrorCode})`);
    } else {
      // Fallback for unexpected response format
      return {
        success: true,
        messageId: `sms_${Date.now()}`,
        status: 'sent',
        to: normalizedPhone,
        body: message,
        provider: 'SMSINDIAHUB',
      };
    }
  } catch (error) {
    console.error('SMSINDIAHUB Error:', error.message);

    // Handle specific error cases
    if (error.response) {
      let errorMessage = 'SMSINDIAHUB API error';

      try {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData && typeof errorData === 'object' && errorData.ErrorMessage) {
          errorMessage = errorData.ErrorMessage;
        }
      } catch (e) {
        // Ignore parsing errors
      }

      if (error.response.status === 401) {
        throw new Error('SMSINDIAHUB authentication failed. Please check your API key.');
      } else if (error.response.status === 400) {
        throw new Error(`SMSINDIAHUB request error: ${errorMessage}`);
      } else {
        throw new Error(`SMSINDIAHUB API error (${error.response.status}): ${errorMessage}`);
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      // This error means the domain couldn't be resolved
      throw new Error(`SMSINDIAHUB Error: ${error.code} ${error.hostname || 'cloud.smsindiahub.in'}. Please check the base URL is set to: http://cloud.smsindiahub.in/vendorsms/pushsms.aspx`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('SMSINDIAHUB request timeout. Please try again.');
    } else if (error.code === 'ECONNRESET') {
      throw new Error('SMSINDIAHUB connection was reset. Please try again.');
    }

    // For other errors
    const errorMessage = error.message || 'SMSINDIAHUB service error';
    throw new Error(errorMessage);
  }
};

module.exports = {
  sendOTPSMS
};

