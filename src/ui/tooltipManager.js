import * as DOM from './domElements.js';

let tooltip_task = null; // Stores the timeout ID for hiding the tooltip
let tooltip_update_callback = null; // Stores the callback function for updating tooltip content
let tooltip_showing = false; // Tracks if the tooltip is currently visible

/**
 * Shows the tooltip with content related to a part or tile.
 * @param {object} subject - The part, upgrade, or tile instance that the tooltip is for.
 * @param {object} [tile] - Optional tile instance, if the subject is a part placed on a tile.
 * @param {function} [updateCallback] - Optional callback to update tooltip content dynamically.
 */
function showTooltip(subject, tile = null, updateCallback = null) {
  clearTimeout(tooltip_task);

  if (!subject) {
    // If no subject, set a task to hide the tooltip (e.g., mouseout from a valid target)
    tooltip_task = setTimeout(_hideTooltip, 200);
    return;
  }

  if (!tooltip_showing) {
    if (DOM.main) DOM.main.classList.add('tooltip_showing'); // Add class to main container to show tooltip
    tooltip_showing = true;
  }

  // Store the update callback for dynamic content updates (e.g., while tooltip is visible)
  tooltip_update_callback = updateCallback;

  // Call the subject's method to populate the tooltip content.
  // This assumes subject has a method like showTooltipContent or similar.
  // This part will be more fleshed out when Part/Upgrade classes are refactored.
  if (subject && typeof subject.showTooltipContent === 'function') {
    // Pass necessary DOM elements for the subject to populate.
    // This is a placeholder for how content setup will be delegated.
    subject.showTooltipContent(tile, {
        name: DOM.tooltip_name,
        description: DOM.tooltip_description,
        cost: DOM.tooltip_cost,
        sellsWrapper: DOM.tooltip_sells_wrapper,
        sells: DOM.tooltip_sells,
        heatPer: DOM.tooltip_heat_per,
        powerPer: DOM.tooltip_power_per,
        heatPerWrapper: DOM.tooltip_heat_per_wrapper,
        powerPerWrapper: DOM.tooltip_power_per_wrapper,
        heatWrapper: DOM.tooltip_heat_wrapper,
        heat: DOM.tooltip_heat,
        maxHeat: DOM.tooltip_max_heat,
        ticksWrapper: DOM.tooltip_ticks_wrapper,
        ticks: DOM.tooltip_ticks,
        maxTicks: DOM.tooltip_max_ticks,
        chanceWrapper: DOM.tooltip_chance_wrapper,
        chance: DOM.tooltip_chance,
        chancePercentOfTotal: DOM.tooltip_chance_percent_of_total,
    });
  } else {
    // Fallback or default content if the subject doesn't handle its own tooltip content
    if (DOM.tooltip_name) DOM.tooltip_name.textContent = subject.title || subject.id || 'Unknown Item';
    if (DOM.tooltip_description) DOM.tooltip_description.textContent = subject.description || '';
    // Hide all optional sections by default if not handled by subject
    if(DOM.tooltip_cost) DOM.tooltip_cost.style.display = 'none';
    if(DOM.tooltip_sells_wrapper) DOM.tooltip_sells_wrapper.style.display = 'none';
    if(DOM.tooltip_heat_per_wrapper) DOM.tooltip_heat_per_wrapper.style.display = 'none';
    if(DOM.tooltip_power_per_wrapper) DOM.tooltip_power_per_wrapper.style.display = 'none';
    if(DOM.tooltip_heat_wrapper) DOM.tooltip_heat_wrapper.style.display = 'none';
    if(DOM.tooltip_ticks_wrapper) DOM.tooltip_ticks_wrapper.style.display = 'none';
    if(DOM.tooltip_chance_wrapper) DOM.tooltip_chance_wrapper.style.display = 'none';

  }

  // If there's an immediate update callback, call it.
  // This is for cases where the tooltip content needs to be set or updated
  // right after being shown, based on dynamic state.
  if (tooltip_update_callback) {
    tooltip_update_callback();
  }
}

/**
 * Internal function to hide the tooltip DOM element and clear state.
 */
function _hideTooltip() {
  tooltip_update_callback = null; // Clear any dynamic update callback
  if (DOM.main) DOM.main.classList.remove('tooltip_showing'); // Remove class to hide tooltip
  tooltip_showing = false;
  // console.log('Tooltip hidden by _hideTooltip');
}

/**
 * Public function to request hiding the tooltip, usually with a delay.
 * This is typically called on mouseout or blur events.
 */
function hideTooltip() {
  clearTimeout(tooltip_task);
  tooltip_task = setTimeout(_hideTooltip, 200); // Delay hiding to allow mouse travel
  // console.log('Tooltip hide requested, will hide in 200ms');
}

/**
 * Function to be called periodically if the tooltip content needs to be refreshed
 * while it's visible (e.g., for rapidly changing stats).
 */
function updateTooltipContentIfVisible() {
    if (tooltip_showing && typeof tooltip_update_callback === 'function') {
        tooltip_update_callback();
    }
}


export { showTooltip, hideTooltip, updateTooltipContentIfVisible };

console.log('tooltipManager.js loaded');
