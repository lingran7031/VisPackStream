const AlarmTypeEnum = {
  alert_alarm: [
    "LEAVE_POST", "FIGHT", "ELECTRIC_BIKE_IN_ELEVATOR", "EXIT", "PARK", "RETROGRADE",
    "PERSON_OVER_QUERYING", "PERSON_LESS_QUERYING", "GATHERING", "SMOKING", "RUNCALL",
    "FALL", "WATCH_PHONE", "SLEEP", "HOLDWEAPON", "COLLISION", "INTRUSION", "TRIPWIRE",
    "OVERWALL", "CLIMB", "WANDER"
  ],
  goods_alarm: ["SUNDRY_DETECT", "GOODS_FORGET", "GOODS_GUARD"],
  headcount_alarm: ["MAX_NUMBER_PEOPLE", "CROSS_LINE"],
  safety_alarm: ["SAFETY_CAP", "SAFETY_UNIFORM", "SAFETY_BELT", "REFLECTIVE_VEST", "RESPIRATOR", "FIRE", "SMOKE", "OIL_SPILL", "FIRE_EQUIPMENT"],
  fire_alarm: ["FIRE", "SMOKE", "FIRE_EQUIPMENT", "EXPOSED_GARBAGE", "OVERFLOWED_GARBAGE"],
  gkpw_alarm: ["FALLING_GOODS"],
  diagnosis_alarm: ["IMAGE_COVER_ALERT"],
  mclz_alarm: ["CHEF_CLOTH", "CHEF_HAT", "CHEF_RESPIRATOR", "RUBBER_GLOVE", "TRASHBIN", "MICE"],
  sdwe_alarm: ["FIRE", "SMOKE", "FIRE_EQUIPMENT", "INDICATOR_FLAG", "OIL_PIPE", "OIL_SPILL", "OIL_GUN_DRAG", "OILPUMP_DOOR_OPEN", "OIL_TRUCK"],
  city_alarm: ["EXPOSED_GARBAGE", "HAWKER", "OUTSTORE", "ROADSIDE", "SUNDRYSTACK", "MUCK", "OUTDOOR_ADV", "WATERGATHER", "MUCK_TRUCK", "OPENED_MUCKTRUCK"]
};

function classifyAlarm(alarmMajor, alarmMinor) {
  if (!AlarmTypeEnum[alarmMajor]) {
    return { valid: false, reason: "未知报警主类型" };
  }

  if (!AlarmTypeEnum[alarmMajor].includes(alarmMinor)) {
    return { valid: false, reason: "报警子类型不属于该主类型" };
  }

  return { valid: true, category: alarmMajor, subtype: alarmMinor };
}

module.exports = { AlarmTypeEnum, classifyAlarm };
