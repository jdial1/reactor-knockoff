import * as DOM from '../ui/domElements.js'; // Assuming DOM elements are needed
import { fmt } from '../../utils/numberFormatting.js';
// import game from '../game/gameState.js'; // If game state is needed (e.g. for multipliers)


// Original single_cell_description and multi_cell_description from app.js
const single_cell_description_template = 'Produces %power power and %heat heat per tick. Lasts for %ticks ticks.';
const multi_cell_description_template = 'Acts as %count %type cells. Produces %power power and %heat heat per tick.';


/**
 * Updates the description for a part based on its properties and a tile (if provided).
 * This is extracted from the original Part.prototype.updateDescription.
 * @param {object} partInstance - The instance of the part.
 * @param {object} [tileInstance] - Optional tile instance where the part is placed.
 * @param {object} gameInstance - The main game instance for accessing global multipliers.
 * @returns {string} The updated description string.
 */
function getPartDescription(partInstance, tileInstance = null, gameInstance = null) {
    if (!partInstance || !partInstance.part) return ''; // partInstance.part holds the base definition

    let description = partInstance.part.base_description || ''; // Start with base description

    // Replace general placeholders
    description = description
        .replace(/%single_cell_description/g, single_cell_description_template)
        .replace(/%multi_cell_description/g, multi_cell_description_template)
        .replace(/%power_increase/g, fmt(partInstance.power_increase))
        .replace(/%heat_increase/g, fmt(partInstance.heat_increase))
        .replace(/%reactor_power/g, fmt(partInstance.reactor_power))
        .replace(/%reactor_heat/g, fmt(partInstance.reactor_heat))
        .replace(/%ticks/g, fmt(partInstance.ticks))
        .replace(/%containment/g, fmt(partInstance.containment))
        .replace(/%ep_heat/g, fmt(partInstance.ep_heat))
        .replace(/%range/g, fmt(partInstance.range))
        .replace(/%count/g, partInstance.part.level ? [1, 2, 4][partInstance.part.level - 1] : 1) // Original level access
        .replace(/%power/g, fmt(partInstance.power))
        .replace(/%heat/g, fmt(partInstance.heat));

    // Conditional replacements based on tileInstance and gameInstance (for multipliers)
    let transfer_multiplier_val = 0;
    let vent_multiplier_val = 0;

    if (gameInstance) {
        // These multipliers are calculated in update_tiles based on active capacitors/plating
        // For an individual part's tooltip *not* on a tile, these might be considered 0
        // or we might need a way to get the current global effective multipliers.
        // For now, assume they are 0 if not on a tile or gameInstance not fully there.
        // When on a tile, these multipliers are dynamic based on game state.
        // The original code in Part.prototype.updateDescription used global transfer_multiplier / vent_multiplier
        // which were updated by update_tiles(). This is a tricky dependency.
        // A simple approach: if on a tile, use gameInstance's current values.
        // If just showing a part from the shop, these might not apply or be shown as base values.
        // For now, let's assume gameInstance holds the current effective multipliers if available.
        transfer_multiplier_val = gameInstance.current_transfer_multiplier || 0;
        vent_multiplier_val = gameInstance.current_vent_multiplier || 0;
    }


    if (tileInstance) { // If the part is on a tile, multipliers might apply
        description = description
            .replace(/%transfer/g, fmt(partInstance.transfer * (1 + transfer_multiplier_val / 100)))
            .replace(/%vent/g, fmt(partInstance.vent * (1 + vent_multiplier_val / 100)));
    } else { // If just showing the part from the shop, show base values
        description = description
            .replace(/%transfer/g, fmt(partInstance.transfer))
            .replace(/%vent/g, fmt(partInstance.vent));
    }

    // For multi-level parts like Dual/Quad cells
    if (partInstance.part.level > 1 && gameInstance && gameInstance.part_objects) {
        const baseTypePart = gameInstance.part_objects[partInstance.part.type + '1']; // e.g. cell1 for cell2
        if (baseTypePart && baseTypePart.part) {
            description = description.replace(/%type/g, baseTypePart.part.title);
        } else {
             description = description.replace(/%type/g, partInstance.part.type || 'cell');
        }
    } else {
         description = description.replace(/%type/g, partInstance.part.type || 'cell');
    }

    return description;
}


/**
 * Sets up the content for a part's tooltip.
 * Extracted from Part.prototype.showTooltip
 * @param {object} partInstance - The instance of the part.
 * @param {object} [tileInstance] - Optional tile instance if the part is on a tile.
 * @param {object} gameInstance - The main game instance.
 */
