const axios = require("axios");

// 推送地址（你可以替换为实际目标服务器地址）
const TARGET_URL = "http://172.26.32.158:10063/http/rest";

async function pushAlarmData(data) {
  try {
    const response = await axios.post(TARGET_URL, data, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("推送成功:", response.status);
  } catch (error) {
    console.error("推送失败:", error.message);
  }
}

module.exports = { pushAlarmData };
