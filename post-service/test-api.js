const axios = require('axios');

const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2M4MTdlMWViMzVjYzI1ZjFiMWIxNzIiLCJpYXQiOjE3NDExNzA3MDEsImV4cCI6MTc0MTE3NDMwMX0.vG9WGRdTEJy7Vn4gC73JmnLYpU_tbGLHvA55SYJAYHo"; // Thay token hợp lệ vào đây

const createPost = async () => {
    try {
        const response = await axios.post("http://localhost:3000/posts", {
            content: "This is my post!",
            media: ["https://example.com/image.jpg"],
            tags: ["tag1", "tag2"]
        }, {
            headers: {
                Authorization: token,
                "Content-Type": "application/json"
            }
        });

        console.log("Success:", response.data);
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
};

createPost();
