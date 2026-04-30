# How to Get Firebase Service Account Key

## Quick Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)

2. Select your project: **eventix-e5343**

3. Click the **⚙️ gear icon** (Settings) → **Project settings**

4. Go to **Service accounts** tab

5. Click **Generate new private key**

6. Click **Generate key** (a JSON file will download)

7. Rename the downloaded file to `fireb-sdk.json`

8. Move it to the `server/` directory (same level as package.json)

## File Structure:
```
server/
├── fireb-sdk.json  ← Put the file here
├── package.json
├── .env
└── src/
```

## The file should look like this:
```json
{
  "type": "service_account",
  "project_id": "eventix-e5343",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@eventix-e5343.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## After adding the file:

Restart the server:
```bash
npm run dev
```

You should see:
```
✅  Firebase Admin SDK initialized
```

## Alternative (Temporary):

For now, the server will try to start without it, but you'll need it for full functionality.
