const cacheStore = new Map();
export function cache(duration) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const cacheKey = Symbol();
        descriptor.value = function (...args) {
            const key = JSON.stringify([cacheKey, ...args]);
            const now = Date.now();
            if (cacheStore.has(key)) {
                const { value, expiry } = cacheStore.get(key);
                if (now < expiry) {
                    return value;
                }
            }
            const result = originalMethod.apply(this, args);
            cacheStore.set(key, { value: result, expiry: now + duration });
            return result;
        };
        return descriptor;
    };
}
