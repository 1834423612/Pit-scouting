const express = require('express');
const chalk = require('chalk');
const cors = require('cors');

const app = express();
let port = 3000; // 初始端口

// 使用CORS中间件，允许所有来源的请求
app.use(cors());


const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(chalk.blue(`Server running on http://localhost:${port}`));
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') { // 端口被占用
            console.log(`Port ${port} is in use, trying next port...`);
            startServer(++port); // 尝试下一个端口
        } else {
            console.error(err);
        }
    });
};

const findAvailablePort = (port, callback) => {
    const server = app.listen(port, () => {
        server.close(() => callback(port));
    }).on('error', () => {
        findAvailablePort(port + 1, callback);
    });
};

app.get('/get-image/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const url = `https://drive.google.com/uc?export=view&id=${fileId}`;

        // 创建一个包含原始请求头的新请求头对象
        const forwardedHeaders = {
            ...req.headers,
            'User-Agent': req.headers['user-agent']
        };

        // 从Google Drive获取数据
        const response = await axios.get(url, { headers: forwardedHeaders, responseType: 'arraybuffer' });

        // 将Google Drive的响应转发给用户
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error fetching image');
    }
});

startServer(port);
