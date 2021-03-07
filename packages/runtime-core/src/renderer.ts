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
    nextSibling: hostNextSibling,
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
        const prevTree = instance.subTree;
        let proxyToUse = instance.proxy;
        const nextTree = instance.render.call(proxyToUse, proxyToUse);

        patch(prevTree, nextTree, container)
      }
    }, {
      scheduler: queueJob
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

  const mountElement = (vNode, container, anchor = null) => { // 初始化操作
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

    hostInsert(el, container, anchor);
  }
  const patchProps = (oldProps, newProps, el) => { // 更新本身属性
    // 元素对比属性
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];

        if (prev !== next) {
          hostPatchProp(el, key, prev, next);
        }
      }

      for (let key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  }
  const patchKeyedChildren = (c1, c2, el) => {
    /**
     * 减小比对范围
     * 1. 从头比较
     * 2. 从尾比较
     * 3. 可能一方已经完全比对完成 同序列加挂载
    */

    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    // sync from start
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }

    // sync from end
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // console.log(e1, e2, i);

    // 前提有一方被比完
    // common sequence + common  同序列加挂载
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }

    } else {
      // 乱序比较，尽可能复用，用新元素做成一个映射表去老的里面找
      let s1 = i;
      let s2 = i;

      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const childVNode = c2[i];
        keyToNewIndexMap.set(childVNode.key, i);
      }

      const toBePatched = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

      // 老的里面查找，有没有复用的
      for (let i = s1; i <= e1; i++) {
        const oldVNode = c1[i];
        let newIndex = keyToNewIndexMap.get(oldVNode.key);
        if (newIndex === undefined) { // 老的不在新的里面
          unmount(oldVNode);
        } else {
          // 新的和旧的关系，索引关系
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(oldVNode, c2[newIndex], el);
        }
      }

      for (let i = toBePatched - 1; i >= 0; i--) {
        let currentIndex = i + s2; // 找到h对应的索引
        let child = c2[currentIndex];// 找到h对应的节点
        let anchor = currentIndex + 1 < c2.length ? c2[currentIndex+1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          // 是0说明之前不存在
          patch(null, child, el, anchor);
        }else {
          hostInsert(child.el, el, anchor);
        }
      }


      // 最后就是移动节点，将新增的节点插入


    }



  }
  const unmountChildren = (children) => {
    // 数组类型遍历卸载
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  }
  const patchChildren = (n1, n2, el) => { // 更新子节点
    const c1 = n1.children;
    const c2 = n2.children;


    /** 对比有无子元素 */
    const prevShapeFlag = n1.shapeFlag;
    const nextShapeFlag = n2.shapeFlag;

    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老类型不一定，新的是文字
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      if (c2 !== c1) {
        hostSetElementText(el, c2);
      }
    } else {
      // 新的不是文字，是数组或空
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 上一次是数组
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 当前是数组，之前是数组，diff核心
          patchKeyedChildren(c1, c2, el);
        } else {
          // 当前不是数组，不是文字，没有子元素null
          unmountChildren(c1);
        }
      } else {
        // 上一次是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '');
        }
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  }

  const patchElement = (n1, n2, container) => { // 元素更新处理
    // 相同元素节点
    let el = (n2.el = n1.el);

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  }

  const processElement = (n1, n2, container, anchor = null) => {// 元素渲染更新处理
    // n1 上一次的节点，这次的节点
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      // 元素更新
      patchElement(n1, n2, container);
    }
  }

  // -------------------处理元素END-----------------------


  // -------------------处理文本START---------------------
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      hostInsert(n2.el = hostCreateText(n2.children), container)
    }
  }
  // -------------------处理文本END-----------------------

  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key
  }
  const unmount = (n1) => {
    // 如果是组件，调用组件的生命周期
    hostRemove(n1.el);
  }

  const patch = (n1, n2, container, anchor = null) => {
    // 针对不同类型做初始化操作
    const { shapeFlag, type } = n2;

    if (n1 && !isSameVNodeType(n1, n2)) {
      // 新旧节点的type和key 都相同，相同的组件，或者元素
      anchor = hostNextSibling(n1.el);
      unmount(n1);
      n1 = null; // 重新渲染n2对应的内容
    }


    switch (type) {
      case TEXT:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
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