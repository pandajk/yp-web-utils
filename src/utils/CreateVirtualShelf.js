/*
 * @Author: PandaJ
 * @Date:   2019-03-04 14:59:43
 * @Last Modified by:   PandaJ
 * @Last Modified time: 2019-07-09 15:48:55
 */

import ImagePreloader from "./ImagePreloader.js";

class VirtualShelf {
  constructor(cargolist, TemplateID = 1) {
    this.cargolist = cargolist;
    this.TemplateID = TemplateID;
    this.PRESET_TEMPLATE_CONFIG = [
      null, // TemplateID计数从1开始
      // TemplateID=1，竖屏设备
      {
        PAGE_SIZE: 30, // 每屏30个货道商品
        PAGE_ROW: 3,
        ROW_SIZE: 10
      },
      // TemplateID=2，横屏设备
      {
        PAGE_SIZE: 28, // 每屏28个货道商品
        PAGE_ROW: 2,
        ROW_SIZE: 14
      },
      // TemplateID=3，无屏设备
      {
        PAGE_SIZE: 0, // 每屏不限商品个数
        PAGE_ROW: 1,
        ROW_SIZE: 1
      },
      // TemplateID=4，5x4
      null, // 5x4, 不自动生成
      // TemplateID=5,5x5
      null,
      // TemplateID=6, 10寸屏，4x5
      null,
      // TemplateID=7, 横屏爆米花，1x3
      {
        PAGE_SIZE: 0, // 每屏不限商品个数
        PAGE_ROW: 1,
        ROW_SIZE: 1
      },
      //  TemplateID=8, 横屏无触摸
      {
        PAGE_SIZE: 0, // 每屏不限商品个数
        PAGE_ROW: 1,
        ROW_SIZE: 1
      }
    ];
  }

  async init() {
    const Products = await this.uniqueProduct();
    const ProductLayout = [];

    if ([3, 7].indexOf(this.TemplateID) > -1) {
      ProductLayout.push({
        title: `货架`,
        layout: [Products.ProductList]
      });
    } else {
      const layout = this.pagingProducts(Products);
      layout.map((el, i) => {
        ProductLayout.push({
          title: `货架${i + 1}`,
          layout: el
        });
      });
    }
    console.log(ProductLayout);
    return ProductLayout;
  }

  uniqueProduct() {
    const ProductMap = new Map();
    let ProductList = [];
    let ColTotal = 0;
    let ColSpanArray = [null, [], []];

    this.cargolist.map(el => {
      ProductMap.set(el.BarCode, el);
    });

    ProductList = Array.from(ProductMap.values());

    const loaders = ProductList.map(el => {
      ColTotal += el.ColSpan;

      if (ColSpanArray[el.ColSpan]) {
        ColSpanArray[el.ColSpan].push(el);
      }

      return new Promise((resolve, reject) => {
        const loader = new ImagePreloader(el.ImageFixWidthUrl, {
          suffix: "?x-oss-process=image/resize,p_1"
        });
        loader
          .loadImage()
          .then(image => {
            setImageInfo(el, image);
            resolve();
            // _finally.call(this);
          })
          .catch(err => {
            // if(el.ColSpan == 2){
            //   el.ImageFixWidthUrl = 'http://res.yopoint.com/static/image/products/img_default_2.png';
            // }else{
            //   el.ImageFixWidthUrl = 'http://res.yopoint.com/static/image/products/img_default_1.png';
            // }
            el.ImageFixWidthUrl = "";
            console.log("reject-1", err);
            resolve(); // reject
          });
      });
    });

    return new Promise(resolve => {
      Promise.all(loaders).then(() => {
        resolve({ ProductList, ColTotal, ColSpanArray });
      });
    });
  }

