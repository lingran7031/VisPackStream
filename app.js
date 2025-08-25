const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const pathModule = require('path');
const os = require('os');
const osUtils = require('os-utils');
const packageInfo = require('./package.json'); 
const fs = require('fs');
const { exec } = require('child_process');
// 引入HttpServer模块
const HttpServer = require('./lib/HttpServer');
const { getConfig, updateConfig } = require('./lib/config');
// 引入日志模块
const logger = require('./lib/Logger');

// 启动报警服务
HttpServer.startAlarmService(getConfig());

// 创建Web应用
const webApp = express();
webApp.use(cookieParser());
webApp.use(bodyParser.urlencoded({ extended: true }));
webApp.use(bodyParser.json());
webApp.use(express.static(pathModule.join(__dirname, 'www')));
webApp.use(session({
  secret: 'alarm-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 }
}));

// 身份验证中间件
function requireAuth(req, res, next) {
  if (req.session?.authenticated) return next();
  // 对 HTML 页面请求，重定向
  if (req.originalUrl.endsWith('.html')) {
    return res.redirect('/login.html');
  }
  // 对 API 请求，返回 JSON
  res.status(401).json({ error: '未登录或会话已过期' });
}

// 路由定义
webApp.get('/', (req, res) => {
  res.redirect(req.session?.authenticated ? '/index.html' : '/login.html');
});

webApp.post('/login', (req, res) => {
  const { username, password, remember } = req.body;
  const config = getConfig();
  if (username === config.username && password === config.password) {
    req.session.authenticated = true;
    req.session.username = username;
    if (remember) req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    res.redirect('/index.html');
    logger.info('登录成功', 'Auth');
  } else {
    res.send('登录失败，请检查用户名和密码');
    logger.warn('登录失败', 'Auth');
  }
});

webApp.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

webApp.get('/user-info', requireAuth, (req, res) => {
  res.json({ username: req.session.username });
});

// 获取报警日志
webApp.get('/alarm-log', requireAuth, (req, res) => {
  res.json(HttpServer.alarmlogs);
});

// 添加计时器状态API
webApp.get('/alarm-timer-status', requireAuth, (req, res) => {
  const HttpServer = require('./lib/HttpServer');
  const status = HttpServer.getTimerStatus();
  res.json(status);
});

// 网络配置相关接口
webApp.get('/get-config', requireAuth, (req, res) => {
  res.json(getConfig());
});



webApp.post('/update-config', requireAuth, (req, res) => {
  // 解析表单数据
  const formData = req.body;
  const newConfig = {};
  
  // 处理基本配置
  if (formData.port) newConfig.port = parseInt(formData.port);
  if (formData.path) newConfig.path = formData.path;
  if (formData.targetUrl) newConfig.targetUrl = formData.targetUrl;
  if (formData.twinID) newConfig.twinID = formData.twinID;
  if (formData.username) newConfig.username = formData.username;
  if (formData.password) newConfig.password = formData.password;
  
  // 处理嵌套的httpServer配置
  if (formData['httpServer.timeoutInterval']) {
    if (!newConfig.httpServer) newConfig.httpServer = {};
    newConfig.httpServer.timeoutInterval = parseInt(formData['httpServer.timeoutInterval']);
  }
  
  updateConfig(newConfig);
  res.status(200).send('ok');
});

webApp.post('/update-config-restart', requireAuth, (req, res) => {
  // 解析表单数据
  const formData = req.body;
  const newConfig = {};
  
  // 处理基本配置
  if (formData.port) newConfig.port = parseInt(formData.port);
  if (formData.path) newConfig.path = formData.path;
  if (formData.targetUrl) newConfig.targetUrl = formData.targetUrl;
  if (formData.twinID) newConfig.twinID = formData.twinID;
  if (formData.username) newConfig.username = formData.username;
  if (formData.password) newConfig.password = formData.password;
  
  // 处理嵌套的httpServer配置
  if (formData['httpServer.timeoutInterval']) {
    if (!newConfig.httpServer) newConfig.httpServer = {};
    newConfig.httpServer.timeoutInterval = parseInt(formData['httpServer.timeoutInterval']);
  }
  
  updateConfig(newConfig);
  res.status(200).send('ok');
  logger.info('配置已更新，正在热重载报警服务...', 'Config');
  HttpServer.startAlarmService(newConfig);
});

