import { createVNode } from "./vNode";

export function createAppAPI(render) { // 为了render分离包裹一层
  return function createApp(rootComponent, rootProps) { // 哪个组件，哪个属性创建应用
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,
      mount(container) {// 挂载的目的地
        // let vNode = {};
        // render(vNode, container)

        // 根据组件创建虚拟节点
        // 将虚拟节点和容器获取到都调用render方法进行渲染

        // 创建虚拟节点

        // 调用render
        const vNode = createVNode(rootComponent, rootProps)

        render(vNode, container)
        

        app._container = container
      }
    }
    return app;
  }
}