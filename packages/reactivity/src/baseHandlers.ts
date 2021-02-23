// 实现 new Proxy（target， handler）

import { extend, isObject } from "@vue/shared/src";
import { readonly, reactive } from "./reactive";

// 是不是仅读的，仅读的属性set时会报异常
// 是不是深度的

function createGetter(isReadonly = false, shallow = false){ // 拦截获取功能
  return function get(target, key, receiver) {
    // Reflect 具备返回值
    // receiver 代理对象， 当前的谁调的就是谁（当前proxy）
    const res = Reflect.get(target, key, receiver);

    if (!isReadonly) {
      // 收集依赖， 数据变化更新视图
    }

    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res;
  }
}

function createSetter(shallow = false) { // 拦截设置功能
  return function set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver);

    return res;
  }
}

const get = createGetter(); 
const shallowGet = createGetter(false, true); 
const readonlyGet = createGetter(true); 
const shallowReadonlyGet = createGetter(true, true); 

const set = createSetter();
const shallowSet = createSetter();
const readonlySet = {
  set: (target, key)=>{
    console.warn(`set on key ${key} falied`);
  }
}

export const mutableHandlers = {
  get,
  set
}

export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet
}

export const readonlyHandlers = extend({
  get: readonlyGet
}, readonlySet);

export const shallowReadonlyHandlers = extend({
  get: shallowReadonlyGet
}, readonlySet);
