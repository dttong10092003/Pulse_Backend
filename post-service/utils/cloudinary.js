const cloudinary = require('cloudinary').v2;

cloudinary.config(); // Đọc từ CLOUDINARY_URL

const uploadToCloudinary = async (fileBase64, folder = 'posts') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileBase64,
      {
        folder,
        resource_type: "auto", // auto: cho phép cả ảnh lẫn video
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
  });
};
// Hàm xoá file Cloudinary từ URL
const deleteFromCloudinaryByUrl = async (fileUrl) => {
  try {
    const url = new URL(fileUrl);
    const parts = url.pathname.split("/"); // ví dụ: /video/upload/v123456789/posts/abcxyz.mp4

    // Xác định vị trí bắt đầu từ sau "upload"
    const uploadIndex = parts.findIndex((p) => p === "upload");

    // Lấy phần còn lại từ sau "upload", bỏ "v..." (nếu có)
    const publicIdParts = parts.slice(uploadIndex + 1);

    // Nếu phần đầu là version (vd: v123456), bỏ nó
    if (/^v\d+$/.test(publicIdParts[0])) {
      publicIdParts.shift();
    }

    const publicIdWithExt = publicIdParts.join("/"); // posts/abcxyz.mp4
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // posts/abcxyz

    const resourceType = fileUrl.includes("/video/") ? "video" : "image";

    console.log("🧾 publicId:", publicId);
    console.log("📦 resourceType:", resourceType);

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    console.log("✅ Deleted from Cloudinary:", publicId);
  } catch (error) {
    console.error("❌ Error deleting Cloudinary file:", error.message);
  }
};



module.exports = { uploadToCloudinary, deleteFromCloudinaryByUrl };
