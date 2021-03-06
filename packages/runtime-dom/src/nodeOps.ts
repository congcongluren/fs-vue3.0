export const nodeOps = {
  // createElement ,  不同平台创建元素方式不同
  // 元素操作
  createElement: tagName => document.createElement(tagName),
  remove: (child: HTMLElement )=> {
    const parent = child.parentNode;
    if(parent) {
      parent.removeChild(child);
    }
  },
  insert: (child, parent, anchor=null) => {
    parent.insertBefore(child, anchor);
  },
  querySelector: selector=> document.querySelector(selector),
  // 文本操作
  setElementText: (el, text) => el.textContent = text,
  createText: text=> document.createTextNode(text),
  setText: (node, text)=>node.value = text,
  nextSibling:(node) => node.nextSibling
}