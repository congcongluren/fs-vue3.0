import { isFunction, isObject, ShapeFlags } from "@vue/shared/src";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

// 组件中所有的方法
export function createComponentInstance(vNode) {
  const instance = {
    // 组件的实例
    vNode,
    type: vNode.type, // 用户写的对象
    props: {}, // 传入的所有
    attrs: {}, //使用者传递
    slots: {},
    data: {},
    setupState: {}, // 如果setup返回一个对象，这个对象会作为setUpstate
    ctx: {}, // 为了不代理原对象
    isMounted: false, // 表示这个组件是否挂载过
  }

  instance.ctx = { _: instance }

  return instance
}
export function setupComponent(instance) {
  // 拿到instance
  const { props, children } = instance.vNode;
  // 根据props解析出 props 和 attrs， 将其放在instance上
  instance.props = props; // initProps()
  instance.children = children; // 插槽的解析

  // 需要先看下当前组件是否有状态
  let isStateful = instance.vNode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
  if (isStateful) { // 组件有状态
    // 调用实例的setup方法
    setUpStatefulComponent(instance);
  }

}

function setUpStatefulComponent(instance) {
  // 1.代理 传递给render函数的参数，为了优化取值
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any)

  // 2.获取组件的类型，拿setup
  let Component = instance.type;
  let { setup } = Component;
  
  // 3.调用setup，render
  if(setup) {
    let setupContent = createSetupContext(instance);
    const setupResult = setup(instance.props, setupContent);
    handleSetupResult(instance, setupResult);

  }else {
    // Component.render(instance.proxy);
    finishComponentSetup(instance); // 完成组件的启动
  }

  console.log(instance);
}

function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult;
  }else if ( isObject(setupResult)) {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  let Component = instance.type;

  if (!instance.render) {
    // 对template模版进行编译产生render函数
    // instance.render = render; // 将生成的render函数放到实例上
    if (!Component.render && Component.template) {
      // 编译，将结果赋予给Component.render
    }
    instance.render = Component.render
  }

  // 对vue2.0进行兼容
  // applyOptions
}

function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: () => {

    },
    expose: () => {

    }
  }
}

// instance 表示组件的状态，各种相关信息
// context 4个参数，开发时使用
// proxy 主要是为了取值方便