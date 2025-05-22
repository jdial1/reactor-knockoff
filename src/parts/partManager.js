import Part from './Part.js';
// import { rawPartData } from './partData.js'; // Not directly needed here, but by Game class

// Constants for part creation, moved from js/app.js
const cell_prefixes = ['', 'Dual ', 'Quad '];
const prefixes = ['Basic ', 'Advanced ', 'Super ', 'Wonderous ', 'Ultimate ']; // For non-cell parts
const cell_power_multipliers = [1, 4, 12]; // Corresponds to levels 1, 2, 3 for cells
const cell_heat_multipliers = [1, 8, 36];  // Corresponds to levels 1, 2, 3 for cells
const cell_counts = [1, 2, 4, 9, 16]; // Original had 9, 16 for levels 4,5 but cells usually up to 3. For now, stick to original values if createPart handles >3 levels.
                                      // The provided rawPartData only has cells up to level 3.
                                      // If levels > 3 are used for cells, these arrays need extension or logic adjustment.

/**
 * Creates a new part instance from raw part settings and level.
 * @param {object} rawPartSetting - The base settings for the part from rawPartData.
 * @param {number} [level=1] - The level of the part to create.
 * @param {object} gameInstance - The main game instance.
 * @returns {Part} The created Part instance.
 */
export function createPart(rawPartSetting, level = 1, gameInstance) {
    const partDefinition = { ...rawPartSetting }; // Clone to avoid modifying raw data

    // Properties to be calculated based on level
    const calculatedProps = {
        id: partDefinition.id, // Default to base id
        title: partDefinition.title,
        cost: partDefinition.base_cost,
        ticks: partDefinition.base_ticks,
        containment: partDefinition.base_containment,
        reactor_power: partDefinition.base_reactor_power,
        reactor_heat: partDefinition.base_reactor_heat,
        transfer: partDefinition.base_transfer,
        vent: partDefinition.base_vent,
        ep_heat: partDefinition.base_ep_heat,
        power_increase: partDefinition.base_power_increase,
        heat_increase: partDefinition.base_heat_increase, // Retain base if no specific logic for level
        power: partDefinition.base_power, // For cells
        heat: partDefinition.base_heat,   // For cells
        cell_count: partDefinition.cell_count || 0,
        cell_multiplier: partDefinition.cell_multiplier || 0,
        pulses: (partDefinition.cell_count || 0) * (partDefinition.pulse_multiplier || 0),
        base_description: partDefinition.base_description, // Keep base_description for reference
    };
    
    calculatedProps.level = level; // Store the actual level

    if (level > 1) { // Apply level-based modifications
        calculatedProps.cost *= Math.pow(partDefinition.cost_multiplier || 1, level - 1);

        if (partDefinition.category === 'cell') {
            // Use level - 1 for array indexing as levels are 1-based
            const levelIndex = level - 1;
            calculatedProps.id = partDefinition.type + level; // e.g., uranium1, uranium2
            calculatedProps.title = (cell_prefixes[levelIndex] || '') + partDefinition.title;
            
            if (levelIndex < cell_power_multipliers.length) { // Check bounds
                calculatedProps.power = partDefinition.base_power * cell_power_multipliers[levelIndex];
                calculatedProps.heat = partDefinition.base_heat * cell_heat_multipliers[levelIndex];
                calculatedProps.cell_count = cell_counts[levelIndex];
                calculatedProps.cell_multiplier = cell_power_multipliers[levelIndex]; // As per original logic
            } else { // Fallback or error for levels beyond defined multipliers
                console.warn(`Cell ${partDefinition.id} level ${level} exceeds defined multipliers.`);
            }
            // If base_description needs to change for multi-cells (e.g. using multi_cell_description_template)
            calculatedProps.base_description = partDefinition.base_description.includes('%multi_cell_description') ? 
                                              partDefinition.base_description : 
                                              (partDefinition.type + level > 1 ? 'Acts as %count %type cells. Produces %power power and %heat heat per tick.' : partDefinition.base_description );


            calculatedProps.pulses = calculatedProps.cell_count * (partDefinition.pulse_multiplier || 1);

        } else { // Non-cell parts
             const prefixIndex = level -1;
            calculatedProps.id = partDefinition.category + level; // e.g., reflector1, reflector2
            calculatedProps.title = (prefixes[prefixIndex] || `Level ${level} `) + partDefinition.title;

            if (partDefinition.base_ticks && partDefinition.ticks_multiplier) {
                calculatedProps.ticks = partDefinition.base_ticks * Math.pow(partDefinition.ticks_multiplier, level - 1);
            }
            if (partDefinition.base_containment && partDefinition.containment_multiplier) {
                calculatedProps.containment = partDefinition.base_containment * Math.pow(partDefinition.containment_multiplier, level - 1);
            }
            if (partDefinition.base_reactor_power && partDefinition.reactor_power_multiplier) {
                calculatedProps.reactor_power = partDefinition.base_reactor_power * Math.pow(partDefinition.reactor_power_multiplier, level - 1);
            }
            if (partDefinition.base_reactor_heat && partDefinition.reactor_heat_multiplier) {
                calculatedProps.reactor_heat = partDefinition.base_reactor_heat * Math.pow(partDefinition.reactor_heat_multiplier, level - 1);
            }
            if (partDefinition.base_transfer && partDefinition.transfer_multiplier) {
                calculatedProps.transfer = partDefinition.base_transfer * Math.pow(partDefinition.transfer_multiplier, level - 1);
            }
            if (partDefinition.base_vent && partDefinition.vent_multiplier) {
                calculatedProps.vent = partDefinition.base_vent * Math.pow(partDefinition.vent_multiplier, level - 1);
            }
            if (partDefinition.base_ep_heat && partDefinition.ep_heat_multiplier) {
                calculatedProps.ep_heat = partDefinition.base_ep_heat * Math.pow(partDefinition.ep_heat_multiplier, level - 1);
            }
            if (partDefinition.base_power_increase && partDefinition.power_increase_add) {
                // Original logic: base_power_increase + power_increase_add * level - 1.
                // This seems like it should be (level - 1).
                calculatedProps.power_increase = partDefinition.base_power_increase + partDefinition.power_increase_add * (level - 1);
            }
             if (partDefinition.base_heat_increase) { // No multiplier in original for this for leveled items
                calculatedProps.heat_increase = partDefinition.base_heat_increase;
            }
        }
    }
    
    // The `partDefinition` passed to new Part should be the base definition,
    // and the instance then gets updated with calculatedProps.
    const partInstance = new Part(partDefinition, gameInstance);
    partInstance.updateDynamicProperties(calculatedProps); // Apply level-specific calculated values

    return partInstance;
}

