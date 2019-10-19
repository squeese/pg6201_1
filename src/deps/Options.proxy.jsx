export const changeProxy = (function () {
  function type(val) {
    return Object.prototype.toString.call(val).slice(8, -1);
  }
  type.ARRAY = 'Array';
  type.FUNCTION = 'Function';
  type.OBJECT = 'Object';
  type.MAP = 'Map';
  type.NUMBER = 'Number';
  type.STRING = 'String';
  const read = (fn, key) => fn.state ? fn.state[key] : fn(read)[key];
  const prime = (fn, key) => {
    fn.node = fn.state ? fn.state : fn(prime);
    return fn.node[key];
  };
  const swap = (o, key, value) => {
    if (type(o) === type.OBJECT) {
      if (value === undefined) {
        const { [key]: _, ...rest } = o;
        return rest;
      } else return { ...o, [key]: value };
    }
    if (type(o) === type.ARRAY) {
      const arr = [...o];
      if (value !== undefined) arr[key] = value;
      return arr;
    }
    return (value === undefined) ? {} : { [key]: value };
  };
  const update = (fn, key, val) => {
    if (fn.state) {
      fn.state = swap(fn.node, key, val);
      return;
    }
    return fn(update, swap(fn.node, key, val));
  };
  const set = (fn, value) => {
    const current = fn(prime);
    value = typeof value === 'function' ? value(current) : value;
    if (value !== current) {
      fn(update, value);
      return true;
    }
    return false;
  };
  const push = (fn, args) => {
    if (args.length === 0) return false;
    fn(update, fn(prime).concat(args));
    return true;
  };
  const splice = (fn, args) => {
    if (args.length === 0) return false;
    let arr = fn(prime).slice(0);
    arr.splice(...args);
    fn(update, arr);
    return true;
  };
  const leafHandlers = {
    apply: target => target(read),
    set(target, key, value, p) {
      p[key].set(value);
      return true;
    },
    get(target, key) {
      switch (key) {
        case "read": return () => target(read);
        case "set": return value => set(target, value);
        case "push": return (...args) => push(target, args);
        case "splice": return (...args) => splice(target, args);
        case "delete": return () => set(target, undefined);
        default: return getLeafProxy(target, key);
      }
    },
    deleteProperty(target, key) {
      getLeafProxy(target, key).delete();
      return true;
    }
  };
  const getLeafProxy = (target, key) => {
    if (!target.proxies[key]) {
      const fn = (action, val) => action(target, key, val);
      fn.proxies = {};
      target.proxies[key] = new Proxy(fn, leafHandlers);
    }
    return target.proxies[key];
  };
  const rootHandlers = {
    apply: target => target.state,
    set: (target, key, value) => {
      getLeafProxy(target, key).set(value);
      return true;
    },
    get: (target, key) => key === 'state' ? target.state : getLeafProxy(target, key, true),
    deleteProperty: (target, key) => {
      getLeafProxy(target, key).delete();
      return true;
    }
  };
  return state => {
    const fn = () => { };
    fn.state = state;
    fn.proxies = {};
    return new Proxy(fn, rootHandlers);
  };
})();