const axios = require("axios");
const list = ["alert_alarm", "targetType", "areaIds", "Time"]

// 推送地址（你可以替换为实际目标服务器地址）
const TARGET_URL = "http://172.26.32.158:10063/http/rest";

async function pushAlarmData(data) {
  try {
    for (let i = 0; i < list.length; i++) {
      const item = {
        "twinID": "孪生体ID",
        "metric": list[i],
        "val": data[list[i]],
      }
      console.log(item);
      const response = await axios.post(TARGET_URL, item, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log("推送成功:", response.status);
    }
  } catch (error) {
    console.error("推送失败:", error.message);
  }
}

module.exports = { pushAlarmData };
