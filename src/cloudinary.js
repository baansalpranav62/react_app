// Cloudinary configuration for free tier
const CLOUDINARY_CONFIG = {
  cloudName: 'dgjv5g63l', // Your actual cloud name from the dashboard
  uploadPreset: 'hotel_docs', // This should match your preset name exactly
  folder: 'hotel-registration-docs', // Folder to organize uploads
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], // Restrict to images
  maxFileSize: 10 * 1024 * 1024 // 10MB max file size
};

// URL for check-in details collection
export const CHECKIN_COLLECTION_URL = 'https://collection.cloudinary.com/dgjv5g63l/1a494ea354920f4bd03cd8683c68b518';

// Function to validate file type and size
const validateFile = (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  if (!CLOUDINARY_CONFIG.allowedFileTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.');
  }

  if (file.size > CLOUDINARY_CONFIG.maxFileSize) {
    throw new Error(`File size exceeds ${CLOUDINARY_CONFIG.maxFileSize / (1024 * 1024)}MB limit.`);
  }

  return true;
};

// Upload file to Cloudinary (now restricted to images only)
export const uploadToCloudinary = async (file) => {
  try {
    validateFile(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', CLOUDINARY_CONFIG.folder);
    formData.append('resource_type', 'image'); // Force image type only

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      originalName: file.name,
      size: data.bytes,
      type: 'image',
      format: data.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Remove the uploadPDFToCloudinary function since we're restricting to images only

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    // Note: Deletion requires server-side implementation with API secret
    // For now, we'll just return success for the demo
    console.log('Delete request for:', publicId);
    return { success: true };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

export default CLOUDINARY_CONFIG; 