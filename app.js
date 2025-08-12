const express = require("express");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const pathModule = require("path");
const os = require("os");
const osUtils = require("os-utils");
const http = require("http");

const { pushAlarmData } = require("./lib/pushService");
const dispatchAlarm = require("./lib/alarmRouter");
const { getConfig, updateConfig } = require("./lib/config");

const upload = multer();
let alarmServer = null;
const alarmLogs = [];

function startAlarmService(config) {
  const alarmApp = express();
  alarmApp.use(cookieParser());

  alarmApp.post(config.path, upload.any(), (req, res) => {
    let alarmData;
    try {
      alarmData = JSON.parse(req.body.alarm_info);
    } catch (err) {
      alarmLogs.unshift({ time: new Date().toLocaleString(), data: "JSON 解析失败" });
      if (alarmLogs.length > 20) alarmLogs.pop();
      return res.status(400).send("Invalid JSON");
    }

    const alarmInfo = dispatchAlarm(alarmData);
    pushAlarmData(alarmInfo);

    alarmLogs.unshift({ time: new Date().toLocaleString(), data: alarmInfo });
    if (alarmLogs.length > 20) alarmLogs.pop();
    res.status(200).send("success");
  });

  if (alarmServer) {
    alarmServer.close(() => alarmLogs.unshift({ time: new Date().toLocaleString(), data: "旧报警服务已关闭" }));
    if (alarmLogs.length > 20) alarmLogs.pop();

  }

  alarmServer = http.createServer(alarmApp);
  alarmServer.listen(config.port, () => {
    alarmLogs.unshift({ time: new Date().toLocaleString(), data: `报警服务启动: http://localhost:${config.port}${config.path}` });
    if (alarmLogs.length > 20) alarmLogs.pop();
  });
}

startAlarmService(getConfig());

const webApp = express();
webApp.use(cookieParser());
webApp.use(bodyParser.urlencoded({ extended: true }));
webApp.use(bodyParser.json());
webApp.use(express.static(pathModule.join(__dirname, "www")));
webApp.use(session({
  secret: "alarm-secret",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 }
}));

function requireAuth(req, res, next) {
  if (req.session?.authenticated) return next();

  // 对 HTML 页面请求，重定向
  if (req.originalUrl.endsWith(".html")) {
    return res.redirect("/login.html");
  }

  // 对 API 请求，返回 JSON
  res.status(401).json({ error: "未登录或会话已过期" });
}


webApp.get("/", (req, res) => {
  res.redirect(req.session?.authenticated ? "/index.html" : "/login.html");
});

webApp.post("/login", (req, res) => {
  const { username, password, remember } = req.body;
  const config = getConfig();
  if (username === config.username && password === config.password) {
    req.session.authenticated = true;
    req.session.username = username;
    if (remember) req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    res.redirect("/index.html");
    alarmLogs.unshift({ time: new Date().toLocaleString(), data: "登录成功" });
    if (alarmLogs.length > 20) alarmLogs.pop();
  } else {
    res.send("登录失败，请检查用户名和密码");
    alarmLogs.unshift({ time: new Date().toLocaleString(), data: "登录失败" });
    if (alarmLogs.length > 20) alarmLogs.pop();

  }
});

webApp.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});

webApp.get("/user-info", requireAuth, (req, res) => {
  res.json({ username: req.session.username });
});

webApp.get("/get-config", requireAuth, (req, res) => {
  res.json(getConfig());
});

webApp.post("/update-config", requireAuth, (req, res) => {
  const { port, path, targetUrl } = req.body;
  updateConfig({ port: parseInt(port), path, targetUrl });
  res.status(200).send("ok");
});

webApp.post("/update-config-restart", requireAuth, (req, res) => {
  const { port, path, targetUrl } = req.body;
  const newConfig = { port: parseInt(port), path, targetUrl };
  updateConfig(newConfig);
  res.status(200).send("ok");
  alarmLogs.unshift({ time: new Date().toLocaleString(), data: "配置已更新，正在热重载报警服务..." });
  if (alarmLogs.length > 20) alarmLogs.pop();
  startAlarmService(newConfig);
});

webApp.get("/config.html", requireAuth, (req, res) => {
  res.sendFile(pathModule.join(__dirname, "www", "config.html"));
});

webApp.get("/index.html", requireAuth, (req, res) => {
  res.sendFile(pathModule.join(__dirname, "www", "index.html"));
});

webApp.get("/system-info", requireAuth, (req, res) => {
  const config = getConfig();
  osUtils.cpuUsage(cpu => {
    res.json({
      ip: getLocalIP(),
      port: config.port,
      path: config.path,
      targetUrl: config.targetUrl,
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      },
      cpu: (cpu * 100).toFixed(2)
    });
  });
});

webApp.get("/alarm-log", requireAuth, (req, res) => {
  res.json(alarmLogs);
});

webApp.listen(80, () => {
  console.info("网页控制台已启动: http://localhost/index.html");
  alarmLogs.unshift({ time: new Date().toLocaleString(), data: "网页控制台已启动" });
  if (alarmLogs.length > 20) alarmLogs.pop();
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}
