export const patchStyle = (el: HTMLElement, prev, next) => {
  const style = el.style;

  if (next === null) {
    el.removeAttribute('style')
  } else {
    // 老的里有新的里没有
    if (prev) {
      for(let key in prev) {
        if (next[key] === null) {
          style[key] = '';
        }
      }
    }

    // 新的style赋值到style上
    for(let key in next) {
      style[key] = next[key];
    }
  }
}