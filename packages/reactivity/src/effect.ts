import { isArray, isIntegerKey } from "@vue/shared/src";
import { TriggerOpTypes } from "./operators";

// 高阶函数
export function effect(fn, options: any = {}) {
  // 让这个effect变成响应的effect，数据变化重新执行

  const effect = createReactiveEffect(fn, options);

  if (!options.lazy) { // 参数控制默认先执行
    effect(); // 响应式的effect默认先执行一次
  }

  return effect
}

// 创建effect
let uid = 0;
let activeEffect; // 存储当前的effect
const effectStack = []; // 这个运行栈 依靠前置条件是： 监听对象变化 =》 放入， 函数运行结束 =》 移除
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      // 保证effect没有加入到effectStack中，避免effect内改变引用的值时，不断重复调用

      try {
        effectStack.push(effect);
        activeEffect = effect;
        return fn(); // 函数执行时会取值， 执行proxy get
      } finally { // 这个防止effect嵌套引发的问题
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  }

  effect.id = uid++; // 用于区分effect
  effect.__isEffect = true; // 用于标识响应式effect
  effect.raw = fn; // 对应原来的函数
  effect.options = options; // 在effect上保存用户属性

  return effect;
}

// 让某个对象中的属性变化收集当前的effect函数
const targetMap = new WeakMap(); // 映射表
export function track(target, type, key) { // 拿到当前的effect
  // activeEffect// 当前运行的effect
  if (activeEffect === undefined) { // 有没有正在运行的 effect
    return;
  }

  let depsMap = targetMap.get(target);
  if (!depsMap) { // 有没有目标对象
    targetMap.set(target, (depsMap = new Map))
  }

  let dep = depsMap.get(key);
  if (!dep) { // 目标对象里面是否有目标key
    depsMap.set(key, (dep = new Set))
  }

  if (!dep.has(activeEffect)) { // 目标对象里面的目标key是否有 目标effect
    dep.add(activeEffect);
  }

}

// 找到属性对应的effect，让其执行（数组，对象）
export function trigger(target, type, key?, newValue?, oldValue?) {
  // 如果这个属性没有收集到effect，就不需要操作
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const effects = new Set();
  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        effects.add(effect)
      });
    }
  }
  // 将要执行的effect，存储到一个集合中，最后一起执行

  // 1 修改的是否是数组的长度，
  if (key === 'length' && isArray(target)) {
    // 对应长度的依赖有更新
    depsMap.forEach((dep, index) => {
      /**
       * 注意，当监听整个数组，同时改变length
       * 因为数组内有各种属性，下面判断会有错误
      */
      if (index === 'length' || (isIntegerKey(index) && index > newValue - 1)) { // 如果更改的长度小于收集的索引，这个索引也要触发effect重新执行
        add(dep);
      }
    });
  } else {
    // 可能是对象
    if (key !== undefined) {
      add(depsMap.get(key)); // 新增，修改
    }

    // 如果修改数组中的某一个索引，触发长度更新 怎么办
    switch(type) {
      case TriggerOpTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get('length'));
        }
    }
  }

  effects.forEach((effect: any) => {
    if(effect.options.scheduler) {
      effect.options.scheduler(effect);
    }else {
      effect()
    }
  })

}