export function setupPartTooltipContent(partInstance, tileInstance, gameInstance) {
    if (!partInstance || !partInstance.part) return;

    DOM.tooltip_name.textContent = partInstance.part.title || 'Unknown Part';
    
    const description = getPartDescription(partInstance, tileInstance, gameInstance);
    DOM.tooltip_description.textContent = description;


    if (tileInstance) { // Part is on a tile
        DOM.tooltip_cost.style.display = 'none'; // No cost shown for placed parts
        DOM.tooltip_sells_wrapper.style.display = (tileInstance.activated && partInstance.part.category !== 'cell') ? '' : 'none';
        DOM.tooltip_heat_wrapper.style.display = (tileInstance.activated && partInstance.part.containment) ? '' : 'none';
        DOM.tooltip_ticks_wrapper.style.display = (tileInstance.activated && partInstance.part.ticks) ? '' : 'none';
        DOM.tooltip_heat_per_wrapper.style.display = (tileInstance.activated && partInstance.part.heat) ? '' : 'none';
        DOM.tooltip_power_per_wrapper.style.display = (tileInstance.activated && partInstance.part.power) ? '' : 'none';
        DOM.tooltip_chance_wrapper.style.display = (tileInstance.activated && partInstance.part.category === 'particle_accelerator') ? '' : 'none';
        
        updatePartTooltipContent(partInstance, tileInstance, gameInstance); // Call update for dynamic values

    } else { // Part is in the shop
        DOM.tooltip_cost.style.display = '';
        DOM.tooltip_sells_wrapper.style.display = 'none';
        DOM.tooltip_heat_wrapper.style.display = 'none';
        DOM.tooltip_ticks_wrapper.style.display = 'none';
        DOM.tooltip_heat_per_wrapper.style.display = 'none';
        DOM.tooltip_power_per_wrapper.style.display = 'none';
        DOM.tooltip_chance_wrapper.style.display = 'none';

        updatePartTooltipContent(partInstance, null, gameInstance); // Call update for cost, etc.
    }
}

/**
 * Updates the dynamic content of a part's tooltip.
 * Extracted from Part.prototype.updateTooltip
 * @param {object} partInstance - The instance of the part.
 * @param {object} [tileInstance] - Optional tile instance.
 * @param {object} gameInstance - The main game instance.
 */
export function updatePartTooltipContent(partInstance, tileInstance, gameInstance) {
    if (!partInstance || !partInstance.part) return;

    // Update description if it can change dynamically (e.g. due to global multipliers)
    // For now, getPartDescription is called in setupPartTooltipContent. If it needs to be dynamic while open:
    // DOM.tooltip_description.textContent = getPartDescription(partInstance, tileInstance, gameInstance);

    if (tileInstance) { // Part is on a tile
        if (tileInstance.activated && partInstance.part.containment) {
            DOM.tooltip_heat.textContent = fmt(tileInstance.heat_contained);
            DOM.tooltip_max_heat.textContent = fmt(partInstance.part.containment);
        }
        if (tileInstance.activated && partInstance.part.ticks) {
            DOM.tooltip_ticks.textContent = fmt(tileInstance.ticks);
            DOM.tooltip_max_ticks.textContent = fmt(partInstance.part.ticks);
        }
        if (tileInstance.activated && partInstance.part.heat) {
            DOM.tooltip_heat_per.textContent = fmt(tileInstance.display_heat);
        }
        if (tileInstance.activated && partInstance.part.power) {
            DOM.tooltip_power_per.textContent = fmt(tileInstance.display_power);
        }
        if (tileInstance.activated && partInstance.part.category !== 'cell') {
            if (partInstance.part.ticks) { // For parts that expire by ticks (not cells)
                DOM.tooltip_sells.textContent = fmt(Math.ceil(tileInstance.ticks / partInstance.part.ticks * partInstance.part.cost));
            } else if (partInstance.part.containment) { // For parts that degrade by heat contained
                DOM.tooltip_sells.textContent = fmt(partInstance.part.cost - Math.ceil(tileInstance.heat_contained / partInstance.part.containment * partInstance.part.cost));
            } else { // For other non-cell parts
                DOM.tooltip_sells.textContent = fmt(partInstance.part.cost);
            }
        }
        if (tileInstance.activated && partInstance.part.category === 'particle_accelerator') {
            DOM.tooltip_chance.textContent = fmt(tileInstance.display_chance);
            DOM.tooltip_chance_percent_of_total.textContent = fmt(tileInstance.display_chance_percent_of_total);
        }
    } else { // Part is in the shop
        // Check for research requirements (erequires)
        if (partInstance.part.erequires && gameInstance && gameInstance.upgrade_objects &&
            (!gameInstance.upgrade_objects[partInstance.part.erequires] || !gameInstance.upgrade_objects[partInstance.part.erequires].level)
        ) {
            DOM.tooltip_cost.textContent = 'LOCKED';
        } else {
            DOM.tooltip_cost.textContent = fmt(partInstance.cost);
        }
    }
}

console.log('partTooltipLogic.js loaded');
