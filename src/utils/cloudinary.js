import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) {
      throw new Error('File path is required for upload');
    }

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.log('Error uploading to cloudinary: ', error);
    throw error;
  }
};

const destroyOnCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      return;
    }

    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
  } catch (error) {
    console.log('Cloudinary delete fails: ', error);
    throw error;
  }
};

export { uploadOnCloudinary, destroyOnCloudinary };
