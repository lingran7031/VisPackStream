const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const os = require('os');

const app = express();
const PORT = 3000;

// 中间件
app.use(bodyParser.json());
app.use(cookieParser());

// 获取本机 IP 地址
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// 示例 API 路由
app.get('/', (req, res) => {
  res.send('VisPackStream Server is running!');

});

app.post('/alarm', (req, res) => {
  const { message } = req.body;
  console.log(`Received alarm: ${message}`);
  res.status(200).json({ status: 'Alarm received', message });
});

// 启动服务器并打印本机 IP
app.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log(`Alarm Push Server running at:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}`);
});
