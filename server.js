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

// 中间件
app.use(bodyParser.json());
app.use(cookieParser());


app.post('/alarm', (req, res) => {
  console.log('接收到报警数据，开始写入文件');
  //将抓取到的数据包格式化后写入文件
  fs.writeFileSync('alarm_' + Date.now() + '.json', req, null, 2);
  //返回
  return res.status(200).json({
    code: 200,
    msg: 'success',
  });
});

// 启动服务器并打印本机 IP
app.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log(`Alarm Push Server running at:`);
  console.log(`   Local:   http://localhost:${PORT}/alarm`);
  console.log(`   Network: http://${localIP}:${PORT}/alarm`);
});
