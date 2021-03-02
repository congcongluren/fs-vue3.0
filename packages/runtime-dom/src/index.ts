import { createRenderer } from "@vue/runtime-core/src";
import { extend } from "@vue/shared/src";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";


// 渲染时用到的所有方法
const rendererOptions = extend({ patchProp }, nodeOps);


export function createApp(rootComponent, rootProps = null) {
  const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps);
  let { mount } = app;
  
  app.mount = function (container) {
    // 清空容器
    container = nodeOps.querySelector(container);
    container.innerHTML = '';
    mount(container); // 函数劫持
    // 将组件渲染成dom元素 进行挂载
  }
  

  return app;
}

export * from '@vue/runtime-core';

// 用户调用的时runtime-dom  =》 runtime-core
// runtime-dom 是为了解决平台差异