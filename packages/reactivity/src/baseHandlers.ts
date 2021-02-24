// 实现 new Proxy（target， handler）

import { extend, hasChanged, hasOwn, isArray, isIntegerKey, isNumber, isObject } from "@vue/shared/src";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operators";
import { readonly, reactive } from "./reactive";

// 是不是仅读的，仅读的属性set时会报异常
// 是不是深度的

function createGetter(isReadonly = false, shallow = false) { // 拦截获取功能
  return function get(target, key, receiver) {
    // Reflect 具备返回值
    // receiver 代理对象， 当前的谁调的就是谁（当前proxy）
    const res = Reflect.get(target, key, receiver);

    if (!isReadonly) {
      // 收集依赖， 数据变化更新视图
      // console.log('执行effect时会取值', target, TrackOpTypes.GET, key);
      track(target, TrackOpTypes.GET, key);
    }

    if (shallow) {
      return res;
    }

    if (isObject(res)) { // 对于嵌套对象 懒代理，设置监听对象，开始时不代理，使用时再设置成代理
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res;
  }
}

function createSetter(shallow = false) { // 拦截设置功能
  return function set(target, key, value, receiver) {

    
    const oldValue = target[key]; // 获取老值
    // 判断是否是对象已有的key，注意数组
    let hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
    
    // console.log(target, hadKey, oldValue, value);
    // debugger
    const res = Reflect.set(target, key, value, receiver);
    
    if (!hadKey) {
      // 新增属性
      trigger(target, TriggerOpTypes.ADD, key, value);
    } else if (hasChanged(oldValue, value)) {
      // 修改属性
      trigger(target, TriggerOpTypes.SET, key, value, oldValue);
    }
    

    // 区分新增的，还是修改的，对于数组

    // 当数据更新时 通知对应的属性的effect重新执行

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
  set: (target, key) => {
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
