const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();

// JSON 파싱 미들웨어
app.use(express.json());

// CORS 설정
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname)));

// 라우터 설정
const apiRouter = require('./api/index');
app.use(apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
