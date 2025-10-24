import { ConfidentialClientApplication, CryptoProvider } from '@azure/msal-node';
import { config } from '../config';

const msalConfig = {
  auth: {
    clientId: config.microsoft.clientId,
    authority: `https://login.microsoftonline.com/${config.microsoft.tenantId}`,
    clientSecret: config.microsoft.clientSecret,
  },
};

const pca = new ConfidentialClientApplication(msalConfig);
const cryptoProvider = new CryptoProvider();

export class AuthService {
  /**
   * Generate authorization URL for Microsoft OAuth
   */
  async getAuthUrl(): Promise<string> {
    const authCodeUrlParameters = {
      scopes: config.microsoft.scopes,
      redirectUri: config.microsoft.redirectUri,
    };

    try {
      const response = await pca.getAuthCodeUrl(authCodeUrlParameters);
      return response;
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async getTokenFromCode(code: string): Promise<any> {
    const tokenRequest = {
      code,
      scopes: config.microsoft.scopes,
      redirectUri: config.microsoft.redirectUri,
    };

    try {
      const response = await pca.acquireTokenByCode(tokenRequest);
      return response;
    } catch (error) {
      console.error('Error acquiring token:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<any> {
    const refreshTokenRequest = {
      refreshToken,
      scopes: config.microsoft.scopes,
    };

    try {
      const response = await pca.acquireTokenByRefreshToken(refreshTokenRequest);
      return response;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
