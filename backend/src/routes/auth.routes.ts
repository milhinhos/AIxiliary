import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { oneDriveService } from '../services/onedrive.service';

const router = Router();

/**
 * GET /auth/login
 * Initiate Microsoft OAuth login flow
 */
router.get('/login', async (req: Request, res: Response) => {
  try {
    const authUrl = await authService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

/**
 * GET /auth/callback
 * Handle OAuth callback from Microsoft
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await authService.getTokenFromCode(code);

    // Get user profile
    const userProfile = await oneDriveService.getUserProfile(tokenResponse.accessToken);

    // Store user info in session
    req.session.user = {
      id: userProfile.id,
      email: userProfile.mail || userProfile.userPrincipalName,
      name: userProfile.displayName,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
    };

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/success`);
  } catch (error) {
    console.error('Error handling auth callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/error`);
  }
});

/**
 * GET /auth/user
 * Get current user info
 */
router.get('/user', (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Don't send tokens to frontend
  const { accessToken, refreshToken, ...userInfo } = req.session.user;
  res.json(userInfo);
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;
