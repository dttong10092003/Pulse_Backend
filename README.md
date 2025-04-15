# Pulse_Backend
docker compose down
docker compose up --build

npm install nodemailer trong auth-service

npm install cloudinary multer trong user-service & post-service
-> cd api-gateway: npm install cors

like-service:

Tạo like cho 1 post (POST):

http://localhost:5003/likes/{postId} (có token)

Hủy like (DELETE):

http://localhost:5003/likes/{postId} (có token)

Xem số lượt like của 1 bài viết (GET): 

http://localhost:5003/likes/count/{postId}

Lấy danh sách người đã like post (GET):

http://localhost:5003/likes/{postId}


cmt-service:

Tạo bình luận (POST):

http://localhost:5004/comments (có token)

Body: 

{
    "postId": "65df1f9f8c1b2a4a12345678",
    "text": "This is a great post!"
}

Trả lời bình luận (POST): 

http://localhost:5004/comments/reply/{commentId} (có token)

{"text": "I totally agree with you!"}

Xem tất cả bình luận của bài viết (GET): 

http://localhost:5004/comments/{postId}


- Thêm hàm getUsernameById và getMe ở authCotnroller, sửa cái getUserById của userController

- Bài post: Hiện bài post của cá nhân thì dễ. Nhưng hiện bài post của bạn bè đã follow -> phải test chức năng follow xong

- Việc cần làm: trang MyProfile, bài post cá nhân