const express = require("express");
const cookieParser = require('cookie-parser');
const os = require('os');
const multer = require('multer');;
const upload = multer(); // 使用内存存储
const app = express();
const PORT = 3000;
const path = '/alarm';
const dispatchAlarm = require("./alarmRouter");
const { pushAlarmData } = require("./pushService")


const localIP = getLocalIP();

//中间件
app.use(cookieParser());

app.post(path, upload.any(), (req, res) => {

  let alarmData;
  try {
    alarmData = JSON.parse(req.body.alarm_info);
  } catch (err) {
    console.error("JSON 解析失败:", err);
    return res.status(400).send("Invalid JSON in alarm_info");
  }
  console.log("解析后的报警数据:", alarmData);
  // 分发处理
  const alarmInfo = dispatchAlarm(alarmData);
  //数据转发
  pushAlarmData(alarmInfo);

  res.status(200).send("success");
});

app.listen(PORT,  upload.any(), () => {
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