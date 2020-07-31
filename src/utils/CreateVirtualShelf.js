/*
 * @Author: PandaJ
 * @Date:   2019-03-04 14:59:43
 * @Last Modified by:   PandaJ
 * @Last Modified time: 2019-07-09 15:48:55
 */

import ImagePreloader from './ImagePreloader.js';
import promiseLimit from 'promise-limit';
class VirtualShelf {
  constructor(cargolist, templateID = 1) {
    this.cargolist = cargolist;
    this.templateID = templateID;
    this.PRESET_TEMPLATE_CONFIG = [
      null, // TemplateID计数从1开始
    ];
    // templateID=1，竖屏设备

    this.PRESET_TEMPLATE_CONFIG[1] = {
      PAGE_SIZE: 30, // 每屏30个货道商品
      PAGE_ROW: 3,
      ROW_SIZE: 10,
      EnableSpan: true,
    };

    // templateID=2，横屏设备
    this.PRESET_TEMPLATE_CONFIG[2] = {
      PAGE_SIZE: 28, // 每屏28个货道商品
      PAGE_ROW: 2,
      ROW_SIZE: 14,
      EnableSpan: true,
    };
    // templateID=3，无屏设备
    this.PRESET_TEMPLATE_CONFIG[3] = {
      PAGE_SIZE: 0, // 每屏不限商品个数
      PAGE_ROW: 1,
      ROW_SIZE: 1,
      EnableSpan: false,
    };
    // templateID=4，5x4
    this.PRESET_TEMPLATE_CONFIG[4] = {
      PAGE_SIZE: 20, // 每屏25个货道商品
      PAGE_ROW: 5,
      ROW_SIZE: 4,
      EnableSpan: false,
    };
    // templateID=5,5x5
    this.PRESET_TEMPLATE_CONFIG[5] = {
      PAGE_SIZE: 25, // 每屏25个货道商品
      PAGE_ROW: 5,
      ROW_SIZE: 5,
      EnableSpan: false,
    };
    // templateID=6, 10寸屏，4x5
    this.PRESET_TEMPLATE_CONFIG[6] = {
      PAGE_SIZE: 20, // 每屏25个货道商品
      PAGE_ROW: 4,
      ROW_SIZE: 5,
      EnableSpan: false,
    };
    // templateID=7, 横屏爆米花，1x3
    this.PRESET_TEMPLATE_CONFIG[7] = {
      PAGE_SIZE: 0, // 每屏不限商品个数
      PAGE_ROW: 1,
      ROW_SIZE: 1,
      EnableSpan: false,
    };
    //  templateID=8, 横屏无触摸
    this.PRESET_TEMPLATE_CONFIG[8] = {
      PAGE_SIZE: 0, // 每屏不限商品个数
      PAGE_ROW: 1,
      ROW_SIZE: 1,
      EnableSpan: false,
    };
    // templateID=9, 竖屏3x3
    this.PRESET_TEMPLATE_CONFIG[9] = {
      PAGE_SIZE: 9, // 每屏不限商品个数
      PAGE_ROW: 3,
      ROW_SIZE: 3,
      EnableSpan: false,
    };
  }

  async init() {
    const products = await this.uniqueProduct();
    const productLayout = [];
    // TODO: IMPORTANT, PAGE_SIZE=0的模版
    if ([3, 7, 8].indexOf(this.templateID) > -1) {
      productLayout.push({
        title: `全部商品`,
        layout: [products.productList],
      });
    } else {
      const config = this.PRESET_TEMPLATE_CONFIG[this.templateID];

      let layout = [];
      if (!config.EnableSpan) {
        // 不区分商品占格
        layout = this.pagingProducts(products, config);
      } else {
        // 区分商品占格
        layout = this.pagingColSpanProducts(products, config);
      }
      layout.map((el, i) => {
        productLayout.push({
          title: `货架${i + 1}`,
          layout: el,
        });
      });
    }

    return productLayout;
  }