webApp.get('/config.html', requireAuth, (req, res) => {
  res.sendFile(pathModule.join(__dirname, 'www', 'config.html'));
});

webApp.get('/index.html', requireAuth, (req, res) => {
  res.sendFile(pathModule.join(__dirname, 'www', 'index.html'));
});

// 添加logs.html路由
webApp.get('/logs.html', requireAuth, (req, res) => {
  res.sendFile(pathModule.join(__dirname, 'www', 'logs.html'));
});

// 添加network.html路由
webApp.get('/network.html', requireAuth, (req, res) => {
  res.sendFile(pathModule.join(__dirname, 'www', 'network.html'));
});

webApp.get('/system-info', requireAuth, (req, res) => {
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
      cpu: (cpu * 100).toFixed(2),
      version: packageInfo.version // 添加这一行
    });
  });
});

webApp.get('/info-log', requireAuth, (req, res) => {
  res.json(logger.getLogs());
});

webApp.get('/alarm-log', requireAuth, (req, res) => {
  res.json(HttpServer.alarmlogs);
});

// 网络配置相关接口
// 获取当前网络配置
webApp.get('/get-network-config', requireAuth, (req, res) => {
  try {
    // 读取网络接口配置文件
    const interfacesPath = '/etc/network/interfaces';
    let interfacesContent = '';
    
    try {
      interfacesContent = fs.readFileSync(interfacesPath, 'utf8');
    } catch (err) {
      logger.warn('无法读取网络配置文件: ' + err.message, 'Network');
    }
    
    // 解析配置文件
    const config = parseNetworkConfig(interfacesContent);
    
    // 获取当前网络状态
    exec('ip addr show eth0 && ip route show default', (error, stdout, stderr) => {
      const current = parseCurrentNetworkStatus(stdout);
      
      res.json({
        ...config,
        current: current
      });
    });
  } catch (err) {
    logger.error('获取网络配置失败: ' + err.message, 'Network');
    res.status(500).json({ error: '获取网络配置失败' });
  }
});

// 更新网络配置
webApp.post('/update-network-config', requireAuth, (req, res) => {
  try {
    const { configType, ipAddress, netmask, gateway, dnsServers } = req.body;
    
    let interfacesContent;
    
    if (configType === 'dhcp') {
      interfacesContent = generateDHCPConfig();
    } else if (configType === 'static') {
      if (!ipAddress || !netmask || !gateway) {
        return res.status(400).json({ success: false, message: '静态IP配置缺少必要参数' });
      }
      interfacesContent = generateStaticConfig(ipAddress, netmask, gateway, dnsServers);
    } else {
      return res.status(400).json({ success: false, message: '无效的配置类型' });
    }
    
    // 备份原配置文件
    const interfacesPath = '/etc/network/interfaces';
    const backupPath = '/etc/network/interfaces.backup';
    
    try {
      if (fs.existsSync(interfacesPath)) {
        fs.copyFileSync(interfacesPath, backupPath);
      }
    } catch (err) {
      logger.warn('备份网络配置文件失败: ' + err.message, 'Network');
    }
    
    // 写入新配置
    fs.writeFileSync(interfacesPath, interfacesContent);
    
    // 重启网络服务
    exec('systemctl restart networking', (error, stdout, stderr) => {
      if (error) {
        logger.error('重启网络服务失败: ' + error.message, 'Network');
        // 恢复备份
        try {
          if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, interfacesPath);
          }
        } catch (restoreErr) {
          logger.error('恢复网络配置失败: ' + restoreErr.message, 'Network');
        }
        return res.status(500).json({ success: false, message: '重启网络服务失败: ' + error.message });
      }
      
      logger.info('网络配置已更新', 'Network');
      res.json({ success: true, message: '网络配置已更新' });
    });
    
  } catch (err) {
    logger.error('更新网络配置失败: ' + err.message, 'Network');
    res.status(500).json({ success: false, message: '更新网络配置失败: ' + err.message });
  }
});

// 重启网络服务
webApp.post('/restart-network', requireAuth, (req, res) => {
  exec('systemctl restart networking', (error, stdout, stderr) => {
    if (error) {
      logger.error('重启网络服务失败: ' + error.message, 'Network');
      return res.status(500).json({ success: false, message: '重启网络服务失败: ' + error.message });
    }
    
    logger.info('网络服务已重启', 'Network');
    res.json({ success: true, message: '网络服务已重启' });
  });
});

