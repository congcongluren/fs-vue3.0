// 创建虚拟节点

import { isArray, isObject, isString, ShapeFlags } from "@vue/shared/src";

// h() 和createApp类似
export const createVNode = (type, props, children = null) =>{
  // 根据type区分组件 还是普通元素
  // 给虚拟节点加个类型

  const shapeFlag = isString(type) ? 
    ShapeFlags.ELEMENT 
      : 
    isObject(type) ?  ShapeFlags.STATEFUL_COMPONENT : 0;


  const vNode = { // 用一个对象来描述对应的内容，虚拟节点具有跨平台的能力
    __v_isVNode: true,
    type,
    props,
    children,
    component:null, // 存放组件对应的实例
    el:null, // 稍后会将虚拟节点和真是节点对应
    key: props && props.key, // dif算法会用到key
    shapeFlag // 判断自己的类型和子节点的类型
  }

  normalizeChildren(vNode, children);

  return vNode;
}

function normalizeChildren(vNode, children) {
  let type = 0;
  if(children === null) {
    // 子节点为空，不对子节点处理
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }

  vNode.shapeFlag |=  type;

}