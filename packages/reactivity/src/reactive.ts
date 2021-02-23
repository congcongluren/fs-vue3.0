import { isObject } from "@vue/shared"
import { mutableHandlers, shallowReactiveHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers"


export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers)

}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers)

}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers)

}

export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadonlyHandlers)

}


// 是不是仅读，深度监听
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
export function createReactiveObject(target, isReadonly, baseHandlers) {
  // 如果目标不是对象，没有办法拦截，reactive这个api只能拦截对象类型
  if (!isObject(target)) {
    return target
  }

  // 如果一个对象代理过了，就不用再次代理了
  // 可能一个对象代理深度，并且仅读
  const proxyMap = isReadonly ? readonlyMap : reactiveMap;
  const existProxy = proxyMap.get(target);

  if(existProxy) {
    return existProxy;
  }

  const proxy = new Proxy(target, baseHandlers);
  
  proxyMap.set(target, proxy) // 将要代理的对象和代理的结果缓存起来

  return proxy;
}