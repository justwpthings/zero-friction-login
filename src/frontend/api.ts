import type { Config, AuthResponse, VerifyOTPResponse, ErrorResponse, LogoutResponse } from './types';

const getApiUrl = (endpoint: string): string => {
  const hasZflData = typeof window.zflData !== 'undefined';
  const apiUrl = hasZflData && window.zflData.apiUrl ? window.zflData.apiUrl : null;

  console.log('[ZFL API] Getting URL for endpoint:', endpoint);
  console.log('[ZFL API] window.zflData exists:', hasZflData);
  console.log('[ZFL API] apiUrl:', apiUrl);

  if (apiUrl) {
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${baseUrl}${path}`;
    console.log('[ZFL API] Full URL:', fullUrl);
    return fullUrl;
  }

  const fallbackUrl = `/wp-json/zfl/v1${endpoint}`;
  console.log('[ZFL API] Using fallback URL:', fallbackUrl);
  return fallbackUrl;
};

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (typeof window.zflData !== 'undefined' && window.zflData.nonce) {
    headers['X-WP-Nonce'] = window.zflData.nonce;
  }

  return headers;
};

export const getConfig = async (): Promise<Config> => {
  try {
    const url = getApiUrl('/config');
    console.log('[ZFL API] Fetching config from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'same-origin',
    });

    console.log('[ZFL API] Response status:', response.status);
    console.log('[ZFL API] Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ZFL API] Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('[ZFL API] Config data received:', data);
    return data;
  } catch (error) {
    console.error('[ZFL API] Failed to fetch config:', error);
    throw error;
  }
};

export const requestAuth = async (email: string, displayName?: string): Promise<AuthResponse | ErrorResponse> => {
  try {
    const body: { email: string; display_name?: string } = { email };
    if (displayName) {
      body.display_name = displayName;
    }

    const response = await fetch(getApiUrl('/request-auth'), {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      let message = data.message || `Request failed with status ${response.status}`;
      if (data.error_detail) {
        message += ` - ${data.error_detail}`;
      }
      console.error('[ZFL API] Request auth error:', {
        status: response.status,
        message: data.message,
        error_type: data.error_type,
        error_detail: data.error_detail,
        reason: data.reason
      });
      return {
        success: false,
        message,
        reason: data.reason,
      };
    }

    return data;
  } catch (error) {
    console.error('Failed to request auth:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

export const verifyOTP = async (email: string, otp: string): Promise<VerifyOTPResponse | ErrorResponse> => {
  try {
    const response = await fetch(getApiUrl('/verify-otp'), {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Verification failed with status ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

export const logout = async (): Promise<LogoutResponse> => {
  try {
    const response = await fetch(getApiUrl('/logout'), {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'same-origin',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Logout failed with status ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error('Failed to logout:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};
