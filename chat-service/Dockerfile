# Sử dụng hình ảnh node chính thức làm base image
FROM node:20

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json trước để cài dependencies
COPY package.json .

# Cài đặt dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Expose port mà chat-service sẽ chạy
EXPOSE 5005

# Lệnh chạy ứng dụng khi container khởi động
CMD ["node", "server.js"]
