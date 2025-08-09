function handleAlertAlarm(subtype, data) {
  switch (subtype) {
    case "LEAVE_POST":
      console.log("离岗报警处理:", data);
      break;
    case "FIGHT":
      console.log("打斗报警处理:", data);
      break;
    default:
      console.log("未定义的警戒仓子类型:", subtype);
  }
}

module.exports = handleAlertAlarm;
