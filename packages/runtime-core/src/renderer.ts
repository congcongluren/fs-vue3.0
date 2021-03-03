import { effect } from "@vue/reactivity/src";
import { ShapeFlags } from "@vue/shared/src";
import { createAppAPI } from "./apiCreateApp"
import { createComponentInstance, setupComponent } from "./component";
import { queueJob } from "./scheduler";
import { normalizeVNode, TEXT } from "./vNode";

export function createRenderer(rendererOptions) { // 告诉core怎么渲染
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
  } = rendererOptions;
  // -------------------组件START-----------------------
  // 创建一个渲染器
  const setupRenderEffect = (instance, container) => {
    // 需要创建effect，在effect中调用render方法，render会收集effect，属性更新重新执行
    effect(function componentEffect() { // 每个组件都有effect，vue3是组件更新，数据更新执行effect函数
      if (!instance.isMounted) {
        // 初次渲染
        let proxyToUse = instance.proxy;
        const subTree = instance.subTree = instance.render.call(proxyToUse, proxyToUse);

        // 用render函数的返回值继续渲染
        patch(null, subTree, container);
        instance.isMounted = true;
      } else {
        // 更新逻辑 diff算法
      }
    }, {
      scheduler:queueJob
    })
  }

  const mountComponent = (initialVNode, container) => {
    // 组件的渲染流程 最核心调用setup 拿到返回值，获取render函数返回的结果来渲染
    // 1.现有实例
    const instance = (initialVNode.component = createComponentInstance(initialVNode))
    // 2.需要将数据解析到实例上
    setupComponent(instance); // 添加 state props attrs render 。。。
    // 3.创建一个effect， 让render函数渲染
    setupRenderEffect(instance, container);
  }

  const processComponent = (n1, n2, container) => {
    if (n1 === null) { // 组件没有上一次的虚拟节点
      mountComponent(n2, container);
    } else {
      // 组件更新流程
    }
  }

  // -------------------组件END-----------------------


  // -------------------处理元素START-----------------------
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalizeVNode(children[i]);
      patch(null, child, container);
    }
  }

  const mountElement = (vNode, container) => {
    // 递归渲染
    const { props, shapeFlag, type, children } = vNode;
    let el = vNode.el = hostCreateElement(type);

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children); // 文本
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el); // 数组
    }

    hostInsert(el, container);
  }

  const processElement = (n1, n2, container) => {
    // n1 上一次的节点，这次的节点
    if (n1 === null) {
      mountElement(n2, container);
    } else {
      console.log('更新');
      
      // 元素更新
    }
  }

  // -------------------处理元素END-----------------------


  // -------------------处理文本START---------------------
  const processText = (n1,n2,container) => {
    if (n1 === null) {
      hostInsert(n2.el = hostCreateText(n2.children), container)
    }
  }
  // -------------------处理文本END-----------------------

  const patch = (n1, n2, container) => {
    // 针对不同类型做初始化操作
    const { shapeFlag, type } = n2;
    switch (type) {
      case TEXT:
        processText(n1,n2,container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container);
        }
        break;
    }
  }

  const render = (vNode, container) => {
    // core 的核心， 根据不同的虚拟节点，创建对应的真实元素

    // 默认调用render 可能是初始化流程
    patch(null, vNode, container);


  }
  return {
    createApp: createAppAPI(render)
  }
}