/**
 * Updates the power of all cell parts based on upgrades.
 * Original was game.update_cell_power.
 * @param {object} gameInstance - The main game instance.
 */
export function updateAllCellPowers(gameInstance) {
    if (!gameInstance || !gameInstance.part_objects_array || !gameInstance.upgrade_objects) {
        console.warn("Cannot update cell powers: game instance or part/upgrade objects missing.");
        return;
    }

    for (const part of gameInstance.part_objects_array) {
        if (part.category === 'cell') {
            let basePower = part.part.base_power; // Start with the raw base_power from definition
            let powerMultiplier = 1;

            // Apply general cell upgrades
            powerMultiplier *= (gameInstance.upgrade_objects['infused_cells']?.level + 1 || 1);
            powerMultiplier *= Math.pow(2, gameInstance.upgrade_objects['unleashed_cells']?.level || 0);

            // Apply type-specific cell power upgrades
            const typeSpecificUpgradeKey = `cell_power_${part.part.type}`;
            if (gameInstance.upgrade_objects[typeSpecificUpgradeKey]) {
                powerMultiplier *= (gameInstance.upgrade_objects[typeSpecificUpgradeKey].level + 1 || 1);
            }

            // Special handling for protium cells
            if (part.part.type === 'protium') {
                powerMultiplier *= Math.pow(2, gameInstance.upgrade_objects['unstable_protium']?.level || 0);
                powerMultiplier *= (1 + (gameInstance.protium_particles || 0) / 10);
            }
            
            // The 'power' property on the part instance should be the final calculated power
            // The 'base_power' on the part instance should reflect the power after createPart's initial calculation (e.g. * cell_power_multipliers[level-1])
            // This function adjusts it further based on dynamic upgrades.
            // Let's assume part.power was initially set by createPart based on its level's cell_power_multiplier.
            // We need to re-calculate from the true base defined in partData.
            
            // Re-calculate from the part's original base_power from its definition, applying level multiplier first
            const levelIndex = (part.part.level || 1) - 1; // part.part.level is the true level from createPart
            let powerAtLevel = basePower * (cell_power_multipliers[levelIndex] || 1);

            part.power = powerAtLevel * powerMultiplier; // Update the instance's power
            // Note: The original code updated both part.base_power and part.power on the instance.
            // This could be confusing. Here, we update part.power to the final value.
            // If part.base_power needs to reflect an intermediate step, that logic would be different.
            // For simplicity, part.power is the effective power.
        }
    }
    // console.log("All cell powers updated based on upgrades.");
}

console.log('partManager.js loaded');
