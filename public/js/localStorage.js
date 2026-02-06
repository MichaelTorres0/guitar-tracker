// Cross-platform localStorage helper
// Works in both browser and Node.js test environments

function getLocalStorage() {
    // Check globalThis first (works in both browser and Node.js)
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
        return globalThis.localStorage;
    }
    // Then check window (browser fallback)
    if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
    }
    // Finally check bare localStorage (browser global)
    if (typeof localStorage !== 'undefined') {
        return localStorage;
    }
    return null;
}

// Export a wrapper object with localStorage-compatible API
export const ls = {
    getItem(key) {
        const storage = getLocalStorage();
        return storage ? storage.getItem(key) : null;
    },
    setItem(key, value) {
        const storage = getLocalStorage();
        if (storage) storage.setItem(key, value);
    },
    removeItem(key) {
        const storage = getLocalStorage();
        if (storage) storage.removeItem(key);
    },
    clear() {
        const storage = getLocalStorage();
        if (storage) storage.clear();
    }
};

export default ls;
