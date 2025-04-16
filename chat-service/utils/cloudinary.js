const cloudinary = require('cloudinary').v2;
cloudinary.config();


const uploadToCloudinary = async (fileBuffer, folder = 'chat_files') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder,  // Tên thư mục trong Cloudinary
                resource_type: "auto", // tự động nhận diện loại tài nguyên (ảnh, video, file)
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);  // Trả về URL an toàn của file đã upload
            }
        ).end(fileBuffer);  // Đẩy file lên Cloudinary
    });
};

module.exports = { uploadToCloudinary };