  // 对货道商品进行分页
  pagingProducts({ ProductList, ColTotal, ColSpanArray }) {
    const { PRESET_TEMPLATE_CONFIG, TemplateID } = this;
    const { PAGE_SIZE, PAGE_ROW, ROW_SIZE } = PRESET_TEMPLATE_CONFIG[
      TemplateID
    ];

    const screens = Math.ceil(ColTotal / PAGE_SIZE);

    const remainderPercent = (ColTotal % PAGE_SIZE) / PAGE_SIZE;

    const ColSpan1Size = Math.ceil(ColSpanArray[1].length / screens);
    const ColSpan2Size = Math.ceil(ColSpanArray[2].length / screens);

    let overflow = 0;

    const layout = new Array(screens).fill().map((el, page) => {
      let ColSpan2 = [];
      let ColSpan1 = [];

      // 分屏，单页可能超过限定 PAGE_SIZE
      if (ColSpan1Size + ColSpan2Size * 2 > PAGE_SIZE) {
        ColSpan2 = ColSpanArray[2].splice(0, ColSpan2Size);
        ColSpan1 = ColSpanArray[1].splice(0, PAGE_SIZE - ColSpan2.length * 2);

        overflow = ColTotal - PAGE_SIZE;
      } else {
        ColSpan2 = ColSpanArray[2].splice(0, ColSpan2Size);
        ColSpan1 = ColSpanArray[1].splice(0, ColSpan1Size);
      }

      ColTotal = ColSpan1.length + ColSpan2.length * 2;

      return this.pileUpProducts({
        ColTotal,
        ColSpanArray: [null, ColSpan1, ColSpan2]
      });
    });

    return layout;
  }
  // 堆砌每页的商品
  pileUpProducts({ ColTotal, ColSpanArray }) {
    const { PRESET_TEMPLATE_CONFIG, TemplateID } = this;
    const { PAGE_SIZE, PAGE_ROW, ROW_SIZE } = PRESET_TEMPLATE_CONFIG[
      TemplateID
    ];

    // 无屏设备 或 非法类型
    if (!PAGE_SIZE) return;

    // 有屏设备
    const screen = new Array(PAGE_ROW).fill().map(el => []); // 每屏3排
    const columns = new Array(PAGE_ROW).fill(0); // 每排10个货道

    const repeat = Math.floor(PAGE_SIZE / ColTotal);
    let overflow = PAGE_SIZE - repeat * ColTotal;

    let stack = PAGE_SIZE;

    let ColSpan1 = ColSpanArray[1].sort((a, b) => {
      return a.ImageHeight - b.ImageHeight;
    });
    let ColSpan2 = ColSpanArray[2].sort((a, b) => {
      return a.ImageHeight - b.ImageHeight;
    });

    const ColSpanLength = [ColSpan1.length, ColSpan2.length];
    let ColSpanCount = [
      new Array(ColSpanLength[0]).fill(repeat),
      new Array(ColSpanLength[1]).fill(repeat)
    ];

    let indicator = [0, 0];
    let loop = 0;

    const fillRemainderSpace = () => {
      if (overflow <= 0) return;

      if (isNaN(overflow)) return;
      loop += 1;
      let idx = loop % 2;
      let ColSpan = idx + 1; // idx = 0, ColSpan = 1; idx = 1, ColSpan = 2
      // return

      // 如果剩余空间不小于商品格数 && 指示器小于长度
      // 时，表示可添加
      if (overflow >= ColSpan && indicator[idx] < ColSpanLength[idx]) {
        ColSpanCount[idx][indicator[idx]] += 1;
        indicator[idx] += 1;
        overflow -= ColSpan;
      }

      fillRemainderSpace();
    };

    fillRemainderSpace();

    // 反向计算
    // 从高到低，从下往上
    const ColSpan = [ColSpan2, ColSpan1];

    ColSpanCount.reverse().map((group, i) => {
      const ColSpanReverse = ColSpan[i].reverse();
      group.reverse().map((count, k) => {
        for (let time = 0; time < count; time++) {
          _pushItem(ColSpanReverse[k]);
        }
      });
    });

    function _pushItem(elem, repeat) {
      for (let row = 0; row < PAGE_ROW; row++) {
        if (columns[row] < ROW_SIZE) {
          screen[row].push(
            Object.assign({}, elem, {
              RowIndex: row,
              ColumnIndex: columns[row]
            })
          );
          columns[row] += elem.ColSpan;
          break;
        }
      }
    }

    // 反转商品排列
    screen.reverse().map(row => {
      row.reverse();
    });

    return screen;
  }
}

export default async function CreateVirtualShelf(cargolist, TemplateID = 1) {
  return new VirtualShelf(cargolist, TemplateID).init();
}

function setImageInfo(el, image) {
  el["ImageWidth"] = (95 * image.width) / 750 / 0.4;
  el["ImageHeight"] = (95 * image.height) / 750 / 0.4;
  el["ImageOriginWidth"] = image.width / 0.4;
  el["ImageOriginHeight"] = image.height / 0.4;
}
