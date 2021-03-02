import { isArray, isObject } from "@vue/shared/src";
import { createVNode, isVNode } from "./vNode";

export function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) { // 类型 + 属性， 类型 + 子元素
    // 如果propsOrChildren 是数组，直接作为第三个参数
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 对象可能是属性，或者是 虚拟节点
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      // 第二个参数不是对象，或者是数组，那一定是子元素
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVNode(children)) {
      children = [children]
    }

    return createVNode(type, propsOrChildren, children);
  }
}