/*
 * @Author: PandaJ
 * @Date:   2019-03-04 14:59:43
 * @Last Modified by:   PandaJ
 * @Last Modified time: 2019-03-05 10:50:10
 */

import ImagePreloader from './ImagePreloader.js';


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
        ROW_SIZE: 10,
      },
      // TemplateID=2，横屏设备
      {
        PAGE_SIZE: 28, // 每屏28个货道商品
        PAGE_ROW: 2,
        ROW_SIZE: 14,
      },
      // TemplateID=3，无屏设备
      {
        PAGE_SIZE: 0, // 每屏不限商品个数
        PAGE_ROW: 1,
        ROW_SIZE: 1,
      },
      null, // 5x4, 不自动生成
    ]
  }

  async init() {

    const Products = await this.uniqueProduct();
    const ProductLayout = [];

    if (this.TemplateID === 3) {
      ProductLayout.push({
        title: `自动`,
        layout: [Products.ProductList]
      });
    } else {

      const layout = this.pagingProducts(Products);
      layout.map((el, i) => {
        ProductLayout.push({
          title: `自动${i+1}`,
          layout: el
        })
      });
    }
    return ProductLayout;
  }

  uniqueProduct() {
    const ProductMap = new Map();
    let ProductList = [];
    let ColTotal = 0;
    let ColSpanArray = [null, [],
      []
    ];

    this.cargolist.map(el => {
      ProductMap.set(el.BarCode, el);
    });

    ProductList = Array.from(ProductMap.values());

    const loaders = ProductList.map(el => {
      ColTotal += el.ColSpan;
      ColSpanArray[el.ColSpan].push(el);
      return new Promise((resolve, reject) => {
        const loader = new ImagePreloader(el.ImageFixWidthUrl, {
          suffix: '?x-oss-process=image/resize,p_1',
        });
        loader.loadImage().then((image) => {
          setImageInfo(el, image);
          resolve();
          // _finally.call(this);
        }).catch((err) => {
          el.ImageFixWidthUrl = '';
          console.log('reject', err);
          reject();
          // _finally.call(this);
        });
      });
    });
    return new Promise(resolve => {
      Promise.all(loaders)
        .then(() => {
          resolve({ ProductList, ColTotal, ColSpanArray });
        });
    })
    // return { ProductList, ColTotal, ColSpanArray };
  }

  // 对货道商品进行分页
  pagingProducts({ ProductList, ColTotal, ColSpanArray }) {
    const screens = Math.ceil(ColTotal / 30);

    const ColSpan1Size = Math.ceil(ColSpanArray[1].length / screens);
    const ColSpan2Size = Math.ceil(ColSpanArray[2].length / screens);
    const layout = (new Array(screens)).fill().map((el, page) => {
      const ColSpan1 = ColSpanArray[1].slice(page * ColSpan1Size, (page + 1) * ColSpan1Size);
      const ColSpan2 = ColSpanArray[2].slice(page * ColSpan2Size, (page + 1) * ColSpan2Size);
      const ColTotal = ColSpan1.length + ColSpan2.length * 2;
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
    const { PAGE_SIZE, PAGE_ROW, ROW_SIZE } = PRESET_TEMPLATE_CONFIG[TemplateID];

    // 无屏设备 或 非法类型
    if (!PAGE_SIZE) return;

    // 有屏设备
    const screen = (new Array(PAGE_ROW)).fill().map(el => []); // 每屏3排
    const columns = (new Array(PAGE_ROW)).fill(0); // 每排10个货道

    const repeat = Math.floor(PAGE_SIZE / ColTotal);
    let overflow = PAGE_SIZE - repeat * ColTotal;

    let stack = PAGE_SIZE;

    let ColSpan1 = ColSpanArray[1].sort((a, b) => {
      return a.ImageHeight - b.ImageHeight
    });
    let ColSpan2 = ColSpanArray[2].sort((a, b) => {
      return a.ImageHeight - b.ImageHeight
    });

    while (stack--) {
      let item = ColSpan1.shift();

      if (!item) {
        console.log('没有 ColSpan=1 的商品了');
        item = ColSpan2.shift();
      }

      if (!item) {
        console.log('没有商品了');
        break; // 没有商品了
      }

      // repeat push
      let tmp_repeat = repeat;

      while (tmp_repeat--) {
        _pushItem(item);
      }

      if (overflow > 0) {
        _pushItem(item);
        overflow -= item.ColSpan;
      }
    }

    function _pushItem(elem) {
      for (let row = 0; row < PAGE_ROW; row++) {
        if (columns[row] < ROW_SIZE) {
          screen[row].push(Object.assign({}, elem, {
            RowIndex: row,
            ColumnIndex: columns[row]
          }));
          columns[row] += elem.ColSpan;
          break;
        }
      }
    }
    return screen;
  }

}




export default async function CreateVirtualShelf(cargolist, TemplateID = 1) {

  return new VirtualShelf(cargolist, TemplateID).init();

}




function setImageInfo(el, image) {
  el['ImageWidth'] = 95 * image.width / 750 / 0.4;
  el['ImageHeight'] = 95 * image.height / 750 / 0.4;
  el['ImageOriginWidth'] = image.width / 0.4;
  el['ImageOriginHeight'] = image.height / 0.4;
}