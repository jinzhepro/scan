import sql from "./db.js";

/**
 * 商品种子数据 - 基于实际商品信息
 */
const sampleProducts = [
  {
    name: "安格琪玻尿酸芦荟补水凝胶",
    barcode: "8809554022597",
    stock: 17,
    expiry_date: "2027.11",
    price: 12,
  },
  {
    name: "吕含光耀护营润修护套装（400ml洗+护）",
    barcode: "8809539443058",
    stock: 6,
    expiry_date: "2027.01",
    price: 69.9,
  },
  {
    name: "吕滋养韧发密集强韧套装(400ml洗+护)",
    barcode: "8809539443003",
    stock: 4,
    expiry_date: "2027.03",
    price: 79.9,
  },
  {
    name: "安宝笛快乐微风香水沐浴露(黑紫）",
    barcode: "8801051130669",
    stock: 12,
    expiry_date: "2027.05",
    price: 19.9,
  },
  {
    name: "安宝笛浪漫邂逅丝绒香水身体乳（紫）400ml",
    barcode: "8801051452204",
    stock: 13,
    expiry_date: "2026.10",
    price: 29.9,
  },
  {
    name: "竹盐精品保湿香皂3块装",
    barcode: "6921469880054",
    stock: 11,
    expiry_date: "2026.10",
    price: 9.9,
  },
  {
    name: "倍瑞傲派缤牙膏（沁橙亮妍）",
    barcode: "8801051065602",
    stock: 7,
    expiry_date: "2026.11",
    price: 25,
  },
  {
    name: "睿嫣润膏经典舒盈臻护洗发水250ml",
    barcode: "8801051239447",
    stock: 16,
    expiry_date: "2026.10",
    price: 21.9,
  },
  {
    name: "爱敬科娜洗丝洗护沐浴套装（洗发600+护发600+沐浴露500）",
    barcode: "8801046358467",
    stock: 8,
    expiry_date: "2026.12",
    price: 79.9,
  },
  {
    name: "爱敬科娜洗丝优雅香氛洗护套装（洗发600+护发600+洗发200）",
    barcode: "8801046358450",
    stock: 8,
    expiry_date: "2026.09",
    price: 59,
  },
  {
    name: "爱敬科娜洗丝受损强韧香氛护发精华70ml",
    barcode: "8801046350041",
    stock: 14,
    expiry_date: "2027.01",
    price: 29.9,
  },
  {
    name: "爱敬科娜洗丝经典香氛洗发水 优雅魅力600ml（紫洗）",
    barcode: "8801046329573",
    stock: 16,
    expiry_date: "2026.12",
    price: 29.9,
  },
  {
    name: "爱敬科娜洗丝经典香氛护发素 优雅魅力600ml（紫护）",
    barcode: "8801046329580",
    stock: 16,
    expiry_date: "2027.03",
    price: 29.9,
  },
  {
    name: "爱敬 可希丝男士洗发水（多效清洁型）550ml",
    barcode: "8801046877388",
    stock: 12,
    expiry_date: "2026.11",
    price: 36.9,
  },
  {
    name: "瑞斯美鱼子精萃水凝保湿面膜-89902",
    barcode: "7616378899028",
    stock: 30,
    expiry_date: "2027.01",
    price: 44.9,
  },
  {
    name: "芬浓透润美容液洗发露550ml",
    barcode: "4550516475961",
    stock: 6,
    expiry_date: "2027.03",
    price: 49.9,
  },
  {
    name: "45072-可悠然美肌沐浴露（欣怡幽香）550ml",
    barcode: "4901872836253",
    stock: 4,
    expiry_date: "2027.01",
    price: 39.9,
  },
  {
    name: "45132-惠润沐浴露 淡雅果味香型 650ml",
    barcode: "4901872888757",
    stock: 9,
    expiry_date: "2028.02",
    price: 36.6,
  },
  {
    name: "美迪惠尔水润保湿面膜（升级版）带钢印",
    barcode: "8809470122234",
    stock: 32,
    expiry_date: "2026.01",
    price: 29.9,
  },
  {
    name: "宫中秘策 面部乳液",
    barcode: "8809278713245",
    stock: 8,
    expiry_date: "2026.01",
    price: 25,
  },
  {
    name: "宫中秘策肤律倍贝6件套",
    barcode: "8809278716673",
    stock: 5,
    expiry_date: "2026.07",
    price: 149,
  },
  {
    name: "咖思美马油洗发液",
    barcode: "4513574012752",
    stock: 3,
    expiry_date: "2028.01",
    price: 39.9,
  },
  {
    name: "咖思美马油护发素",
    barcode: "4513574012769",
    stock: 2,
    expiry_date: "2027.04",
    price: 39.9,
  },
  {
    name: "咖思美马油沐浴露",
    barcode: "4513574015951",
    stock: 3,
    expiry_date: "2027.01",
    price: 39.9,
  },
  {
    name: "小鸡运动鞋布鞋清洁喷雾240ml 90868",
    barcode: "4901070908684",
    stock: 19,
    expiry_date: "2027.07",
    price: 19.9,
  },
  {
    name: "小林室内芳香剂Sawaday Happy9号粉色浪漫花香120g",
    barcode: "4987072088296",
    stock: 9,
    expiry_date: "2028.02",
    price: 9.9,
  },
  {
    name: "小林室内芳香剂sawaday happy 6号柑橘图案柑橘香120g",
    barcode: "4987072088265",
    stock: 7,
    expiry_date: "2026.11",
    price: 9.9,
  },
  {
    name: "未来凯蒂驱蚊液金装（无香型）200ml",
    barcode: "6948597511346",
    stock: 26,
    expiry_date: "2026.03",
    price: 19.9,
  },
  {
    name: "吕舒盈清润净澈控油洗发水特惠装(400ml*2洗发水)",
    barcode: "6930420009823",
    stock: 3,
    expiry_date: "2028.01",
    price: 59.9,
  },
  {
    name: "芬浓透润美容液护发素550ml",
    barcode: "4550516476074",
    stock: 7,
    expiry_date: "2026.04",
    price: 39.9,
  },
  {
    name: "宫中秘策 洗护三件套(润肤乳液+洗发沐浴露+柔肤香皂）",
    barcode: "8809278713689",
    stock: 3,
    expiry_date: "2026.02",
    price: 88,
  },
  {
    name: "花王大白酵素牙膏165g",
    barcode: "4901301024077",
    stock: 26,
    expiry_date: "2027.04",
    price: 8.8,
  },
  {
    name: "水之密语净润臻养洗发露(倍润型)600g",
    barcode: "6926799693008",
    stock: 7,
    expiry_date: "2027.01",
    price: 39.9,
  },
  {
    name: "水之密语净润臻养护发素600g",
    barcode: "6926799693015",
    stock: 8,
    expiry_date: "2027.01",
    price: 39.9,
  },
  {
    name: "香蒲丽保湿焕采防晒霜SPF50+",
    barcode: "8809480783463",
    stock: 23,
    expiry_date: "2027.01",
    price: 63,
  },
  {
    name: "爱敬科娜洗丝经典香氛护发素 浪漫动人",
    barcode: "8801046329603",
    stock: 4,
    expiry_date: "2027.03",
    price: 29.9,
  },
  {
    name: "爱敬科娜洗丝经典香氛洗发水 浪漫动人",
    barcode: "8801046329597",
    stock: 3,
    expiry_date: "2027.04",
    price: 29.9,
  },
  {
    name: "花王洗衣液740g42131（铃兰洋甘菊香）",
    barcode: "4901301421319",
    stock: 17,
    expiry_date: "2027.04",
    price: 22.9,
  },
  {
    name: "花王牌洗衣液1000ml（01057）（衣物彩漂液）",
    barcode: "4901301010575",
    stock: 12,
    expiry_date: "2026.11",
    price: 18.8,
  },
  {
    name: "花王牌衣物漂白剂600ml01724",
    barcode: "4901301017246",
    stock: 20,
    expiry_date: "2027.03",
    price: 12,
  },
  {
    name: "花王牌喷雾洗衣液300ml（25934）（PRO衣物喷雾漂白剂）",
    barcode: "4901301259349",
    stock: 1,
    expiry_date: "2026.01",
    price: 15,
  },
  {
    name: "花王洗衣液460ml42091（艾尔玛羊毛真丝黄色）",
    barcode: "4901301420916",
    stock: 9,
    expiry_date: "2027.02",
    price: 18.8,
  },
  {
    name: "花王洗衣液460ml42248（艾尔玛羊毛真丝粉色）",
    barcode: "4901301422484",
    stock: 9,
    expiry_date: "2027.02",
    price: 18.8,
  },
  {
    name: "花王牌洗衣机槽清洁粉180g（24457）",
    barcode: "4901301244574",
    stock: 14,
    expiry_date: "2027.03",
    price: 15,
  },
  {
    name: "花王牌洗洁精240ml（28856）（本体白色除菌）",
    barcode: "4901301288561",
    stock: 4,
    expiry_date: "2026.03",
    price: 8.9,
  },
  {
    name: "花王牌洗洁精240ml（28841）（本体桔色橙子味）",
    barcode: "4901301288417",
    stock: 1,
    expiry_date: "2026.03",
    price: 8.9,
  },
  {
    name: "花王牌洗洁精240ml（28853）（本体绿色绿茶味）",
    barcode: "4901301288530",
    stock: 1,
    expiry_date: "2026.01",
    price: 8.9,
  },
  {
    name: "花王牌厨房清洁喷雾300ML 27642（餐桌绿茶香）",
    barcode: "4901301276421",
    stock: 5,
    expiry_date: "2026.01",
    price: 15,
  },
  {
    name: "花王牌地板清洁剂400ml03618",
    barcode: "4901301036186",
    stock: 2,
    expiry_date: "2026.04",
    price: 16,
  },
  {
    name: "花王牌玻璃镜面清洁剂400ml(23791)（喷雾）",
    barcode: "4901301237910",
    stock: 3,
    expiry_date: "2026.04",
    price: 16,
  },
  {
    name: "花王牌厨房清洁剂400ml（03615）（油污泡沫喷雾薄荷香型）",
    barcode: "4901301036155",
    stock: 2,
    expiry_date: "2026.04",
    price: 16,
  },
  {
    name: "花王牌厨房清洁剂400ml73380（泡沫漂白喷雾）",
    barcode: "4901301733801",
    stock: 3,
    expiry_date: "2026.04",
    price: 16,
  },
  {
    name: "花王牌浴室清洁剂400ml（22282）卫生间墙体墙壁泡沫除霉）",
    barcode: "4901301222824",
    stock: 11,
    expiry_date: "2027.02",
    price: 18,
  },
  {
    name: "花王牌管道清洁剂500g30745",
    barcode: "4901301307453",
    stock: 5,
    expiry_date: "2027.04",
    price: 16,
  },
  {
    name: "花王牌厕所清洁剂500g 54058（桉树叶香）",
    barcode: "49540581",
    stock: 10,
    expiry_date: "2026.02",
    price: 9.9,
  },
  {
    name: "花王浴室清洁喷雾蓝色无香350ml42652",
    barcode: "4901301426529",
    stock: 2,
    expiry_date: "2027.04",
    price: 19.9,
  },
  {
    name: "花王牌浴室喷雾清洁剂350ml42658（红色玫瑰香）",
    barcode: "4901301426581",
    stock: 4,
    expiry_date: "2027.01",
    price: 19.9,
  },
  {
    name: "花王马桶清洗剂350ml42492（粉色玫瑰花香）",
    barcode: "4901301424921",
    stock: 2,
    expiry_date: "2027.04",
    price: 19.9,
  },
  {
    name: "花王牌喷雾洗衣液300ml40855（衣领净）",
    barcode: "4901301408556",
    stock: 2,
    expiry_date: "2027.04",
    price: 19.9,
  },
  {
    name: "花王牌洗手液240ml41606（柑橘香型绿色）",
    barcode: "4901301416063",
    stock: 1,
    expiry_date: "2026.09",
    price: 15,
  },
  {
    name: "花王牌洗手液240ml41598（无香型蓝色）",
    barcode: "4901301415981",
    stock: 1,
    expiry_date: "2026.01",
    price: 15,
  },
  {
    name: "花王牌香皂130g*3（43023）（柠檬味新码）",
    barcode: "4901301430236",
    stock: 5,
    expiry_date: "2026.09",
    price: 16.9,
  },
  {
    name: "花王牌香皂130g*3（43022）（玫瑰味新码）",
    barcode: "4901301430229",
    stock: 18,
    expiry_date: "2027.04",
    price: 18,
  },
  {
    name: "花王牌香皂130g*3（43021）（牛奶味新码）",
    barcode: "4901301430212",
    stock: 3,
    expiry_date: "2027.04",
    price: 18,
  },
  {
    name: "花王牌卫生巾F系列17cm32片28241（日用）",
    barcode: "4901301282415",
    stock: 9,
    expiry_date: "2027.02",
    price: 16,
  },
  {
    name: "花王牌卫生巾F系列20.5cm24片28240（日用）",
    barcode: "4901301282408",
    stock: 9,
    expiry_date: "2027.01",
    price: 16,
  },
  {
    name: "花王牌卫生巾F系列22.5cm20片28274（日用超薄）",
    barcode: "4901301282743",
    stock: 9,
    expiry_date: "2026.08",
    price: 16,
  },
  {
    name: "花王牌卫生巾F系列22.5cm20片37843（日用）",
    barcode: "4901301378439",
    stock: 9,
    expiry_date: "2027.01",
    price: 16,
  },
  {
    name: "花王牌卫生巾F系列25cm17片28275（日用超薄）",
    barcode: "4901301282750",
    stock: 9,
    expiry_date: "2026.1",
    price: 16,
  },
  {
    name: "花王牌卫生巾F系列30cm10片26287（夜用）",
    barcode: "4901301262875",
    stock: 9,
    expiry_date: "2027.02",
    price: 16,
  },
  {
    name: "花王牌卫生巾F系列35cm8片35000（夜用）",
    barcode: "4901301350008",
    stock: 8,
    expiry_date: "2027.01",
    price: 16,
  },
  {
    name: "花王牌卫生巾F系列40cm9片35456（夜用）",
    barcode: "4901301354563",
    stock: 8,
    expiry_date: "2026.06",
    price: 16,
  },
  {
    name: "花王牌卫生巾S系列20.5cm32片27721（日用无护翼）",
    barcode: "4901301277213",
    stock: 4,
    expiry_date: "2027.03",
    price: 16,
  },
  {
    name: "花王牌卫生巾S系列25cm19片25428（日用）",
    barcode: "4901301254283",
    stock: 8,
    expiry_date: "2027.01",
    price: 16,
  },
  {
    name: "花王牌卫生巾S系列30cm15片25427（夜用）",
    barcode: "4901301254276",
    stock: 8,
    expiry_date: "2027.04",
    price: 16,
  },
  {
    name: "花王牌卫生巾S系列40cm11片（33645）（夜用）",
    barcode: "4901301336453",
    stock: 8,
    expiry_date: "2026.06",
    price: 16,
  },
  {
    name: "花王牌卫生巾2包20.5cm28片39236单包",
    barcode: "4901301392367",
    stock: 5,
    expiry_date: "2026.04",
    price: 9.9,
  },
  {
    name: "花王牌卫生巾2包27cm10片 39234单包",
    barcode: "4901301392343",
    stock: 6,
    expiry_date: "2027.03",
    price: 11.8,
  },
  {
    name: "花王牌卫生巾37cm14片26985）（超吸收夜用）",
    barcode: "4901301269850",
    stock: 6,
    expiry_date: "2027.03",
    price: 11.8,
  },
  {
    name: "花王牌卫生巾护垫72片30621（无香型）",
    barcode: "4901301306210",
    stock: 9,
    expiry_date: "2027.02",
    price: 18,
  },
  {
    name: "花王儿童牙膏70g草莓味 28162（12个/盒）",
    barcode: "4901301281623",
    stock: 5,
    expiry_date: "2026.09",
    price: 8.8,
  },
  {
    name: "花王牙膏120g38618（成人绿色天然薄荷）",
    barcode: "4901301386182",
    stock: 8,
    expiry_date: "2026.05",
    price: 8.8,
  },
  {
    name: "日本狮王儿童牙膏葡萄味60G 09356（10个/盒）",
    barcode: "4903301093565",
    stock: 5,
    expiry_date: "2026.06",
    price: 8.8,
  },
  {
    name: "日本狮王牌牙膏 150g 18640（大白带官方标）",
    barcode: "4903301186403",
    stock: 13,
    expiry_date: "2026.09",
    price: 8.8,
  },
  {
    name: "狮王葡萄柚小苏打元气美白牙膏120g90132",
    barcode: "6903624901323",
    stock: 6,
    expiry_date: "2026.09",
    price: 8.8,
  },
  {
    name: "日本狮王牌牙膏清爽薄荷 140G 18644（粒子绿色10个/盒）",
    barcode: "4903301186441",
    stock: 9,
    expiry_date: "2026.04",
    price: 8.8,
  },
  {
    name: "日本狮王牌牙膏150g17189（去烟渍）",
    barcode: "4903301171898",
    stock: 8,
    expiry_date: "2026.12",
    price: 16.6,
  },
  {
    name: "小林牌厕所消臭元400ml（02963）F-4322（柠檬味）",
    barcode: "4987072029633",
    stock: 1,
    expiry_date: "2026.01",
    price: 12,
  },
  {
    name: "小林牌厕所消臭元400ml（02961）F-4328（薰衣草味）",
    barcode: "4987072029619",
    stock: 3,
    expiry_date: "2028.01",
    price: 18.8,
  },
  {
    name: "小林牌厕所消臭元400ml（02969）4990（百花香）",
    barcode: "4987072029695",
    stock: 9,
    expiry_date: "2028.02",
    price: 18.8,
  },
  {
    name: "宝洁牌洗衣球199g11个球14018（粉色）",
    barcode: "4987176140180",
    stock: 3,
    expiry_date: "2028.01",
    price: 19.9,
  },
  {
    name: "宝洁牌洗衣球199g11个球10891（紫色）",
    barcode: "4987176108913",
    stock: 4,
    expiry_date: "2027.01",
    price: 19.9,
  },
  {
    name: "牛乳香皂装85g*3块01064（蓝盒）",
    barcode: "4901525010641",
    stock: 7,
    expiry_date: "2029.11",
    price: 23.9,
  },
  {
    name: "大王湿巾70片×10  83192（儿童)",
    barcode: "4902011831924",
    stock: 3,
    expiry_date: "2028.01",
    price: 55,
  },
  {
    name: "皓乐齿牙膏130g 01100（薄荷味12个/盒）",
    barcode: "4901616011007",
    stock: 2,
    expiry_date: "2027.04",
    price: 16,
  },
  {
    name: "棉柔巾33001（町好洗脸巾）",
    barcode: "4570012330014",
    stock: 16,
    expiry_date: "2026.10",
    price: 15,
  },
  {
    name: "町好洗脸巾抽取式60抽33013",
    barcode: "4570012330137",
    stock: 12,
    expiry_date: "2026.11",
    price: 11.9,
  },
  {
    name: "曼丹牌湿巾46枚040550（洁面透亮型蓝色）",
    barcode: "4902806405507",
    stock: 15,
    expiry_date: "2027.01",
    price: 16,
  },
  {
    name: "美源可瑞慕染发膏3G 08030（BCT明亮栗色）",
    barcode: "4987205080302",
    stock: 5,
    expiry_date: "2028.07",
    price: 39.9,
  },
  {
    name: "美源可瑞慕染发膏4G 08040（BCT自然栗色）",
    barcode: "4987205080401",
    stock: 6,
    expiry_date: "2028.07",
    price: 39.9,
  },
  {
    name: "美源可瑞慕染发膏5G 08050（BCT深栗色）",
    barcode: "4987205080500",
    stock: 5,
    expiry_date: "2028.07",
    price: 39.9,
  },
  {
    name: "美源可瑞慕染发膏6G 08060（BCT自然棕色）",
    barcode: "4987205080609",
    stock: 6,
    expiry_date: "2028.07",
    price: 39.9,
  },
  {
    name: "尤妮佳化妆棉 (47457)（82枚*2P）",
    barcode: "4903111455614",
    stock: 10,
    expiry_date: "2026.02",
    price: 8.8,
  },
  {
    name: "安热沙ANESSA金灿倍护防晒乳60ml 16152",
    barcode: "729238161528",
    stock: 6,
    expiry_date: "2026.08",
    price: 118,
  },
  {
    name: "大公鸡管家马赛洗衣皂300g 00101",
    barcode: "8005150001015",
    stock: 5,
    expiry_date: "2026.01",
    price: 9.9,
  },
  {
    name: "大公鸡管家多能油污净（柠檬）52295",
    barcode: "8015194522957",
    stock: 2,
    expiry_date: "2029.06",
    price: 19.9,
  },
  {
    name: "宝洁牌车载芳香除味剂2ml*2 56154（粉色花香2个装）",
    barcode: "4902430561549",
    stock: 1,
    expiry_date: "2026.01",
    price: 19.9,
  },
  {
    name: "宝洁牌车载芳香除味剂2ml*2 64286（除烟味2个装）",
    barcode: "4902430642866",
    stock: 1,
    expiry_date: "2026.01",
    price: 19.9,
  },
  {
    name: "宝洁牌车载芳香除味剂2ml*2 78189（微香型2个装绿色）",
    barcode: "4902430781893",
    stock: 2,
    expiry_date: "2027.04",
    price: 29.9,
  },
  {
    name: "宝洁牌车载芳香除味剂2ml*2 63594（消臭2个装绿色）",
    barcode: "4902430635943",
    stock: 2,
    expiry_date: "2027.04",
    price: 29.9,
  },
  {
    name: "宝洁牌车载芳香除味剂2ml*2个63593（水果柑橘香）",
    barcode: "4902430635936",
    stock: 2,
    expiry_date: "2027.04",
    price: 29.9,
  },
  {
    name: "小林制药管道疏通剂400ml03265",
    barcode: "4987072032657",
    stock: 4,
    expiry_date: "2027.01",
    price: 19.9,
  },
  {
    name: "火箭牌清洁皂135g30324",
    barcode: "4903367303240",
    stock: 7,
    expiry_date: "2027.03",
    price: 8.8,
  },
  {
    name: "小林制药汽车香水6ml05066（带专用夹款玫瑰香）",
    barcode: "4987072050668",
    stock: 3,
    expiry_date: "2027.01",
    price: 18.8,
  },
  {
    name: "小林制药汽车香水6ml05377（带专用夹款薰衣草香）",
    barcode: "4987072053775",
    stock: 4,
    expiry_date: "2027.01",
    price: 18.8,
  },
  {
    name: "小林制药汽车香水6ml05378（带专用夹款自然花香）",
    barcode: "4987072053782",
    stock: 4,
    expiry_date: "2027.01",
    price: 18.8,
  },
  {
    name: "小林制药汽车香水6ml04948（带专用夹款白色）",
    barcode: "4987072049488",
    stock: 4,
    expiry_date: "2027.01",
    price: 18.8,
  },
  {
    name: "狮王牌洗衣液 17ml72386（狮王去渍笔）",
    barcode: "4903301723868",
    stock: 10,
    expiry_date: "2026.02",
    price: 9.9,
  },
  {
    name: "花王牌婴儿拉拉裤XXL26片42589（新版）",
    barcode: "4901301425898",
    stock: 2,
    expiry_date: "2027.04",
    price: 50,
  },
  {
    name: "进口马油洗护套盒",
    stock: 4,
    expiry_date: "2027.01",
    price: 99,
  },
  {
    name: "花王洗衣液1520g42136（玫瑰香补充装）",
    barcode: "4901301421364",
    stock: 3,
    expiry_date: "2028.01",
    price: 29.9,
  },
  {
    name: "花王牌洗衣液720ml（74591）（衣物彩漂液）",
    barcode: "4901301745910",
    stock: 4,
    expiry_date: "2027.01",
    price: 12,
  },
  {
    name: "花王牌衣物柔顺剂380ml40739（FLAZR衣物柔顺剂替换清爽的鲜花谐美香型）",
    barcode: "4901301407399",
    stock: 4,
    expiry_date: "2026.11",
    price: 15,
  },
  {
    name: "花王牌衣物柔顺剂380ml40743（FLAZR衣物柔顺剂替换装华美的甜馨百花香型）",
    barcode: "4901301407436",
    stock: 5,
    expiry_date: "2026.11",
    price: 15,
  },
  {
    name: "花王牌衣物喷雾除味剂370ml41246（EX粉色玫瑰香）",
    barcode: "4901301412461",
    stock: 4,
    expiry_date: "2026.09",
    price: 19.9,
  },
  {
    name: "花王牌衣物喷雾除味剂350ml39672（EX银色无香本体）",
    barcode: "4901301396723",
    stock: 4,
    expiry_date: "2026.09",
    price: 19.9,
  },
  {
    name: "花王牌衣物喷雾除味剂350ml40071（EX蓝色香皂香本体）",
    barcode: "4901301400710",
    stock: 3,
    expiry_date: "2028.01",
    price: 19.9,
  },
  {
    name: "小林牌洗衣液120ml（J-668）（内衣清洗剂）",
    barcode: "4987072066447",
    stock: 2,
    expiry_date: "2027.04",
    price: 18.8,
  },
  {
    name: "小林牌鞋子喷雾除臭剂250ml（D-096）",
    barcode: "4987072061756",
    stock: 2,
    expiry_date: "2027.04",
    price: 19.9,
  },
  {
    name: "小林牌冰箱木炭用除异味剂113gJ-666",
    barcode: "4987072036228",
    stock: 2,
    expiry_date: "2027.04",
    price: 12,
  },
  {
    name: "火箭牌洗洁精600ml30143（橙子香）",
    barcode: "4903367301437",
    stock: 5,
    expiry_date: "2026.01",
    price: 5.9,
  },
  {
    name: "火箭牌厕所清洁剂500g30666",
    barcode: "4903367306661",
    stock: 3,
    expiry_date: "2028.01",
    price: 9.9,
  },
  {
    name: "牛乳香皂90g*3块01091（红盒）",
    barcode: "4901525010917",
    stock: 11,
    expiry_date: "2026.10",
    price: 19.9,
  },
  {
    name: "花王牌卫生巾护垫62片38273（超吸收）",
    barcode: "4901301382733",
    stock: 11,
    expiry_date: "2025.09",
    price: 2.9,
  },
  {
    name: "狮王牌洗手液250ml17690（花香）",
    barcode: "4903301176909",
    stock: 16,
    expiry_date: "2026.10",
    price: 19.9,
  },
  {
    name: "花王浴室喷雾清洁剂400ml22283（卫生间墙体墙壁泡沫强力除霉剂补充装）",
    barcode: "4901301222831",
    stock: 5,
    expiry_date: "2026.01",
    price: 9.9,
  },
  {
    name: "维达棉韧抽取面巾3层S码90抽(8加送2)包/提",
    barcode: "V2834C",
    stock: 18,
    price: 15.9,
  },
  {
    name: "维达棉韧抽取面巾3层M码80抽×12包",
    barcode: "V2836",
    stock: 5,
    price: 19.9,
  },
  {
    name: "维达超韧抽取面巾3层S码120抽×10包",
    barcode: "V2223B",
    stock: 6,
    price: 19.9,
  },
  {
    name: "维达超韧实芯卫卷4层150克×12卷",
    barcode: "V4459",
    stock: 12,
    price: 19.9,
  },
  {
    name: "维达超韧实芯卫卷4层150克×12卷",
    barcode: "V4492",
    stock: 12,
    price: 19.9,
  },
  {
    name: "维达初肌秘密洗脸巾L码60抽×3包/提",
    barcode: "V1182",
    stock: 10,
    price: 19.9,
  },
  {
    name: "维达厨房纸巾75节×2卷装",
    barcode: "V4020-2",
    stock: 20,
    price: 7.9,
  },
  {
    name: "维达杀菌湿巾80片/包",
    barcode: "VW1040",
    stock: 12,
    price: 8.9,
  },
  {
    name: "维达湿厕纸80片/包",
    barcode: "VW3425",
    stock: 12,
    price: 9.9,
  },
  {
    name: "白花蛇草水330ml",
    barcode: "1*12",
    stock: 10,
    price: 55.9,
  },
  {
    name: "丝滑拿铁268ml",
    barcode: "1*15",
    stock: 5,
    price: 63.9,
  },
  {
    name: "可口可乐500ml",
    barcode: "1*24",
    stock: 5,
    price: 57.8,
  },
  {
    name: "可口可乐雪碧罐装330ml",
    barcode: "1*24",
    stock: 5,
    price: 43.6,
  },
  {
    name: "冰露550ml",
    barcode: "1*24",
    stock: 2,
    price: 11.9,
  },
  {
    name: "康师傅冰红茶500ml",
    barcode: "1*15",
    stock: 5,
    price: 32.9,
  },
  {
    name: "康师傅绿茶550ml",
    barcode: "1*15",
    stock: 5,
    price: 32.9,
  },
  {
    name: "康师傅茉莉蜜茶500ml",
    barcode: "1*15",
    stock: 5,
    price: 32.9,
  },
  {
    name: "脉动青柠口味600ml",
    barcode: "1*15",
    stock: 5,
    price: 52.9,
  },
  {
    name: "脉动水蜜桃口味600ml",
    barcode: "1*15",
    stock: 5,
    price: 52.9,
  },
  {
    name: "大姚嘉宾520ml",
    barcode: "1*12",
    stock: 5,
    price: 44.9,
  },
  {
    name: "大姚荔枝口味520ml",
    barcode: "1*12",
    stock: 5,
    price: 44.9,
  },
  {
    name: "娃哈哈纯净水596ml",
    barcode: "1*24",
    stock: 10,
    price: 25.8,
  },
];

