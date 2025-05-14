const cloudinary = require('cloudinary').v2;
cloudinary.config();
const path = require('path');

const uploadToCloudinary = async (buffer, originalFileName, folder = 'chat_files') => {
    const ext = path.extname(originalFileName).toLowerCase();
    const rawTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.ppt', '.pptx'];
    const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    const audioTypes = ['.mp3', '.wav', '.ogg', '.m4a'];

    let resourceType = 'auto';
    if (imageTypes.includes(ext)) resourceType = 'image';
    else if (rawTypes.includes(ext)) resourceType = 'raw';
    else if (audioTypes.includes(ext)) resourceType = 'video';

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder,  // Tên thư mục trong Cloudinary
                public_id: path.basename(originalFileName),
                resource_type: resourceType, // tự động nhận diện loại tài nguyên (ảnh, video, file)
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
