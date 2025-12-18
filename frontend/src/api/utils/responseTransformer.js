/**
 * Response Transformer
 * Transforms API responses to consistent format
 */

/**
 * Transform response data to consistent format
 */
export const transformResponse = (response) => {
  const { data } = response;
  
  // If response already has success field, return as is
  if (data && typeof data === 'object' && 'success' in data) {
    return {
      success: data.success,
      data: data.data || data,
      message: data.message,
      ...(data.total !== undefined && { total: data.total }),
      ...(data.page !== undefined && { page: data.page }),
      ...(data.pages !== undefined && { pages: data.pages }),
      ...(data.count !== undefined && { count: data.count }),
    };
  }
  
  // Default transformation
  return {
    success: true,
    data: data || null,
    message: null,
  };
};

/**
 * Extract data from response (backward compatibility)
 */
export const extractData = (response) => {
  return response.data?.data || response.data || response;
};

export default {
  transformResponse,
  extractData,
};
