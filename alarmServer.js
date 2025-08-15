const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const http = require('http');

const { pushAlarmData } = require('./lib/pushService');
const dispatchAlarm = require('./lib/alarmRouter');

// 初始化multer
const upload = multer();

// 报警服务器实例
let alarmServer = null;

// 导出模块
module.exports = {
  startAlarmService,
  getAlarmServer,
  alarmlogs: {
    img: './nopig.png',
    data: {}
  }
};

/**
 * 启动报警服务
 * @param {Object} config - 配置对象
 * @param {Array} infologs - 日志数组引用
 */
function startAlarmService(config, infologs) {
  const alarmApp = express();
  alarmApp.use(cookieParser());

  // 处理报警数据推送
  alarmApp.post(config.path, upload.any(), (req, res) => {
    console.log('收到来自Http Client的推送');
    let alarmData;
    try {
      alarmData = JSON.parse(req.body.alarm_info);
    } catch (err) {
      console.log('JSON 解析失败');
      infologs.unshift({ time: new Date().toLocaleString(), data: 'JSON 解析失败' });
      if (infologs.length > 20) infologs.pop();
      return res.status(400).send('Invalid JSON');
    }

    const alarmInfo = dispatchAlarm(alarmData);
    infologs.unshift({ time: new Date().toLocaleString(), data: '收到来自Http Client的推送' });
    if (infologs.length > 20) infologs.pop();

    const response = pushAlarmData(alarmInfo);
    infologs.unshift({ time: new Date().toLocaleString(), data: response });
    if (infologs.length > 20) infologs.pop();

    res.status(200).send('success');

    // 处理图片
    const img = req.files && req.files[0]
      ? `data:${req.files[0].mimetype};base64,${req.files[0].buffer.toString('base64')}`
      : './nopig.png';
    module.exports.alarmlogs.img = img;
    module.exports.alarmlogs.data = {
        ...alarmInfo,
    };
  });

  if (alarmServer) {
    console.log('正在关闭旧的HTTP Server服务...');
    alarmServer.close(err => {
      if (err) {
        console.error('关闭旧服务器失败:', err);
        infologs.unshift({ time: new Date().toLocaleString(), data: `关闭旧服务器失败: ${err.message}` });
        if (infologs.length > 20) infologs.pop();
        return;
      }
      console.log('旧的HTTP Server服务已关闭');
      infologs.unshift({ time: new Date().toLocaleString(), data: '旧的HTTP Server服务已关闭' });
      if (infologs.length > 20) infologs.pop();

      // 启动新服务器
      startNewAlarmServer(alarmApp, config, infologs);
    });
  } else {
    // 直接启动新服务器
    startNewAlarmServer(alarmApp, config, infologs);
  }
}

/**
 * 启动新的报警服务器
 * @param {Object} app - express实例
 * @param {Object} config - 配置对象
 * @param {Array} infologs - 日志数组引用
 */
function startNewAlarmServer(app, config, infologs) {
  alarmServer = http.createServer(app);
  alarmServer.listen(config.port, () => {
    console.log('HTTP Server服务启动');
    infologs.unshift({ time: new Date().toLocaleString(), data: `HTTP Server服务启动: http://localhost:${config.port}${config.path}` });
    if (infologs.length > 20) infologs.pop();
  });

  // 处理服务器错误
  alarmServer.on('error', (err) => {
    console.error('HTTP Server服务启动失败:', err);
    infologs.unshift({ time: new Date().toLocaleString(), data: `HTTP Server服务启动失败: ${err.message}` });
    if (infologs.length > 20) infologs.pop();
  });
}

/**
 * 获取报警服务器实例
 * @returns {Object} 报警服务器实例
 */
function getAlarmServer() {
  return alarmServer;
}