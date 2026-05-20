// cloudinary.js — sets up Cloudinary for image uploads
import { v2 as cloudinary } from 'cloudinary'; // v2 is the current API
import { CloudinaryStorage } from 'multer-storage-cloudinary'; // multer adapter for cloudinary
import multer from 'multer'; // handles multipart/form-data (file uploads)
import dotenv from 'dotenv';
dotenv.config();

// connect cloudinary with our account credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// storage config for profile avatars — uploads directly to Cloudinary
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eventix/avatars',                                                    // folder in Cloudinary dashboard
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],                              // only allow images
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] // auto-crop to face
  }
});

// storage config for event banner images
const eventStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eventix/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 630, crop: 'fill' }] // standard banner size
  }
});

// multer middleware for avatar uploads — use as route middleware
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// multer middleware for event image uploads
export const uploadEventImage = multer({
  storage: eventStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// delete an image from Cloudinary by its public_id (called when user changes avatar)
export const deleteImage = async (publicId) => {
  if (!publicId) return; // nothing to delete
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message); // log but don't crash
  }
};

export default cloudinary;