// 启动Web服务器
webApp.listen(80, () => {
  logger.info('网页控制台已启动: http://localhost/index.html', 'WebServer');
});

/**
 * 获取本地IP地址
 * @returns {string} IP地址
 */
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

/**
 * 解析网络配置文件
 * @param {string} content - 配置文件内容
 * @returns {object} 解析后的配置
 */
function parseNetworkConfig(content) {
  const config = {
    type: 'dhcp',
    ip: '',
    netmask: '',
    gateway: '',
    dns: ''
  };
  
  if (!content) return config;
  
  const lines = content.split('\n');
  let inEth0Section = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('iface eth0')) {
      inEth0Section = true;
      if (trimmed.includes('static')) {
        config.type = 'static';
      } else if (trimmed.includes('dhcp')) {
        config.type = 'dhcp';
      }
    } else if (inEth0Section && trimmed.startsWith('iface ')) {
      inEth0Section = false;
    } else if (inEth0Section) {
      if (trimmed.startsWith('address ')) {
        config.ip = trimmed.split(' ')[1];
      } else if (trimmed.startsWith('netmask ')) {
        config.netmask = trimmed.split(' ')[1];
      } else if (trimmed.startsWith('gateway ')) {
        config.gateway = trimmed.split(' ')[1];
      } else if (trimmed.startsWith('dns-nameservers ')) {
        config.dns = trimmed.substring('dns-nameservers '.length);
      }
    }
  }
  
  return config;
}

/**
 * 解析当前网络状态
 * @param {string} output - ip命令输出
 * @returns {object} 当前网络状态
 */
function parseCurrentNetworkStatus(output) {
  const status = {
    ip: '未知',
    netmask: '未知',
    gateway: '未知',
    dns: '未知'
  };
  
  if (!output) return status;
  
  // 解析IP地址和子网掩码
  const ipMatch = output.match(/inet (\d+\.\d+\.\d+\.\d+)\/(\d+)/);
  if (ipMatch) {
    status.ip = ipMatch[1];
    // 将CIDR转换为子网掩码
    const cidr = parseInt(ipMatch[2]);
    status.netmask = cidrToNetmask(cidr);
  }
  
  // 解析网关
  const gatewayMatch = output.match(/default via (\d+\.\d+\.\d+\.\d+)/);
  if (gatewayMatch) {
    status.gateway = gatewayMatch[1];
  }
  
  // 读取DNS配置
  try {
    const resolvConf = fs.readFileSync('/etc/resolv.conf', 'utf8');
    const dnsServers = [];
    const dnsMatches = resolvConf.match(/nameserver\s+(\d+\.\d+\.\d+\.\d+)/g);
    if (dnsMatches) {
      dnsMatches.forEach(match => {
        const server = match.split(/\s+/)[1];
        dnsServers.push(server);
      });
      status.dns = dnsServers.join(', ');
    }
  } catch (err) {
    // 忽略DNS读取错误
  }
  
  return status;
}

/**
 * CIDR转子网掩码
 * @param {number} cidr - CIDR值
 * @returns {string} 子网掩码
 */
function cidrToNetmask(cidr) {
  const mask = (0xffffffff << (32 - cidr)) >>> 0;
  return [
    (mask >>> 24) & 0xff,
    (mask >>> 16) & 0xff,
    (mask >>> 8) & 0xff,
    mask & 0xff
  ].join('.');
}

/**
 * 生成DHCP配置
 * @returns {string} 配置文件内容
 */
function generateDHCPConfig() {
  return `# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

source /etc/network/interfaces.d/*

# The loopback network interface
auto lo
iface lo inet loopback

# The primary network interface
auto eth0
iface eth0 inet dhcp
`;
}

/**
 * 生成静态IP配置
 * @param {string} ip - IP地址
 * @param {string} netmask - 子网掩码
 * @param {string} gateway - 网关
 * @param {string} dns - DNS服务器
 * @returns {string} 配置文件内容
 */
function generateStaticConfig(ip, netmask, gateway, dns) {
  let config = `# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

source /etc/network/interfaces.d/*

# The loopback network interface
auto lo
iface lo inet loopback

# The primary network interface
auto eth0
iface eth0 inet static
    address ${ip}
    netmask ${netmask}
    gateway ${gateway}
`;
  
  if (dns && dns.trim()) {
    config += `    dns-nameservers ${dns.replace(/,/g, ' ').trim()}\n`;
  }
  
  return config;
}
