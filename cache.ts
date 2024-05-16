export function cache(duration: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheKey = Symbol();

    descriptor.value = function (...args: any[]) {
      if (!this[cacheKey]) {
        this[cacheKey] = new Map();
      }

      const key = JSON.stringify(args);
      const now = Date.now();

      if (this[cacheKey].has(key)) {
        const { value, expiry } = this[cacheKey].get(key);
        if (now < expiry) {
          return value;
        }
      }

      const result = originalMethod.apply(this, args);
      this[cacheKey].set(key, { value: result, expiry: now + duration });

      return result;
    };

    return descriptor;
  };
}
