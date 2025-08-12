const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config/config.json");


let config = {
    twinID: "vispackstream",
    username: "admin",
    password: "123456",
    port: 3000,
    path: "/alarm",
    targetUrl: "http://192.168.1.100:8080/alarm",
};
//加载配置文件
function loadConfig() {
    //如果有配置文件，加载配置文件
    if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath);
        config = JSON.parse(raw);
    }
    //如果没有配置文件，创建一个
    if (!fs.existsSync(configPath)) {
        saveConfig();
    }
}

//保存配置文件
function saveConfig() {
    //先删除旧文件
    if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

//更新配置文件
function updateConfig(newConfig) {
    config = { ...config, ...newConfig };
    saveConfig();
}

function getConfig() {
    return config;
}

loadConfig();

module.exports = { updateConfig, getConfig };
