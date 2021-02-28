import { isFunction } from "@vue/shared/src";
import { effect, track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operators";

class ComputedRefImpl {
  public _dirty = true; // 默认取值时不用缓存
  public _value;
  public effect;
  constructor(getter, public setter) { // ts中默认不会挂载到this上
    this.effect = effect(getter,{
      lazy: true,
      scheduler: ()=>{
        if (!this._dirty) {
          this._dirty = true;
          trigger(this, TriggerOpTypes.SET, 'value');
        }
      }
    });
  }

  get value() {
    if (this._dirty) {
      this._value = this.effect();
      this._dirty = false;
    }

    track(this,TrackOpTypes.GET, 'value');
    return this._value
  }

  set value(newValue) {
    this.setter(newValue)
  }

}

// vue2 与 vue3 原理不一致
export function computed(getterOrOptions) {
  let getter;
  let setter;

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
      console.log('computed value must be readonly');
    }
  }else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
}