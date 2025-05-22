/**
 * Attaches a delegated event listener to a parent element.
 * @param {Element} parentElement - The parent element to attach the listener to.
 * @param {string} selector - A CSS selector string to match the target elements.
 * @param {string} eventType - The type of event to listen for (e.g., 'click', 'mouseover').
 * @param {function} handlerFn - The event handler function. The 'this' context will be the matched target element.
 * @param {boolean} [useCapture=false] - Whether to use capture phase. Default is false.
 *                                      Focus/blur events might need true if that was the original intent.
 */
export function delegate(parentElement, selector, eventType, handlerFn, useCapture = false) {
    if (!parentElement) {
        console.warn(`delegate: Parent element not provided for selector "${selector}" and event type "${eventType}".`);
        return;
    }

    const listener = function(event) {
        // event.target is the most specific element that caught the event
        // event.currentTarget would be parentElement
        let targetElement = event.target;

        // Traverse up the DOM tree from the event target to the parentElement
        while (targetElement && targetElement !== parentElement) {
            // Check if the current element in traversal matches the selector
            if (targetElement.matches(selector)) {
                // Call the handler function with 'this' bound to the matched target element
                // and pass the event object
                handlerFn.call(targetElement, event);
                // No need to event.preventDefault() here by default, handler can do it.
                return; // Event handled, stop bubbling/further checks for this specific delegation
            }
            targetElement = targetElement.parentNode;
        }
    };

    // The original used different attachment methods for focus/blur.
    // addEventListener with useCapture=true is generally how focus/blur are delegated.
    // For other events, false (bubbling phase) is standard.
    if (eventType === 'focus' || eventType === 'blur') {
        // Note: Original code used this.addEventListener(type, onfn, true);
        // For consistency, we'll use the passed useCapture, but default it to true for focus/blur if not specified.
        parentElement.addEventListener(eventType, listener, useCapture || true);
    } else {
        parentElement.addEventListener(eventType, listener, useCapture);
    }
}

/**
 * Shorthand for document.createElement.
 * @param {string} tagName - The HTML tag name for the element to create.
 * @returns {Element} The created DOM element.
 */
export function createElement(tagName) {
    return document.createElement(tagName);
}

/**
 * Shorthand for document.getElementById.
 * Not strictly necessary as getElementById is short, but included if a consistent '$' like utility is desired.
 * @param {string} id - The ID of the element to select.
 * @returns {Element|null} The selected DOM element or null if not found.
 */
export function $(id) {
    return document.getElementById(id);
}

console.log('domUtils.js loaded');
