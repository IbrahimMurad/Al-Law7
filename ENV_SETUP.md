# Environment Variables Setup

This application requires the following environment variables for Google OAuth authentication:

## Required Variables

1. **GOOGLE_CLIENT_ID**: Your Google OAuth 2.0 Client ID
2. **GOOGLE_CLIENT_SECRET**: Your Google OAuth 2.0 Client Secret
3. **SESSION_SECRET**: A secure random string for session encryption (required)

## Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. For Application type, select "Web application"
7. Add authorized redirect URI:
   - `https://your-netlify-domain.netlify.app/api/auth/google/callback`
8. Copy the Client ID and Client Secret

## Netlify Configuration

1. Go to your Netlify site dashboard
2. Navigate to "Site settings" → "Environment variables"
3. Add the following variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SESSION_SECRET`

**Important**: Never commit the `.env` file to version control. It should be in `.gitignore`.

## Generating a Session Secret

You can generate a secure random string for `SESSION_SECRET` using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
