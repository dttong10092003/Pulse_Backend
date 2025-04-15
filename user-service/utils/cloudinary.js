const cloudinary = require('cloudinary').v2;

// Tự động đọc từ CLOUDINARY_URL nếu có
cloudinary.config();

// ======= UPLOAD ẢNH BASE64 =========
const uploadToCloudinary = async (fileBase64, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileBase64,
      { folder: folder || 'user-profile' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // Trả về URL ảnh
      }
    );
  });
};

// ======= DELETE ẢNH TỪ URL =========
// Tách public_id từ URL Cloudinary
const extractPublicId = (url) => {
  const match = url.match(/upload\/(?:v\d+\/)?(.+)\.(jpg|jpeg|png|gif|webp)/);
  return match ? match[1] : null;
};

const deleteFromCloudinary = async (url) => {
  const publicId = extractPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('❌ Error deleting Cloudinary image:', error.message);
  }
};

// Export cả hai hàm
module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};
