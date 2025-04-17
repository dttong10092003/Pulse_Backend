const cloudinary = require('cloudinary').v2;
cloudinary.config();


const uploadToCloudinary = async (buffer, originalFileName, folder = 'chat_files') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder,  // Tên thư mục trong Cloudinary
                public_id: originalFileName,
                resource_type: "auto", // tự động nhận diện loại tài nguyên (ảnh, video, file)
                use_filename: true,
                unique_filename: false, // không tạo tên file duy nhất
                overwrite: true, // ghi đè file nếu đã tồn tại
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);  // Trả về URL an toàn của file đã upload
            }
        ).end(buffer);  // Đẩy file lên Cloudinary
    });
};

module.exports = { uploadToCloudinary };
