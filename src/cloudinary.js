// Cloudinary configuration for free tier
// You can get these values from your Cloudinary dashboard at https://cloudinary.com/console
const CLOUDINARY_CONFIG = {
  cloudName: 'dgjv5g63l', // Your actual cloud name from the dashboard
  uploadPreset: 'hotel_docs', // This should match your preset name exactly
  folder: 'hotel-registration-docs' // Folder to organize uploads
};

// Upload file to Cloudinary
export const uploadToCloudinary = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', CLOUDINARY_CONFIG.folder);
    formData.append('resource_type', 'auto'); // Handles images, videos, and raw files

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`,
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
      type: data.resource_type,
      format: data.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Delete file from Cloudinary (optional)
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