  uniqueProduct() {
    const productMap = [new Map(), new Map(), new Map()];
    let productList = [];
    let colTotal = 0;
    let colSpanArray = [null, [], []];

    this.cargolist.map((el) => {
      try {
        productMap[el.Temperature].set(el.BarCode, el);
      } catch (err) {}
    });

    productMap.forEach((el) => {
      productList = productList.concat(Array.from(el.values()));
    });
    const limit = promiseLimit(5);
    const loaders = productList.map((el) => {
      colTotal += el.ColSpan;

      if (colSpanArray[el.ColSpan]) {
        colSpanArray[el.ColSpan].push(el);
      }
      return limit(() => {
        return new Promise((resolve, reject) => {
          const loader = new ImagePreloader(el.ImageFixWidthUrl, {
            suffix: '?x-oss-process=image/resize,p_1',
          });
          loader
            .loadImage()
            .then((image) => {
              setImageInfo(el, image);
              resolve();
              // _finally.call(this);
            })
            .catch((err) => {
              // if(el.ColSpan == 2){
              //   el.ImageFixWidthUrl = 'http://res.yopoint.com/static/image/products/img_default_2.png';
              // }else{
              //   el.ImageFixWidthUrl = 'http://res.yopoint.com/static/image/products/img_default_1.png';
              // }
              el.ImageFixWidthUrl = '';
              console.log('reject-1', err);
              resolve(); // reject
            });
        });
      });
    });

    return new Promise((resolve) => {
      Promise.all(loaders).then(() => {
        resolve({ productList, colTotal, colSpanArray });
      });
    });
  }

  // 对货道商品进行分页， 不区分1格、2格商品
  pagingProducts({ productList }, config) {
    const { PAGE_SIZE } = config;
    const screens = Math.ceil(productList.length / PAGE_SIZE);

    const layout = new Array(screens).fill().map((el, page) => {
      // 分屏
      const pageSize = Math.ceil(productList.length / screens);
      const screen = productList.slice(pageSize * page, pageSize * (page + 1));

      return this.pileUpProducts(screen, config);
    });
    return layout;
  }

  pileUpProducts(productList, { PAGE_SIZE, PAGE_ROW, ROW_SIZE }) {
    // 有屏设备
    const screen = new Array(PAGE_ROW).fill().map((el) => []); // 每屏 PAGE_ROW 排
    // 每个商品重复次数
    const repeat = Math.floor(PAGE_SIZE / productList.length);
    // 每屏剩余空位
    let remainder = PAGE_SIZE - productList.length * repeat;
    const len = productList.length;

    const list = []; // 长度为 PAGE_SIZE 的数组
    for (let i = 0; i < len; i++) {
      let repeats = repeat;
      // 填充剩余空位
      if (remainder > 0) {
        repeats += 1;
        remainder -= 1;
      }
      const product = productList[i];
      // 根据 repeats 填充 productList
      const tmp = new Array(repeats).fill().map((el) => product);
      list.push(...tmp);
    }
    // 将 list 转换成二位数组， row column
    for (let r = 0; r < PAGE_ROW; r++) {
      screen[r] = list.slice(r * ROW_SIZE, (r + 1) * ROW_SIZE);
    }

    return screen;
  }

