import { hasChanged, isArray, isObject } from "@vue/shared/src";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operators";
import { reactive } from "./reactive";

export function ref(value) {
  // 将普通类型 变成一个对象
  return createRef(value);
}
// ref 内部使用defineProperty

export function shallowRef(value) {
  return createRef(value, true);
}

const convert = (val) => isObject(val) ? reactive(val): val; 
class RefImpl {
  public _value;
  public __v_isRef = true; // 产生的实例会添加这个属性， 判断是否是ref类
  constructor(public rawValue, public shallow) {
    this._value = shallow ? rawValue : convert(rawValue); 

  }

  get value() {
    track(this, TrackOpTypes.GET, 'value');
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this.rawValue)) {
      this.rawValue = newValue; // 新值作为老值
      this._value = newValue;
      trigger(this, TriggerOpTypes.SET, 'value', newValue);
    }
  }
}

function createRef(rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow)
}

class ObjectRefImpl{
  public _value;
  public __v_isRef = true; // 产生的实例会添加这个属性， 判断是否是ref类
  constructor(public target, public key){

  }

  get value() {
    return this.target[this.key];
  }

  set value(newValue) {
    this.target[this.key] = newValue
  }
}

export function toRef(target, key) {
  // 可以将一个对象的值变成ref类型
  return new ObjectRefImpl(target, key);
}

export function toRefs(object) { // object 可能传递一个数组，或者对象
  const ret = isArray(object) ? new Array(object.length) : {} ;
  for(let key in object) {
    ret[key] = toRef(object, key);
  }
  return ret
}