# Cloudinary Setup Guide

## Why Cloudinary?
- **100% Free Tier**: 25GB storage + 25GB monthly bandwidth
- **No Billing Required**: Unlike Firebase Storage
- **Easy Integration**: Simple API, no complex setup
- **Automatic Optimization**: Images are automatically optimized

## Step-by-Step Setup

### 1. Create Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up For Free"
3. Create your account (no credit card required)
4. Verify your email address

### 2. Get Your Cloudinary Credentials
1. Login to your [Cloudinary Console](https://console.cloudinary.com)
2. On the dashboard, you'll see:
   - **Cloud Name**: (e.g., "your-cloud-name")
   - **API Key**: (e.g., "123456789012345")
   - **API Secret**: (keep this secure, not needed for uploads)

### 3. Create Upload Preset
1. In Cloudinary Console, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `hotel_docs`
   - **Signing Mode**: `Unsigned` (important!)
   - **Folder**: `hotel-registration-docs`
   - **Resource Type**: `Auto`
   - **Access Mode**: `Public`
   - **File size limit**: `100MB`
   - **Allowed formats**: `jpg,png,pdf,jpeg`
5. Click **Save**

### 4. Update Your Code
In `src/cloudinary.js`, update the configuration:

```javascript
const CLOUDINARY_CONFIG = {
  cloudName: 'YOUR_CLOUD_NAME', // Replace with your actual cloud name
  uploadPreset: 'hotel_docs', // This should match your preset name
  folder: 'hotel-registration-docs'
};
```

### 5. Test the Integration
1. Build and deploy your app: `npm run build && firebase deploy`
2. Try uploading a document in the guest registration form
3. Check your Cloudinary console to see the uploaded files

## Configuration Options

### Security Settings (Optional)
For production, you might want to:
1. Set up **signed uploads** (requires backend)
2. Configure **access control** and **transformations**
3. Set up **webhooks** for upload notifications

### Folder Organization
Files will be stored in: `hotel-registration-docs/YYYY-MM-DD/filename`

### File Optimization
Cloudinary automatically:
- Compresses images
- Converts to optimal formats
- Provides multiple sizes
- Delivers via CDN

## Troubleshooting

### Common Issues:
1. **"Upload preset not found"**: Make sure preset name matches exactly
2. **"Access denied"**: Ensure preset is set to "Unsigned"
3. **"File too large"**: Check preset file size limit
4. **CORS errors**: Cloudinary handles CORS automatically

### Fallback Mode
If Cloudinary fails, the app automatically falls back to local blob storage for demo purposes.

## Free Tier Limits
- **Storage**: 25GB
- **Monthly Bandwidth**: 25GB  
- **Transformations**: 25,000 per month
- **Admin API calls**: 2,000 per month

## Need Help?
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload API Reference](https://cloudinary.com/documentation/image_upload_api_reference)
- [Upload Presets Guide](https://cloudinary.com/documentation/upload_presets)

---

**Note**: This setup provides a professional, scalable solution for file uploads without any cost or billing requirements! 