import { ShapeFlags } from "@vue/shared/src";
import { createAppAPI } from "./apiCreateApp"

export function createRenderer(rendererOptions) { // 告诉core怎么渲染
  // 创建一个渲染器

  const mountComponent = (initialVNode, container) => {
    // 组件的渲染流程 最核心调用setup 拿到返回值，获取render函数返回的结果来渲染
    // 1.现有实例
    
    // 2.需要将数据解析到实例上
    // 3.创建一个effect， 让render函数渲染

  }
  const processComponent = (n1, n2, container) =>{
    if (n1 === null) { // 组件没有上一次的虚拟节点
      mountComponent(n2, container);
    } else {
      // 组件更新流程
    }
  }
  const patch = (n1, n2, container) => {
    // 针对不同类型做初始化操作
    const { shapeFlag } = n2;
    
    if(shapeFlag & ShapeFlags.ELEMENT){
      console.log('元素');
    }else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      processComponent(n1, n2, container);
      
    }
  }
  const render = (vNode, container) => { 
    // core 的核心， 根据不同的虚拟节点，创建对应的真实元素

    // 默认调用render 可能是初始化流程
    patch(null, vNode, container);

    
  }
  return {
    createApp:createAppAPI(render)
  }
}