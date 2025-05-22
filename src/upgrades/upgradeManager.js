import Upgrade from './Upgrade.js';
import { upgradeEffects } from './upgradeEffects.js';
// No direct DOM manipulation here, so domElements.js is not needed.
// fmt can be imported if needed for display_cost formatting within this file, but Upgrade.js handles it.

/**
 * Creates an Upgrade instance from raw data and associates its effect.
 * @param {object} rawUpgradeDataItem - The raw data for the upgrade.
 * @param {object} gameInstance - The main game instance.
 * @returns {Upgrade} The created Upgrade instance.
 */
export function createUpgrade(rawUpgradeDataItem, gameInstance) {
    const upgradeInstance = new Upgrade(rawUpgradeDataItem, gameInstance);

    // Associate the effect function
    // The effect function is determined by the upgrade's ID.
    // If the ID matches a key in upgradeEffects, that function is used.
    // For dynamically generated IDs (like cell_power_uranium), we might need a more generic key
    // or the rawUpgradeDataItem should hint at its effect type.
    
    let effectFn = upgradeEffects[rawUpgradeDataItem.id];

    if (!effectFn) {
        // Handle dynamically generated upgrade IDs (e.g., cell_power_TYPE, cell_tick_TYPE)
        // These were generated with a common onclick in the original data.
        if (rawUpgradeDataItem.id.startsWith('cell_power_')) {
            effectFn = upgradeEffects.cell_power_generic;
        } else if (rawUpgradeDataItem.id.startsWith('cell_tick_')) {
            effectFn = upgradeEffects.cell_tick_generic;
        } else if (rawUpgradeDataItem.id.startsWith('cell_perpetual_')) {
            effectFn = upgradeEffects.cell_perpetual_generic;
        } else if (rawUpgradeDataItem.id.startsWith('improved_particle_accelerators')) {
            // This was already handled by dynamic generation in upgradeEffects.js
            // So, improved_particle_accelerators1, etc., should exist directly.
        } else if (rawUpgradeDataItem.type === 'experimental_parts' && rawUpgradeDataItem.id !== 'heat_reflection' /* and other specific named ones */) {
            // A more generic way to handle experimental parts that just call epart_onclick
            // The specific named ones like 'heat_reflection' might have their own entry or use this.
            // For now, let's assume 'experimental_part_unlock' is a key for these.
            // The original used 'game.epart_onclick(upgrade)' for many.
            // Let's assume the specific IDs are in upgradeEffects, or we add a generic one.
            // The current upgradeEffects.js uses experimental_part_unlock for this.
             if (upgradeEffects.experimental_part_unlock && 
                ['heat_reflection', 'experimental_capacitance', 'vortex_cooling', 
                 'underground_heat_extraction', 'vortex_extraction', 'explosive_ejection',
                 'thermionic_conversion', 'micro_capacitance', 'singularity_harnessing']
                 .includes(rawUpgradeDataItem.id)) {
                effectFn = upgradeEffects.experimental_part_unlock;
            }
        }
    }

    if (typeof effectFn === 'function') {
        upgradeInstance.applyEffect = effectFn;
    } else {
        // console.warn(`No effect function found for upgrade ID: ${rawUpgradeDataItem.id}`);
        // It's okay if some upgrades don't have direct effects (e.g., 'laboratory' which just unlocks others)
        // or if their effect is passive and checked directly (e.g. game.upgrade_objects['some_id'].level > 0)
        if(rawUpgradeDataItem.onclick) { // If original data had an onclick and we missed it
             // console.warn(`Upgrade ${rawUpgradeDataItem.id} had an onclick but no mapped effect.`);
        }
    }
    
    return upgradeInstance;
}

/**
 * Updates the cost of experimental parts based on how many have been purchased.
 * Original was game.epart_onclick.
 * @param {object} gameInstance - The main game instance.
 * @param {Upgrade} purchasedUpgradeInstance - The experimental part upgrade that was just purchased.
 */
export function updateExperimentalPartCosts(gameInstance, purchasedUpgradeInstance) {
    let experimentalPartsPurchasedCount = 0;
    gameInstance.upgrade_objects_array.forEach(upg => {
        if (upg.upgrade.type === 'experimental_parts' && upg.level > 0) {
            experimentalPartsPurchasedCount++;
        }
    });

    gameInstance.upgrade_objects_array.forEach(upg => {
        if (upg.upgrade.type === 'experimental_parts' && upg.level === 0) { // Only update unpurchased ones
            // The cost increases based on how many are *already* purchased.
            // So, for the next one to be purchased, the count is current.
            // If an upgrade was just purchased, this count already includes it.
            // The original logic: ecost * (eparts_count + 1)
            // If eparts_count is # already bought, for the *next* one, multiplier is (eparts_count + 1)
            // Let's adjust eparts_count for calculation if the purchased one is already in the count.
            // This function is called *after* the level of purchasedUpgradeInstance is incremented.
            
            // The cost should be base_ecost * (count_of_already_bought_experimental_parts + 1)
            // The 'experimentalPartsPurchasedCount' already includes the one just bought.
            // So, for others not yet bought, their cost should be base_ecost * (experimentalPartsPurchasedCount + 1)
            // if they were the *next* to be bought after the current set.
            // If we are recalculating all *unpurchased* costs:
            // Their new cost is base_ecost * (already_purchased_count + 1)
            
            // Let's assume upg.upgrade.ecost is the base EP cost from upgradeData.
            upg.ecost = Math.ceil((upg.upgrade.ecost || 0) * (experimentalPartsPurchasedCount +1)); // Cost for the *next* one
            upg.display_cost = upg.ecost; // Update display cost; formatting handled by tooltip/UI
            
            // If this upgrade is the one just purchased, its cost for the *next* level (if any)
            // should actually be base_ecost * (count_including_this_one + 1)
            // However, setLevel on the Upgrade instance already recalculates its own next level cost.
            // This function primarily updates costs of *other* unpurchased experimental_parts upgrades.
        }
    });
     // console.log("Experimental part costs updated.");
}


/**
 * Checks and updates the 'affordable' state for all upgrades.
 * Original was window.check_upgrades_affordability.
 * @param {object} gameInstance - The main game instance.
 */
export function checkAllUpgradesAffordability(gameInstance) {
    if (!gameInstance || !gameInstance.upgrade_objects_array) return;

    gameInstance.upgrade_objects_array.forEach(upgrade => {
        const canAfford = upgrade.canAfford(); // Use method from Upgrade class
        upgrade.setAffordable(canAfford); // This will set affordableUpdated if state changes
    });
    // console.log("Checked affordability for all upgrades.");
}

console.log('upgradeManager.js loaded');
