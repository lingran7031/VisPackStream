const express = require("express");
const bodyParser = require("body-parser");
const dispatchAlarm = require("./alarmRouter");
const os = require('os');



const app = express();

const PORT = 3000;
const path = '/alarm';
const localIP = getLocalIP();
app.use(bodyParser.json());

app.post(path, (req, res) => {
  const alarmData = req.body;
  dispatchAlarm(alarmData);
  res.status(200).send("报警已处理");
});

app.listen(PORT, () => {
  console.info("VisPackStream 报警系统已启动，监听端口 3000");
  console.info(`本地访问地址:   http://localhost:${PORT}${path}`);
  console.info(`网络访问地址: http://${localIP}:${PORT}${path}`);
});

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