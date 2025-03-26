# Sử dụng hình ảnh node chính thức làm base image
FROM node:20

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package.json .
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Expose port mà ứng dụng sẽ chạy
EXPOSE 5002

# Lệnh chạy ứng dụng khi container khởi động
CMD ["node", "server.js"]
