/*
* @Author: PandaJ
* @Date:   2019-07-09 09:32:54
* @Last Modified by:   PandaJ
* @Last Modified time: 2019-07-09 14:28:38
*/
import test from 'ava';
import browserEnv from 'browser-env';
browserEnv();
// import {ImagePreloader, CreateVirtualShelf} from '../src/index.js';

import CreateVirtualShelf from '../src/utils/CreateVirtualShelf';

class Product{
  constructor(colspan) {
    this.Colspan = colspan
    if (colspan===1) {
      this.ImageFixWidthUrl = 'http://res.yopoint.com/static/image/products/img_default_1.png'
    }
    if (colspan===2) {
      this.ImageFixWidthUrl = 'http://res.yopoint.com/static/image/products/img_default_2.png'
    }
    this.BarCode = Math.random().toString(10).substring(2)
  }
}

function createProductList(total) {
  const productlist = []

  total.map((el,i)=>{
    let list = (new Array(el)).fill(0).map(el=>{
      return new Product(i+1)
    })
    productlist.push(...list)
  })
  return productlist
}


/*=============================================
=                 Testing                    =
=============================================*/


/*----------  presets  ----------*/


const total = [18,21]
let productlist


test.beforeEach(t=>{
  productlist = createProductList(total)
  t.context.log = console.log;
})

/*----------  assertion  ----------*/


test('create productlist', t=>{
  t.is(productlist.length, total[0]+total[1])
})

test('CreateVirtualShelf, template=1', t=>{
  const layout = CreateVirtualShelf(productlist, 1)
  console.log(layout);
  t.is(layout.length, 2)
})



