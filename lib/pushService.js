const axios = require("axios");
const { getConfig } = require("./config");
const list = ["alert_alarm", "targetType", "areaIds", "Time"]
const config = getConfig();
// 推送地址（你可以替换为实际目标服务器地址）
const TARGET_URL = config.targetUrl;
async function pushAlarmData(data) {
  console.log(data);
  try {/*
    for (let i = 0; i < list.length; i++) {
      const item = {
        "twinID": config.twinID,
        "metric": list[i],
        "val": data[list[i]],
      }
      //console.log(item);
      const response = await axios.post(TARGET_URL, item, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log(response.status);
      return `推送成功: ${response.status}`
    }*/
   const item = {
    "twinID": config.twinID,
    "metric": "alert_alarm",
    "val": data["alert_alarm"],
    "time": data["Time"]
   }
   const response = await axios.post(TARGET_URL, item, {
    headers: {
      "Content-Type": "application/json"
    }
  });
  console.log(response.status);
  return `推送成功: ${response.status}`
  } catch (error) {
    console.error("推送失败:", error.message);
    return `推送失败: ${error.message}`
  }
}

module.exports = { pushAlarmData };
