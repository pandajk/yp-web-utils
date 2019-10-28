"use strict";Object.defineProperty(exports,"__esModule",{value:true});var _regenerator=require("babel-runtime/regenerator");var _regenerator2=_interopRequireDefault(_regenerator);var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor}}();var _ImagePreloader=require("./ImagePreloader.js");var _ImagePreloader2=_interopRequireDefault(_ImagePreloader);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _asyncToGenerator(fn){return function(){var gen=fn.apply(this,arguments);return new Promise(function(resolve,reject){function step(key,arg){try{var info=gen[key](arg);var value=info.value}catch(error){reject(error);return}if(info.done){resolve(value)}else{return Promise.resolve(value).then(function(value){step("next",value)},function(err){step("throw",err)})}}return step("next")})}}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function")}}var VirtualShelf=function(){function VirtualShelf(cargolist){var TemplateID=arguments.length>1&&arguments[1]!==undefined?arguments[1]:1;_classCallCheck(this,VirtualShelf);this.cargolist=cargolist;this.TemplateID=TemplateID;this.PRESET_TEMPLATE_CONFIG=[null,{PAGE_SIZE:30,PAGE_ROW:3,ROW_SIZE:10},{PAGE_SIZE:28,PAGE_ROW:2,ROW_SIZE:14},{PAGE_SIZE:0,PAGE_ROW:1,ROW_SIZE:1},null,null,null,{PAGE_SIZE:0,PAGE_ROW:1,ROW_SIZE:1}]}_createClass(VirtualShelf,[{key:"init",value:function(){var _ref=_asyncToGenerator(_regenerator2.default.mark(function _callee(){var Products,ProductLayout,layout;return _regenerator2.default.wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:_context.next=2;return this.uniqueProduct();case 2:Products=_context.sent;ProductLayout=[];if([3,7].indexOf(this.TemplateID)>-1){ProductLayout.push({title:"\u8D27\u67B6",layout:[Products.ProductList]})}else{layout=this.pagingProducts(Products);layout.map(function(el,i){ProductLayout.push({title:"\u8D27\u67B6"+(i+1),layout:el})})}console.log(ProductLayout);return _context.abrupt("return",ProductLayout);case 7:case"end":return _context.stop();}}},_callee,this)}));function init(){return _ref.apply(this,arguments)}return init}()},{key:"uniqueProduct",value:function uniqueProduct(){var ProductMap=new Map;var ProductList=[];var ColTotal=0;var ColSpanArray=[null,[],[]];this.cargolist.map(function(el){ProductMap.set(el.BarCode,el)});ProductList=Array.from(ProductMap.values());var loaders=ProductList.map(function(el){ColTotal+=el.ColSpan;if(ColSpanArray[el.ColSpan]){ColSpanArray[el.ColSpan].push(el)}return new Promise(function(resolve,reject){var loader=new _ImagePreloader2.default(el.ImageFixWidthUrl,{suffix:"?x-oss-process=image/resize,p_1"});loader.loadImage().then(function(image){setImageInfo(el,image);resolve()}).catch(function(err){el.ImageFixWidthUrl="";console.log("reject-1",err);resolve()})})});return new Promise(function(resolve){Promise.all(loaders).then(function(){resolve({ProductList:ProductList,ColTotal:ColTotal,ColSpanArray:ColSpanArray})})})}},{key:"pagingProducts",value:function pagingProducts(_ref2){var _this=this;var ProductList=_ref2.ProductList,ColTotal=_ref2.ColTotal,ColSpanArray=_ref2.ColSpanArray;var PRESET_TEMPLATE_CONFIG=this.PRESET_TEMPLATE_CONFIG,TemplateID=this.TemplateID;var _PRESET_TEMPLATE_CONF=PRESET_TEMPLATE_CONFIG[TemplateID],PAGE_SIZE=_PRESET_TEMPLATE_CONF.PAGE_SIZE,PAGE_ROW=_PRESET_TEMPLATE_CONF.PAGE_ROW,ROW_SIZE=_PRESET_TEMPLATE_CONF.ROW_SIZE;var screens=Math.ceil(ColTotal/PAGE_SIZE);var remainderPercent=ColTotal%PAGE_SIZE/PAGE_SIZE;var ColSpan1Size=Math.ceil(ColSpanArray[1].length/screens);var ColSpan2Size=Math.ceil(ColSpanArray[2].length/screens);var overflow=0;var layout=new Array(screens).fill().map(function(el,page){var ColSpan2=[];var ColSpan1=[];if(ColSpan1Size+ColSpan2Size*2>PAGE_SIZE){ColSpan2=ColSpanArray[2].splice(0,ColSpan2Size);ColSpan1=ColSpanArray[1].splice(0,PAGE_SIZE-ColSpan2.length*2);overflow=ColTotal-PAGE_SIZE}else{ColSpan2=ColSpanArray[2].splice(0,ColSpan2Size);ColSpan1=ColSpanArray[1].splice(0,ColSpan1Size)}ColTotal=ColSpan1.length+ColSpan2.length*2;return _this.pileUpProducts({ColTotal:ColTotal,ColSpanArray:[null,ColSpan1,ColSpan2]})});return layout}},{key:"pileUpProducts",value:function pileUpProducts(_ref3){var ColTotal=_ref3.ColTotal,ColSpanArray=_ref3.ColSpanArray;var PRESET_TEMPLATE_CONFIG=this.PRESET_TEMPLATE_CONFIG,TemplateID=this.TemplateID;var _PRESET_TEMPLATE_CONF2=PRESET_TEMPLATE_CONFIG[TemplateID],PAGE_SIZE=_PRESET_TEMPLATE_CONF2.PAGE_SIZE,PAGE_ROW=_PRESET_TEMPLATE_CONF2.PAGE_ROW,ROW_SIZE=_PRESET_TEMPLATE_CONF2.ROW_SIZE;if(!PAGE_SIZE)return;var screen=new Array(PAGE_ROW).fill().map(function(el){return[]});var columns=new Array(PAGE_ROW).fill(0);var repeat=Math.floor(PAGE_SIZE/ColTotal);var overflow=PAGE_SIZE-repeat*ColTotal;var stack=PAGE_SIZE;var ColSpan1=ColSpanArray[1].sort(function(a,b){return a.ImageHeight-b.ImageHeight});var ColSpan2=ColSpanArray[2].sort(function(a,b){return a.ImageHeight-b.ImageHeight});var ColSpanLength=[ColSpan1.length,ColSpan2.length];var ColSpanCount=[new Array(ColSpanLength[0]).fill(repeat),new Array(ColSpanLength[1]).fill(repeat)];var indicator=[0,0];var loop=0;var fillRemainderSpace=function fillRemainderSpace(){if(overflow<=0)return;if(isNaN(overflow))return;loop+=1;var idx=loop%2;var ColSpan=idx+1;if(overflow>=ColSpan&&indicator[idx]<ColSpanLength[idx]){ColSpanCount[idx][indicator[idx]]+=1;indicator[idx]+=1;overflow-=ColSpan}fillRemainderSpace()};fillRemainderSpace();var ColSpan=[ColSpan2,ColSpan1];ColSpanCount.reverse().map(function(group,i){var ColSpanReverse=ColSpan[i].reverse();group.reverse().map(function(count,k){for(var time=0;time<count;time++){_pushItem(ColSpanReverse[k])}})});function _pushItem(elem,repeat){for(var row=0;row<PAGE_ROW;row++){if(columns[row]<ROW_SIZE){screen[row].push(Object.assign({},elem,{RowIndex:row,ColumnIndex:columns[row]}));columns[row]+=elem.ColSpan;break}}}screen.reverse().map(function(row){row.reverse()});return screen}}]);return VirtualShelf}();exports.default=function(){var _ref4=_asyncToGenerator(_regenerator2.default.mark(function _callee2(cargolist){var TemplateID=arguments.length>1&&arguments[1]!==undefined?arguments[1]:1;return _regenerator2.default.wrap(function _callee2$(_context2){while(1){switch(_context2.prev=_context2.next){case 0:return _context2.abrupt("return",new VirtualShelf(cargolist,TemplateID).init());case 1:case"end":return _context2.stop();}}},_callee2,this)}));function CreateVirtualShelf(_x2){return _ref4.apply(this,arguments)}return CreateVirtualShelf}();function setImageInfo(el,image){el["ImageWidth"]=95*image.width/750/0.4;el["ImageHeight"]=95*image.height/750/0.4;el["ImageOriginWidth"]=image.width/0.4;el["ImageOriginHeight"]=image.height/0.4}