export const GASES = [
  {
    "id": "N2",
    "formula": "N₂",
    "name": {
      "en": "Nitrogen",
      "zh": "氮氣"
    },
    "color": "#9fc3fa"
  },
  {
    "id": "O2",
    "formula": "O₂",
    "name": {
      "en": "Oxygen",
      "zh": "氧氣"
    },
    "color": "#8ee0c9"
  },
  {
    "id": "CO2",
    "formula": "CO₂",
    "name": {
      "en": "Carbon dioxide",
      "zh": "二氧化碳"
    },
    "color": "#c1b0eb"
  },
  {
    "id": "Ar",
    "formula": "Ar",
    "name": {
      "en": "Argon",
      "zh": "氬氣"
    },
    "color": "#f6d685"
  },
  {
    "id": "Ne",
    "formula": "Ne",
    "name": {
      "en": "Neon",
      "zh": "氖氣"
    },
    "color": "#ffa086"
  },
  {
    "id": "He",
    "formula": "He",
    "name": {
      "en": "Helium",
      "zh": "氦氣"
    },
    "color": "#f3b8d8"
  }
];
export const MISSIONS = [
  {
    "id": "cryo",
    "gas": "N2",
    "n": 1,
    "icon": "❄",
    "color": "#9fc3fa",
    "place": {
      "en": "Cold-storage lab",
      "zh": "低溫儲存實驗室"
    },
    "source": "https://periodic-table.rsc.org/element/7/nitrogen",
    "title": {
      "en": "Cold storage",
      "zh": "低溫保存"
    },
    "task": {
      "en": "Which gas is used as a liquid to freeze and store samples?",
      "zh": "哪種氣體的液態形式可用來冷凍保存樣本？"
    },
    "use": {
      "en": "Liquid nitrogen is used to freeze and store samples.",
      "zh": "液態氮用來冷凍保存樣本。"
    }
  },
  {
    "id": "oxygen",
    "gas": "O2",
    "n": 2,
    "icon": "✚",
    "color": "#8ee0c9",
    "place": {
      "en": "City clinic",
      "zh": "城市診所"
    },
    "source": "https://periodic-table.rsc.org/element/8/oxygen",
    "title": {
      "en": "Help a patient breathe",
      "zh": "幫助病人呼吸"
    },
    "task": {
      "en": "Which gas helps patients breathe?",
      "zh": "哪種氣體用來幫助病人呼吸？"
    },
    "use": {
      "en": "Oxygen is supplied to patients to help them breathe.",
      "zh": "氧氣供應給病人，幫助呼吸。"
    }
  },
  {
    "id": "ice",
    "gas": "CO2",
    "n": 3,
    "icon": "▱",
    "color": "#c1b0eb",
    "place": {
      "en": "Cloud theatre",
      "zh": "雲霧劇場"
    },
    "source": "https://edu.rsc.org/experiments/floating-and-sinking-bubbles/827.article",
    "title": {
      "en": "Make stage fog",
      "zh": "製造舞台雲霧"
    },
    "task": {
      "en": "Dry ice makes fog effects. Which gas is it made from?",
      "zh": "乾冰用來製造雲霧。它是哪種氣體的固態形式？"
    },
    "use": {
      "en": "Solid carbon dioxide (dry ice) is used for cooling and fog effects.",
      "zh": "固態二氧化碳（乾冰）用來冷卻及製造雲霧。"
    }
  },
  {
    "id": "fire",
    "gas": "CO2",
    "n": 4,
    "icon": "♨",
    "color": "#ffa086",
    "place": {
      "en": "Fire station",
      "zh": "消防站"
    },
    "source": "https://edu.rsc.org/primary-science/irreversible-changes-and-the-fire-extinguisher/4013613.article",
    "title": {
      "en": "Put out a fire",
      "zh": "撲滅火焰"
    },
    "task": {
      "en": "Which gas is used in fire extinguishers?",
      "zh": "哪種氣體用於滅火筒？"
    },
    "use": {
      "en": "Carbon dioxide is used in fire extinguishers.",
      "zh": "二氧化碳用於滅火筒。"
    }
  },
  {
    "id": "bulb",
    "gas": "Ar",
    "n": 5,
    "icon": "☀",
    "color": "#f6d685",
    "place": {
      "en": "Light workshop",
      "zh": "燈泡工房"
    },
    "source": "https://periodic-table.rsc.org/element/18/argon",
    "title": {
      "en": "Light bulb workshop",
      "zh": "燈泡工房"
    },
    "task": {
      "en": "Which gas is used to fill light bulbs?",
      "zh": "哪種氣體用來填充燈泡？"
    },
    "use": {
      "en": "Argon is used to fill incandescent light bulbs.",
      "zh": "氬氣用來填充白熾燈泡。"
    }
  },
  {
    "id": "neon",
    "gas": "Ne",
    "n": 6,
    "icon": "✦",
    "color": "#ff9e87",
    "place": {
      "en": "Sign street",
      "zh": "招牌大街"
    },
    "source": "https://periodic-table.rsc.org/element/10/neon",
    "title": {
      "en": "Light up a sign",
      "zh": "點亮招牌"
    },
    "task": {
      "en": "Which gas is used in glowing advertising signs?",
      "zh": "哪種氣體用於發光廣告招牌？"
    },
    "use": {
      "en": "Neon is used in advertising signs.",
      "zh": "氖氣用於廣告招牌。"
    }
  },
  {
    "id": "balloon",
    "gas": "He",
    "n": 7,
    "icon": "◉",
    "color": "#f3b8d8",
    "place": {
      "en": "Balloon park",
      "zh": "氣球公園"
    },
    "source": "https://periodic-table.rsc.org/element/2/helium",
    "title": {
      "en": "Float a balloon",
      "zh": "讓氣球飄浮"
    },
    "task": {
      "en": "Which gas is used to fill floating balloons?",
      "zh": "哪種氣體用來充填飄浮氣球？"
    },
    "use": {
      "en": "Helium is used to fill floating balloons.",
      "zh": "氦氣用來充填飄浮氣球。"
    }
  }
];
