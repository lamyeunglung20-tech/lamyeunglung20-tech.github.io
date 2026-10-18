const p=(en,zh)=>({en,zh});
export const TOPICS=[
{id:'oxygen',name:p('Oxygen','氧氣'),icon:'●',color:'#72c5bb',correct:['more','less'],levels:[.8,.58],fact:p('Exhaled air has less oxygen.','呼出的空氣含較少氧氣。'),hint:p('Your body uses some oxygen.','身體會使用部分氧氣。')},
{id:'carbon',name:p('Carbon dioxide','二氧化碳'),icon:'✦',color:'#b4a0de',correct:['less','more'],levels:[.08,.65],fact:p('Exhaled air has more carbon dioxide.','呼出的空氣含較多二氧化碳。'),hint:p('Your body releases carbon dioxide.','身體會排出二氧化碳。')},
{id:'water',name:p('Water vapour','水蒸氣'),icon:'◈',color:'#74b5e1',correct:['less','more'],levels:[.25,.8],fact:p('Exhaled air has more water vapour.','呼出的空氣含較多水蒸氣。'),hint:p('Air picks up moisture in your airways.','空氣在呼吸道中會吸收水分。')},
{id:'temperature',name:p('Temperature','溫度'),icon:'☀',color:'#f2b570',correct:['lower','higher'],levels:[.3,.8],fact:p('Exhaled air is warmer.','呼出的空氣溫度較高。'),hint:p('Your body warms the air.','身體會使空氣變暖。')}
];
export const WORDS={more:p('More','較多'),less:p('Less','較少'),higher:p('Higher','較高'),lower:p('Lower','較低')};
