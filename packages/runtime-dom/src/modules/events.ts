interface el extends HTMLElement {
  _vei: any
}
export const patchEvent = (el:el, key, value) => {
  /**
   * 给元素一个绑定事件列表
   * 如果缓存中没有数据，value有值  需要绑定方法，并缓存起来
   * 以前绑定过，需要删除掉， 删除缓存
   * 
  */
  // 对函数缓存
  const invokers =  el._vei || (el._vei = {});
  const exists = invokers[key];// 判断存在事件

  if ( value && exists) {
    exists.value = value;
  }else {
    const eventName = key.slice(2).toLowerCase();

    if (value) {
      let invoker = invokers[key] = createInvoker(value);
      el.addEventListener(eventName, invoker)
      // invokers[eventName] = invoker;
    }else{
      el.removeEventListener(eventName,exists);
      invokers[key] = undefined;
    }
  }
}


function createInvoker(value) {
  const invoker = (e) => {
    invoker.value(e);
  }
  invoker.value = value;

  return invoker;
}