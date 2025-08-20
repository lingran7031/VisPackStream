const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const http = require('http');

const { pushAlarmData } = require('./pushService');
const dispatchAlarm = require('./alarmRouter');
const { getConfig } = require('./config');
const logger = require('./Logger');

// 初始化multer
const upload = multer();

// 报警服务器实例
let alarmServer = null;

// 计时器相关变量
let alarmTimer = null;
let lastAlarmTime = Date.now();
let isTimeoutHandled = false; // 标记是否已处理超时

// 导出模块
module.exports = {
  startAlarmService,
  getAlarmServer,
  resetAlarmTimer,
  getTimerStatus,
  alarmlogs: {
    img: './nopig.png',
    data: {}
  }
};

/**
 * 重置报警计时器
 */
function resetAlarmTimer() {
  lastAlarmTime = Date.now();
  isTimeoutHandled = false; // 重置超时处理标记
  console.log('报警计时器已重置');
}

/**
 * 获取计时器状态
 * @returns {Object} 计时器状态信息
 */
function getTimerStatus() {
  const config = getConfig();
  const now = Date.now();
  const elapsed = now - lastAlarmTime;
  const timeoutInterval = config.httpServer?.timeoutInterval || 60000;
  const isTimeout = elapsed > timeoutInterval;

  // 如果超时且未处理，则推送默认报警数据
  if (isTimeout && !isTimeoutHandled) {
    handleTimeout(config, elapsed, timeoutInterval);
  }

  return {
    interval: timeoutInterval,
    elapsed: elapsed,
    isTimeout: isTimeout,
    lastAlarmTime: new Date(lastAlarmTime).toLocaleString()
  };
}

/**
 * 处理超时情况
 * @param {Object} config - 配置对象
 * @param {number} elapsed - 已经过时间
 */
function handleTimeout(config, elapsed, timeoutInterval) {
  logger.warn(`报警超时: ${elapsed}ms > ${timeoutInterval}ms，推送默认报警数据`, 'Timer');

  // 创建默认报警数据
  const defaultAlarmData = {
    alert_alarm: 0,  // 告警类型
    targetType: 0,   // 目标类型
    areaIds: 0,      // 区域ID
    Time: 0          // 时间
  };

  // 推送默认报警数据
  pushAlarmData(defaultAlarmData)
    .then(response => {
      logger.info(`超时推送结果: ${response}`, 'Timer');
      // 更新报警日志
      module.exports.alarmlogs.data = {
        ...defaultAlarmData,
        time: new Date().toLocaleString(),
        message: '计时器超时自动推送'
      };
    })
    .catch(error => {
      logger.error(`超时推送失败: ${error.message}`, 'Timer');
    });
  
  isTimeoutHandled = true;

  // 设置一个定时器，在一段时间后重置标记，允许再次处理超时
  setTimeout(() => {
    isTimeoutHandled = false;
  }, timeoutInterval);
}

/**
 * 启动报警服务
 * @param {Object} config - 配置对象
 */
function startAlarmService(config) {
  const alarmApp = express();
  alarmApp.use(cookieParser());

  // 处理报警数据推送
  alarmApp.post(config.path, upload.any(), (req, res) => {
    console.log('收到来自Http Client的推送');
    // 重置计时器
    resetAlarmTimer();

    let alarmData;
    try {
      alarmData = JSON.parse(req.body.alarm_info);
    } catch (err) {
      logger.error('JSON 解析失败', 'HttpServer');
      return res.status(400).send('Invalid JSON');
    }

    const alarmInfo = dispatchAlarm(alarmData);
    logger.info('收到来自Http Client的推送', 'HttpServer');
    resetAlarmTimer();
    const response = pushAlarmData(alarmInfo);
    logger.info(response, 'HttpServer');

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
    logger.info('正在关闭旧的HTTP Server服务...', 'HttpServer');
    alarmServer.close(err => {
      if (err) {
        logger.error(`关闭旧服务器失败: ${err.message}`, 'HttpServer');
        return;
      }
      logger.info('HTTP Server服务已关闭', 'HttpServer');

      // 启动新服务器
      startNewAlarmServer(alarmApp, config);
    });
  } else {
    // 直接启动新服务器
    startNewAlarmServer(alarmApp, config);
  }
}

/**
 * 启动新的报警服务器
 * @param {Object} app - express实例
 * @param {Object} config - 配置对象
 */
function startNewAlarmServer(app, config) {
  alarmServer = http.createServer(app);
  alarmServer.listen(config.port, () => {
    logger.info(`HTTP Server服务启动: http://localhost:${config.port}${config.path}`, 'HttpServer');

    // 初始化计时器
    resetAlarmTimer();

    // 添加计时器检查路由
    app.get('/alarm-timer-status', (req, res) => {
      const status = getTimerStatus();
      res.json(status);
      
      // 如果超时，记录日志
      if (status.isTimeout) {
        logger.warn(`报警超时: ${status.elapsed}ms > ${status.interval}ms`, 'Timer');
      }
    });

    // 设置定时检查计时器状态
    if (alarmTimer) {
      clearInterval(alarmTimer);
    }

    alarmTimer = setInterval(() => {
      const status = getTimerStatus();
      if (status.isTimeout) {
        logger.warn(`定时检查: 报警超时 ${status.elapsed}ms > ${status.interval}ms`, 'Timer');
      }
    }, 10000); // 每10秒检查一次

    // 添加获取超时状态的路由
    app.get('/alarm-timeout-status', (req, res) => {
      const status = getTimerStatus();
      res.json({
        isTimeout: status.isTimeout,
        elapsed: status.elapsed,
        interval: status.interval
      });
    });
  });

  // 处理服务器错误
  alarmServer.on('error', (err) => {
    logger.error(`HTTP Server服务启动失败: ${err.message}`, 'HttpServer');
  });
}

/**
 * 获取报警服务器实例
 * @returns {Object} 报警服务器实例
 */
function getAlarmServer() {
  return alarmServer;
}