/**
 * Ensures that a function is executed "only after a specified delay" has passed since the last time the event occurred.
 * It waits for the user to stop typing before executing the function (API req).
 * EX: If the user types 10 chars in 1 second, the function will be called "ONCE", 300ms after user stop typing.
 */
export function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}
