import express from 'express';
import { randomBytes, createHash } from 'crypto';
import open from 'open';
import axios from 'axios';

export class BitbucketOAuthAuth {
  constructor() {
    this.clientId = null;
    this.clientSecret = null;
    this.redirectUri = 'http://localhost:8080/callback';
    this.scope = 'repositories';
    this.accessToken = null;
    this.refreshToken = null;
    this.server = null;
    this.authPromise = null;
    this.codeVerifier = null;
    this.codeChallenge = null;
  }

  /**
   * Initialize OAuth with dynamic client credentials
   * @param {string} clientId - Bitbucket OAuth client ID
   * @param {string} clientSecret - Bitbucket OAuth client secret (optional for PKCE)
   */
  initialize(clientId, clientSecret = null) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.generatePKCEChallenge();
  }

  /**
   * Generate PKCE code verifier and challenge for OAuth security
   */
  generatePKCEChallenge() {
    this.codeVerifier = randomBytes(32).toString('base64url');
    this.codeChallenge = createHash('sha256')
      .update(this.codeVerifier)
      .digest('base64url');
  }

  /**
   * Start OAuth flow by opening browser and starting local server
   * @returns {Promise<string>} Access token
   */
  async authenticate() {
    if (!this.clientId) {
      throw new Error('OAuth client ID not set. Call initialize() first.');
    }

    if (this.accessToken) {
      // Check if token is still valid
      try {
        await this.validateToken();
        return this.accessToken;
      } catch (error) {
        console.log('Token expired, re-authenticating...');
        this.accessToken = null;
      }
    }

    return new Promise((resolve, reject) => {
      this.authPromise = { resolve, reject };
      this.startLocalServer();
      this.openAuthUrl();
    });
  }

  /**
   * Start local server to receive OAuth callback
   */
  startLocalServer() {
    const app = express();
    
    app.get('/callback', async (req, res) => {
      try {
        const { code, error } = req.query;
        
        if (error) {
          res.send(`
            <html>
              <body>
                <h1>Authentication Failed</h1>
                <p>Error: ${error}</p>
                <script>window.close();</script>
              </body>
            </html>
          `);
          this.authPromise.reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (!code) {
          res.send(`
            <html>
              <body>
                <h1>Authentication Failed</h1>
                <p>No authorization code received</p>
                <script>window.close();</script>
              </body>
            </html>
          `);
          this.authPromise.reject(new Error('No authorization code received'));
          return;
        }

        // Exchange code for token
        const tokenData = await this.exchangeCodeForToken(code);
        this.accessToken = tokenData.access_token;
        this.refreshToken = tokenData.refresh_token;

        res.send(`
          <html>
            <body>
              <h1>Authentication Successful!</h1>
              <p>You can now close this window.</p>
              <script>
                setTimeout(() => window.close(), 2000);
              </script>
            </body>
          </html>
        `);

        this.authPromise.resolve(this.accessToken);
        this.server.close();
      } catch (error) {
        res.send(`
          <html>
            <body>
              <h1>Authentication Failed</h1>
              <p>Error: ${error.message}</p>
              <script>window.close();</script>
            </body>
          </html>
        `);
        this.authPromise.reject(error);
        this.server.close();
      }
    });

    this.server = app.listen(8080, () => {
      console.log('OAuth callback server started on http://localhost:8080');
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      if (this.authPromise && !this.accessToken) {
        this.authPromise.reject(new Error('OAuth authentication timeout'));
        this.server.close();
      }
    }, 300000);
  }

  /**
   * Open browser to Bitbucket OAuth authorization URL
   */
  async openAuthUrl() {
    const state = randomBytes(16).toString('hex');
    const authUrl = new URL('https://bitbucket.org/site/oauth2/authorize');
    
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', this.scope);
    authUrl.searchParams.set('state', state);
    
    // Use PKCE for enhanced security
    authUrl.searchParams.set('code_challenge', this.codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('Opening browser for Bitbucket OAuth authentication...');
    console.log('Auth URL:', authUrl.toString());
    
    try {
      await open(authUrl.toString());
    } catch (error) {
      console.error('Failed to open browser automatically. Please visit this URL manually:');
      console.error(authUrl.toString());
    }
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @returns {Promise<object>} Token response
   */
  async exchangeCodeForToken(code) {
    const tokenUrl = 'https://bitbucket.org/site/oauth2/access_token';
    
    const data = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      code_verifier: this.codeVerifier,
    };

    // Add client credentials
    if (this.clientSecret) {
      data.client_id = this.clientId;
      data.client_secret = this.clientSecret;
    }

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    // If no client secret (public client), use Basic auth with client_id
    if (!this.clientSecret) {
      const credentials = Buffer.from(`${this.clientId}:`).toString('base64');
      config.headers.Authorization = `Basic ${credentials}`;
    }

    const response = await axios.post(tokenUrl, new URLSearchParams(data), config);
    return response.data;
  }

  /**
   * Validate current access token
   * @returns {Promise<object>} User info if token is valid
   */
  async validateToken() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await axios.get('https://api.bitbucket.org/2.0/user', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    return response.data;
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<string>} New access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenUrl = 'https://bitbucket.org/site/oauth2/access_token';
    
    const data = {
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
    };

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    // Use Basic auth with client credentials
    if (this.clientSecret) {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      config.headers.Authorization = `Basic ${credentials}`;
    } else {
      const credentials = Buffer.from(`${this.clientId}:`).toString('base64');
      config.headers.Authorization = `Basic ${credentials}`;
    }

    const response = await axios.post(tokenUrl, new URLSearchParams(data), config);
    
    this.accessToken = response.data.access_token;
    if (response.data.refresh_token) {
      this.refreshToken = response.data.refresh_token;
    }

    return this.accessToken;
  }

  /**
   * Get current access token
   * @returns {string|null} Access token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return !!this.accessToken;
  }

  /**
   * Clear authentication data
   */
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    console.log('Logged out successfully');
  }
}
