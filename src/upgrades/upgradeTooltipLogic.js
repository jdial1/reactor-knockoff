import * as DOM from '../ui/domElements.js'; // Assuming DOM elements are needed
import { fmt } from '../../utils/numberFormatting.js';
// import game from '../game/gameState.js'; // If game state is needed


/**
 * Sets up the content for an upgrade's tooltip.
 * Extracted from Upgrade.prototype.showTooltip
 * @param {object} upgradeInstance - The instance of the upgrade.
 * @param {object} gameInstance - The main game instance (for context, e.g. currency).
 */
export function setupUpgradeTooltipContent(upgradeInstance, gameInstance) {
    if (!upgradeInstance || !upgradeInstance.upgrade) return;

    DOM.tooltip_name.textContent = upgradeInstance.upgrade.title || 'Unknown Upgrade';

    // Hide sections not relevant to upgrades by default
    DOM.tooltip_cost.style.display = ''; // Upgrades always show cost
    DOM.tooltip_sells_wrapper.style.display = 'none';
    DOM.tooltip_heat_per_wrapper.style.display = 'none';
    DOM.tooltip_power_per_wrapper.style.display = 'none';
    DOM.tooltip_heat_wrapper.style.display = 'none';
    DOM.tooltip_ticks_wrapper.style.display = 'none';
    DOM.tooltip_chance_wrapper.style.display = 'none';
    
    updateUpgradeTooltipContent(upgradeInstance, gameInstance); // Call update for dynamic values like cost
}

/**
 * Updates the dynamic content of an upgrade's tooltip.
 * Extracted from Upgrade.prototype.updateTooltip
 * @param {object} upgradeInstance - The instance of the upgrade.
 * @param {object} gameInstance - The main game instance.
 */
export function updateUpgradeTooltipContent(upgradeInstance, gameInstance) {
    if (!upgradeInstance || !upgradeInstance.upgrade) return;

    DOM.tooltip_description.textContent = upgradeInstance.upgrade.description || '';

    if (upgradeInstance.ecost) { // Check if it's an Exotic Particle cost
        DOM.tooltip_cost.textContent = `${fmt(upgradeInstance.display_cost)} EP`;
    } else {
        DOM.tooltip_cost.textContent = fmt(upgradeInstance.display_cost); // Assumes display_cost is pre-formatted or just a number
    }
}

console.log('upgradeTooltipLogic.js loaded');
