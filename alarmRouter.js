const { classifyAlarm } = require("./alarmTypes");
const handleAlertAlarm = require("./handlers/alertAlarmHandler");
//const handleGoodsAlarm = require("./handlers/goodsAlarmHandler");
// ...其他处理器

const AlarmHandlers = {
    alert_alarm: handleAlertAlarm,
    //goods_alarm: handleGoodsAlarm,
    // ...
};

function dispatchAlarm(data) {
    console.log("断点:", data);
    const alarmMajor = data?.additional?.alarm_major;
    const alarmMinor = data?.additional?.alarm_minor;

    console.log("alarmMajor:", alarmMajor);
    console.log("alarmMinor:", alarmMinor);
    const result = classifyAlarm(alarmMajor, alarmMinor);
    if (!result.valid) {
        console.warn("报警分类失败:", result.reason);
        return;
    }

    const handler = AlarmHandlers[alarmMajor];
    if (handler) {
        handler(alarmMinor, data);
    } else {
        console.warn("未定义的报警主类型处理器:", alarmMajor);
    }
}

module.exports = dispatchAlarm;
