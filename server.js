const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const os = require('os');
const fs = require('fs');

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

const app = express();
const PORT = 3000;
const path = '/alarm';

// 中间件
app.use(bodyParser.json());
app.use(cookieParser());


app.post(path, (req, res) => {

  console.log('接收到报警数据');
  console.log(req);

  return res.status(200).json({
    code: 200,
    msg: 'success',
  });
});

// 启动服务器并打印本机 IP
app.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log(`VisPackStream 服务启动成功，端口：${PORT}`);
  console.log(`   本地访问地址:   http://localhost:${PORT}${path}`);
  console.log(`   网络访问地址: http://${localIP}:${PORT}${path}`);
});
