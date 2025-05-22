// Moved from js/app.globals.js

// Buffer to reduce unneeded updates for properties managed by addPropertyTo
const property_buffer = new Map();

/**
 * Dynamically adds a property to an object with a setter that buffers updates.
 * Also adds a flag 'propertyNameUpdated' and 'propertyNameLast'.
 * @param {object} obj - The object to add the property to.
 * @param {string} name - The name of the property.
 * @param {*} initialValue - The initial value of the property.
 */
export function addPropertyTo(obj, name, initialValue) {
    if (obj === null || typeof obj !== 'object') {
        console.error('addPropertyTo: obj must be an object.');
        return;
    }
    if (typeof name !== 'string' || name === '') {
        console.error('addPropertyTo: name must be a non-empty string.');
        return;
    }

    const privatePropName = `_${name}`; // Convention for private storage
    const updatedFlagName = `${name}Updated`;
    const lastValueName = `${name}Last`;

    obj[privatePropName] = initialValue;
    obj[updatedFlagName] = true; // Initially true to ensure UI picks it up
    obj[lastValueName] = undefined; // Or initialValue if appropriate for 'Last' logic

    Object.defineProperty(obj, name, {
        get() {
            return this[privatePropName];
        },
        set(value) {
            if (value !== this[privatePropName]) {
                this[privatePropName] = value;
                // Instead of a direct setter like 'setTicks', this now buffers the update.
                // The original 'setTicks' logic was:
                // if ( value !== this[name] ) { this[name] = value; property_buffer.set(this, [name, value]) }
                // This is slightly different as we're directly setting the private prop.
                // The key for property_buffer should be the object itself, and the value an array/object
                // identifying the property and its new value.
                
                // Store the object and an array of changes if multiple props are set in one go
                if (!property_buffer.has(obj)) {
                    property_buffer.set(obj, []);
                }
                // Avoid duplicate entries for the same property in the current buffer processing cycle
                const changes = property_buffer.get(obj);
                const existingChange = changes.find(c => c.name === name);
                if (existingChange) {
                    existingChange.value = value;
                } else {
                    changes.push({ name, value });
                }
            }
        },
        configurable: true, // Allow redefinition if necessary
        enumerable: true
    });
}

/**
 * Processes the property_buffer to update 'Updated' flags.
 * This function should be called periodically (e.g., in the UI update loop)
 * to batch UI updates.
 */
export function processBufferedProperties() {
    for (const [obj, changes] of property_buffer) {
        for (const change of changes) {
            const { name, value } = change;
            const updatedFlagName = `${name}Updated`;
            const lastValueName = `${name}Last`;

            if (value !== obj[lastValueName]) {
                obj[lastValueName] = value;
                obj[updatedFlagName] = true;
            }
        }
    }
    property_buffer.clear();
}

// The original global updateProperty was called by the UI loop.
// Now, processBufferedProperties should be called.
// The original addProperty also created a specific setter e.g., obj.setTicks().
// The new addPropertyTo using defineProperty's set handles this directly.

console.log('objectUtils.js loaded');