/**
 * 清空所有数据
 */
export async function clearAllData() {
  try {
    console.log("🔄 正在清空数据库数据...");

    // 清空扫描记录表
    await sql`DELETE FROM scan_records`;
    console.log("✅ 扫描记录表已清空");

    // 清空商品表
    await sql`DELETE FROM products`;
    console.log("✅ 商品表已清空");

    // 重置自增序列
    await sql`ALTER SEQUENCE products_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE scan_records_id_seq RESTART WITH 1`;
    console.log("✅ 自增序列已重置");

    console.log("✅ 数据库数据清空完成");
    return { success: true, message: "数据库数据清空完成" };
  } catch (error) {
    console.error("❌ 清空数据库数据失败:", error);
    throw error;
  }
}

/**
 * 插入种子数据
 */
export async function seedDatabase() {
  try {
    console.log("🔄 正在插入种子数据...");

    // 检查是否已有数据
    const existingProducts = await sql`SELECT COUNT(*) as count FROM products`;
    const productCount = parseInt(existingProducts[0].count);

    if (productCount > 0) {
      console.log(`⚠️  数据库中已有 ${productCount} 个商品，跳过种子数据插入`);
      return {
        success: true,
        message: `数据库中已有 ${productCount} 个商品，跳过种子数据插入`,
        skipped: true,
        existingCount: productCount,
      };
    }

    // 批量插入商品数据
    let insertedCount = 0;
    for (const product of sampleProducts) {
      try {
        await sql`
          INSERT INTO products (barcode, name, price, stock, expiry_date)
          VALUES (${product.barcode}, ${product.name}, ${product.price}, ${
          product.stock
        }, ${product.expiry_date || null})
        `;
        insertedCount++;
        console.log(`✅ 已插入商品: ${product.name}`);
      } catch (error) {
        console.error(`❌ 插入商品失败: ${product.name}`, error.message);
      }
    }

    console.log(`✅ 种子数据插入完成，共插入 ${insertedCount} 个商品`);
    return {
      success: true,
      message: `种子数据插入完成，共插入 ${insertedCount} 个商品`,
      insertedCount,
    };
  } catch (error) {
    console.error("❌ 插入种子数据失败:", error);
    throw error;
  }
}

/**
 * 重新初始化数据库（清空并插入种子数据）
 */
export async function resetDatabase() {
  try {
    console.log("🔄 正在重新初始化数据库...");

    // 先清空数据
    await clearAllData();

    // 再插入种子数据
    const result = await seedDatabase();

    console.log("✅ 数据库重新初始化完成");
    return {
      success: true,
      message: "数据库重新初始化完成",
      insertedCount: result.insertedCount,
    };
  } catch (error) {
    console.error("❌ 重新初始化数据库失败:", error);
    throw error;
  }
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats() {
  try {
    const productStats = await sql`SELECT COUNT(*) as count FROM products`;
    const scanStats = await sql`SELECT COUNT(*) as count FROM scan_records`;

    return {
      products: parseInt(productStats[0].count),
      scanRecords: parseInt(scanStats[0].count),
    };
  } catch (error) {
    console.error("❌ 获取数据库统计信息失败:", error);
    throw error;
  }
}
