const alarmTypeDictionary = {
  alert_alarm: {
    LEAVE_POST: "离岗告警",
    FIGHT: "打斗告警",
    ELECTRIC_BIKE_IN_ELEVATOR: "电动车入梯告警",
    EXIT: "出口告警",
    PARK: "停车告警",
    RETROGRADE: "逆行告警",
    PERSON_OVER_QUERYING: "人数超限告警",
    PERSON_LESS_QUERYING: "人数不足告警",
    GATHERING: "人员聚集告警",
    SMOKING: "抽烟告警",
    RUNCALL: "边跑边打电话告警",
    FALL: "摔倒告警",
    WATCH_PHONE: "玩手机告警",
    SLEEP: "睡觉告警",
    HOLDWEAPON: "持械告警",
    COLLISION: "碰撞告警",
    INTRUSION: "入侵告警",
    TRIPWIRE: "越线告警",
    OVERWALL: "翻越告警",
    CLIMB: "攀爬告警",
    WANDER: "徘徊告警"
  },

  goods_alarm: {
    SUNDRY_DETECT: "杂物检测",
    GOODS_FORGET: "物品遗留",
    GOODS_GUARD: "物品看护"
  },

  headcount_alarm: {
    MAX_NUMBER_PEOPLE: "人数超限告警",
    CROSS_LINE: "越线告警"
  },

  safety_alarm: {
    SAFETY_CAP: "安全帽告警",
    SAFETY_UNIFORM: "安全工服告警",
    SAFETY_BELT: "安全带告警",
    REFLECTIVE_VEST: "反光背心告警",
    RESPIRATOR: "口罩告警",
    FIRE: "明火告警",
    SMOKE: "烟雾告警",
    OIL_SPILL: "漏油告警",
    FIRE_EQUIPMENT: "消防器材告警"
  },

  fire_alarm: {
    FIRE: "明火告警",
    SMOKE: "烟雾告警",
    FIRE_EQUIPMENT: "消防器材告警",
    EXPOSED_GARBAGE: "裸露垃圾告警",
    OVERFLOWED_GARBAGE: "垃圾溢出告警"
  },

  gkpw_alarm: {
    FALLING_GOODS: "高空抛物告警"
  },

  diagnosis_alarm: {
    IMAGE_COVER_ALERT: "画面遮挡告警"
  },

  mclz_alarm: {
    CHEF_CLOTH: "厨师服告警",
    CHEF_HAT: "厨师帽告警",
    CHEF_RESPIRATOR: "厨师口罩告警",
    RUBBER_GLOVE: "橡胶手套告警",
    TRASHBIN: "垃圾桶告警",
    MICE: "老鼠告警"
  },

  sdwe_alarm: {
    FIRE: "明火告警",
    SMOKE: "烟雾告警",
    FIRE_EQUIPMENT: "消防器材告警",
    INDICATOR_FLAG: "指示旗告警",
    OIL_PIPE: "油管告警",
    OIL_SPILL: "漏油告警",
    OIL_GUN_DRAG: "油枪拖拽告警",
    OILPUMP_DOOR_OPEN: "油泵门打开告警",
    OIL_TRUCK: "油罐车告警"
  },

  city_alarm: {
    EXPOSED_GARBAGE: "裸露垃圾告警",
    HAWKER: "流动摊贩告警",
    OUTSTORE: "店外经营告警",
    ROADSIDE: "路边堆物告警",
    SUNDRYSTACK: "杂物堆放告警",
    MUCK: "渣土告警",
    OUTDOOR_ADV: "户外广告告警",
    WATERGATHER: "积水告警",
    MUCK_TRUCK: "渣土车告警",
    OPENED_MUCKTRUCK: "渣土车未密闭告警"
  }
};

module.exports = alarmTypeDictionary;
