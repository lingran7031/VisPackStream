const { classifyAlarm } = require("./alarmTypes");
const alarmTypeMap = require("./alarmTypeDictionary.js");

function dispatchAlarm(data) {
    const alarmMajor = data?.additional?.alarm_major;
    const alarmMinor = data?.additional?.alarm_minor;
    const alarmTypeCN = alarmTypeMap[alarmMajor]?.[alarmMinor] || "未知告警";
    const areaIds = data.warehouseV20Events?.alarmEvents?.[0]?.areaIds || [];
    const targets = data.warehouseV20Events?.alarmEvents?.[0]?.targets || [];
    const targetType = targets.length > 0 ? targets.map(t => t.targetType).join(", ") : "无目标对象";
    const timestamp = data.warehouseV20Events?.pts;
    const captureTime = new Date(timestamp).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
    const result = classifyAlarm(alarmMajor, alarmMinor);
    if (!result.valid) {
        console.warn("报警分类失败:", result.reason);
    } return {
        alert_alarm: alarmTypeCN,//告警类型
        targetType: targetType,//目标类型
        areaIds: areaIds.join(", "),//区域ID
        Time: captureTime,//时间
    };
}

module.exports = dispatchAlarm;