  // 对货道商品进行分页
  pagingColSpanProducts({ productList, colTotal, colSpanArray }, config) {
    const { PAGE_SIZE } = config;
    const screens = Math.ceil(colTotal / PAGE_SIZE);

    // const remainderPercent = (colTotal % PAGE_SIZE) / PAGE_SIZE;

    const colSpan1Size = Math.ceil(colSpanArray[1].length / screens);
    const colSpan2Size = Math.ceil(colSpanArray[2].length / screens);

    let overflow = 0;

    const layout = new Array(screens).fill().map((el, page) => {
      let colSpan2 = [];
      let colSpan1 = [];

      // 分屏，单页可能超过限定 PAGE_SIZE
      if (colSpan1Size + colSpan2Size * 2 > PAGE_SIZE) {
        colSpan2 = colSpanArray[2].splice(0, colSpan2Size);
        colSpan1 = colSpanArray[1].splice(0, PAGE_SIZE - colSpan2.length * 2);

        overflow = colTotal - PAGE_SIZE;
      } else {
        colSpan2 = colSpanArray[2].splice(0, colSpan2Size);
        colSpan1 = colSpanArray[1].splice(0, colSpan1Size);
      }

      colTotal = colSpan1.length + colSpan2.length * 2;

      return this.pileUpColSpanProducts(
        {
          colTotal,
          colSpanArray: [null, colSpan1, colSpan2],
        },
        config
      );
    });

    return layout;
  }
  // 堆砌每页的商品
  pileUpColSpanProducts(
    { colTotal, colSpanArray },
    { PAGE_SIZE, PAGE_ROW, ROW_SIZE }
  ) {
    // 无屏设备 或 非法类型
    if (!PAGE_SIZE) return;

    // 有屏设备
    const screen = new Array(PAGE_ROW).fill().map((el) => []); // 每屏3排
    const columns = new Array(PAGE_ROW).fill(0); // 每排10个货道

    // 当前页商品，至少循环次数
    const repeat = Math.floor(PAGE_SIZE / colTotal);
    // 当前页商品使用至少循环次数填充后， 页面剩余格数
    let space = PAGE_SIZE - repeat * colTotal;

    let colSpan1 = colSpanArray[1].sort((a, b) => {
      return a.ImageHeight - b.ImageHeight;
    });
    let colSpan2 = colSpanArray[2].sort((a, b) => {
      return a.ImageHeight - b.ImageHeight;
    });
    /**
     * productColSpanLength  每种格数商品的个数
     * [1格商品，2格商品]
     */
    const productColSpanLength = [colSpan1.length, colSpan2.length];
    /**
     * productColSpanRepeatCounter
     * 商品循环次数 计数器
     * [3,1,2] -> 第一个商品循环3次，第二个商品循环1次，第三个商品循环2次，
     */
    let productColSpanRepeatCounter = [
      new Array(productColSpanLength[0]).fill(repeat),
      new Array(productColSpanLength[1]).fill(repeat),
    ];

    // 指示器，记录当前循环到第几个商品
    let indicator = [0, 0];
    // 循环计数器，用于来回切换一格、两格商品
    let loop = 0;

    /**
     *  fillRemainderSpace
     *  递归计算productColSpanRepeatCounter
     */

    const fillRemainderSpace = () => {
      if (space <= 0) return;

      if (isNaN(space)) return;
      loop += 1;
      let idx = loop % 2;
      let colSpan = idx + 1; // idx = 0, colSpan = 1; idx = 1, colSpan = 2
      // return

      // 如果剩余空间不小于商品格数 && 指示器小于长度
      // 时，表示可添加
      if (space >= colSpan && indicator[idx] < productColSpanLength[idx]) {
        productColSpanRepeatCounter[idx][indicator[idx]] += 1;
        indicator[idx] += 1;
        space -= colSpan;
      }

      fillRemainderSpace();
    };

    fillRemainderSpace();

    // 反向计算
    // 从高到低，从下往上
    const colSpan = [colSpan2, colSpan1];

    productColSpanRepeatCounter.reverse().map((group, i) => {
      const ColSpanReverse = colSpan[i].reverse();
      group.reverse().map((count, k) => {
        for (let time = 0; time < count; time++) {
          _pushItem(ColSpanReverse[k]);
        }
      });
    });

    function _pushItem(elem, repeat) {
      for (let row = 0; row < PAGE_ROW; row++) {
        if (
          columns[row] < ROW_SIZE &&
          columns[row] + elem.ColSpan <= ROW_SIZE
        ) {
          screen[row].push(
            Object.assign({}, elem, {
              RowIndex: row,
              ColumnIndex: columns[row],
            })
          );
          columns[row] += elem.ColSpan;
          break;
        }
      }
    }

    // 反转商品排列
    screen.reverse().map((row) => {
      row.reverse();
    });

    return screen;
  }
}

export default async function CreateVirtualShelf(cargolist, templateID = 1) {
  return new VirtualShelf(cargolist, templateID).init();
}

function setImageInfo(el, image) {
  el['ImageWidth'] = (95 * image.width) / 750 / 0.4;
  el['ImageHeight'] = (95 * image.height) / 750 / 0.4;
  el['ImageOriginWidth'] = image.width / 0.4;
  el['ImageOriginHeight'] = image.height / 0.4;
}
