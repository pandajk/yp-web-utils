/*
 * @Author: PandaJ
 * @Date:   2017-12-13 15:24:58
 * @Last Modified by:   PandaJ
 * @Last Modified time: 2019-03-04 17:48:03
 */

// 图片预加载

var promiseLimit = require('promise-limit');
/**
 * [ImagePreloader 图片预加载]
 * @param {[Array, String]} src [预加载数据]
 */
function ImagePreloader(src, options) {
  // this.buffer = [];

  options = Object.assign(
    {
      prefix: '',
      suffix: '',
    },
    options
  );

  switch (Object.prototype.toString.call(src)) {
    case '[object Array]':
      this.src = src;
      src.map((el) => {
        if (this.buffer.indexOf(el) < 0) {
          this.buffer.push(el);
        }
      });
      break;
    case '[object String]':
      this.src = options.prefix + src + options.suffix;
      if (this.buffer.indexOf(src) < 0) {
        this.buffer.push(src);
      }
      break;
  }
}

// 构造函数共享缓存区
ImagePreloader.prototype.buffer = [];

//
ImagePreloader.prototype.loadImage = function loadImage() {
  // is a promise
  const image = this.onload(this.src);
  return image;
};

ImagePreloader.prototype.loadImages = function loadImage() {
  // is a promise array
  var limit = promiseLimit(5);
  const images = this.src.map((el) =>
    limit(() => {
      this.onload(el);
    })
  );
  return Promise.all(images);
};

//
ImagePreloader.prototype.onload = function onload(src) {
  return new Promise((resolve, reject) => {
    // if(!navigator.onLine){
    //   resolve({

    //   })
    //   return
    // }
    if (!/.(png|jpg|jpeg|webp)/.test(src)) {
      reject('It is not an image, or format not support.');
      return;
    }
    let retry = 0;
    const image = new Image();
    image.onload = function () {
      resolve({
        width: image.width,
        height: image.height,
        src: image.src,
      });
    };

    image.onerror = function () {
      retry += 1;
      if (retry > 3) {
        reject('image load error');
      } else {
        image.src = src;
      }
      console.log('onerror');
    };
    if (!/(dev-)?res.yopoint./.test(src)) {
      reject('image domain is illegal');
    } else {
      image.src = src;
    }
  });
};

export default ImagePreloader;
