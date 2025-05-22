// upgradeEffects.js

// Helper to update part descriptions after an effect
function updatePartDescription(gameInstance, partId) {
    if (gameInstance.part_objects && gameInstance.part_objects[partId]) {
        gameInstance.part_objects[partId].updateDescription();
    }
}

export const upgradeEffects = {
    chronometer: (upgradeInstance, gameInstance) => {
        gameInstance.loop_wait = gameInstance.base_loop_wait / (upgradeInstance.level + 1);
    },
    forceful_fusion: (upgradeInstance, gameInstance) => {
        gameInstance.heat_power_multiplier = upgradeInstance.level;
    },
    heat_control_operator: (upgradeInstance, gameInstance) => {
        // Effect is mainly through game logic checking gameInstance.upgrade_objects['heat_control_operator'].level
        // No direct state change here other than the upgrade's level itself.
    },
    heat_outlet_control_operator: (upgradeInstance, gameInstance) => {
        gameInstance.heat_outlet_controlled = upgradeInstance.level;
    },
    improved_piping: (upgradeInstance, gameInstance) => {
        gameInstance.manual_heat_reduce = gameInstance.base_manual_heat_reduce * Math.pow(10, upgradeInstance.level);
        if (gameInstance.ui && gameInstance.ui.uiSay) {
            gameInstance.ui.uiSay('var', 'manual_heat_reduce', gameInstance.manual_heat_reduce);
        }
    },
    improved_alloys: (upgradeInstance, gameInstance) => {
        const quantumBufferingLevel = gameInstance.upgrade_objects?.['quantum_buffering']?.level || 0;
        for (let i = 1; i <= 6; i++) { // Assuming max level 6 for reactor_plating
            const part = gameInstance.part_objects?.[`reactor_plating${i}`];
            if (part && part.part) { // part.part is the raw definition
                part.reactor_heat = part.part.base_reactor_heat * (upgradeInstance.level + 1) * Math.pow(2, quantumBufferingLevel);
                updatePartDescription(gameInstance, `reactor_plating${i}`);
            }
        }
    },
    improved_power_lines: (upgradeInstance, gameInstance) => {
        gameInstance.auto_sell_multiplier = 0.01 * upgradeInstance.level;
    },
    improved_wiring: (upgradeInstance, gameInstance) => {
        const quantumBufferingLevel = gameInstance.upgrade_objects?.['quantum_buffering']?.level || 0;
        for (let i = 1; i <= 6; i++) { // Assuming max level 6 for capacitor
            const part = gameInstance.part_objects?.[`capacitor${i}`];
            if (part && part.part) {
                part.reactor_power = part.part.base_reactor_power * (upgradeInstance.level + 1) * Math.pow(2, quantumBufferingLevel);
                part.containment = part.part.base_containment * (upgradeInstance.level + 1) * Math.pow(2, quantumBufferingLevel);
                updatePartDescription(gameInstance, `capacitor${i}`);
            }
        }
    },
    perpetual_capacitors: (upgradeInstance, gameInstance) => {
        // The original code commented this out, implying it's a passive effect managed by game logic
        // by checking game.upgrade_objects['perpetual_capacitors'].level.
        // For now, no direct state change here.
        // If parts need a `perpetual` flag set:
        // for (let i = 1; i <= 6; i++) {
        //   const part = gameInstance.part_objects?.[`capacitor${i}`];
        //   if (part) part.perpetual = upgradeInstance.level > 0;
        // }
    },
    improved_coolant_cells: (upgradeInstance, gameInstance) => {
        const ultracryonicsLevel = gameInstance.upgrade_objects?.['ultracryonics']?.level || 0;
        for (let i = 1; i <= 6; i++) {
            const part = gameInstance.part_objects?.[`coolant_cell${i}`];
            if (part && part.part) {
                part.containment = part.part.base_containment * (upgradeInstance.level + 1) * Math.pow(2, ultracryonicsLevel);
                updatePartDescription(gameInstance, `coolant_cell${i}`);
            }
        }
    },
    improved_reflector_density: (upgradeInstance, gameInstance) => {
        for (let i = 1; i <= 6; i++) { // Assuming max level 6 for reflectors
            const part = gameInstance.part_objects?.[`reflector${i}`];
            if (part && part.part) {
                part.ticks = part.part.base_ticks * (upgradeInstance.level + 1);
                updatePartDescription(gameInstance, `reflector${i}`);
            }
        }
    },
    improved_neutron_reflection: (upgradeInstance, gameInstance) => {
        const fullSpectrumLevel = gameInstance.upgrade_objects?.['full_spectrum_reflectors']?.level || 0;
        for (let i = 1; i <= 6; i++) {
            const part = gameInstance.part_objects?.[`reflector${i}`];
            if (part && part.part) {
                part.power_increase = part.part.base_power_increase * (1 + (upgradeInstance.level / 100)) + (part.part.base_power_increase * fullSpectrumLevel);
                updatePartDescription(gameInstance, `reflector${i}`);
            }
        }
    },
    perpetual_reflectors: (upgradeInstance, gameInstance) => {
        for (let i = 1; i <= 6; i++) {
            const part = gameInstance.part_objects?.[`reflector${i}`];
            if (part) {
                part.perpetual = upgradeInstance.level > 0;
                // updatePartDescription(gameInstance, `reflector${i}`); // Description might not change for this
            }
        }
    },
    improved_heat_exchangers: (upgradeInstance, gameInstance) => {
        const fluidHyperdynamicsLevel = gameInstance.upgrade_objects?.['fluid_hyperdynamics']?.level || 0;
        const fractalPipingLevel = gameInstance.upgrade_objects?.['fractal_piping']?.level || 0;
        const exchangers = ['heat_inlet', 'heat_outlet', 'heat_exchanger'];
        exchangers.forEach(type => {
            for (let i = 1; i <= 6; i++) {
                const part = gameInstance.part_objects?.[`${type}${i}`];
                if (part && part.part) {
                    part.transfer = part.part.base_transfer * (upgradeInstance.level + 1) * Math.pow(2, fluidHyperdynamicsLevel);
                    if (type === 'heat_exchanger') {
                        part.containment = part.part.base_containment * (upgradeInstance.level + 1) * Math.pow(2, fractalPipingLevel);
                    }
                    updatePartDescription(gameInstance, `${type}${i}`);
                }
            }
        });
    },
    reinforced_heat_exchangers: (upgradeInstance, gameInstance) => {
        gameInstance.transfer_plating_multiplier = upgradeInstance.level;
    },
    active_exchangers: (upgradeInstance, gameInstance) => {
        gameInstance.transfer_capacitor_multiplier = upgradeInstance.level;
    },
    improved_heat_vents: (upgradeInstance, gameInstance) => {
        const fluidHyperdynamicsLevel = gameInstance.upgrade_objects?.['fluid_hyperdynamics']?.level || 0;
        const fractalPipingLevel = gameInstance.upgrade_objects?.['fractal_piping']?.level || 0;
        for (let i = 1; i <= 6; i++) {
            const part = gameInstance.part_objects?.[`vent${i}`];
            if (part && part.part) {
                part.vent = part.part.base_vent * (upgradeInstance.level + 1) * Math.pow(2, fluidHyperdynamicsLevel);
                part.containment = part.part.base_containment * (upgradeInstance.level + 1) * Math.pow(2, fractalPipingLevel);
                updatePartDescription(gameInstance, `vent${i}`);
            }
        }
    },
    improved_heatsinks: (upgradeInstance, gameInstance) => {
        gameInstance.vent_plating_multiplier = upgradeInstance.level;
    },
    active_venting: (upgradeInstance, gameInstance) => {
        gameInstance.vent_capacitor_multiplier = upgradeInstance.level;
    },
    expand_reactor_rows: (upgradeInstance, gameInstance) => {
        gameInstance.rows = gameInstance.base_rows + upgradeInstance.level; // Uses setter
    },
    expand_reactor_cols: (upgradeInstance, gameInstance) => {
        gameInstance.cols = gameInstance.base_cols + upgradeInstance.level; // Uses setter
    },

    // Experimental Upgrades
    laboratory: (upgradeInstance, gameInstance) => { /* Unlocks other upgrades, no direct game state change */ },
    infused_cells: (upgradeInstance, gameInstance) => {
        if (typeof gameInstance.updateAllCellPowers === 'function') gameInstance.updateAllCellPowers();
    },
    unleashed_cells: (upgradeInstance, gameInstance) => {
        const unleashedLevel = upgradeInstance.level;
        gameInstance.part_objects_array?.forEach(part => {
            if (part.category === 'cell' && part.part) { // part.part is the raw definition
                // This logic might need refinement based on how base values are stored vs instance values
                // Assuming part.part.base_heat is the true base, and createPart already applied level multipliers
                // This effect further multiplies the heat.
                // The original logic was: part.base_heat = part.part.base_heat * Math.pow(2, upgrade.level);
                // And part.heat = part.part.heat * Math.pow(2, upgrade.level);
                // This seems to imply part.part.heat was a pre-leveled value.
                // For now, let's assume we adjust the current part.heat
                // This needs careful review against how Part instances store base vs current heat/power.
                // Let's assume updateAllCellPowers will correctly recalculate from true base values.
            }
        });
        if (typeof gameInstance.updateAllCellPowers === 'function') gameInstance.updateAllCellPowers();
    },
    quantum_buffering: (upgradeInstance, gameInstance) => {
        const improvedWiringLevel = gameInstance.upgrade_objects?.['improved_wiring']?.level || 0;
        const improvedAlloysLevel = gameInstance.upgrade_objects?.['improved_alloys']?.level || 0;
        for (let i = 1; i <= 6; i++) {
            const cap = gameInstance.part_objects?.[`capacitor${i}`];
            if (cap && cap.part) {
                cap.reactor_power = cap.part.base_reactor_power * (improvedWiringLevel + 1) * Math.pow(2, upgradeInstance.level);
                cap.containment = cap.part.base_containment * (improvedWiringLevel + 1) * Math.pow(2, upgradeInstance.level);
                updatePartDescription(gameInstance, `capacitor${i}`);
            }
            const plat = gameInstance.part_objects?.[`reactor_plating${i}`];
            if (plat && plat.part) {
                plat.reactor_heat = plat.part.base_reactor_heat * (improvedAlloysLevel + 1) * Math.pow(2, upgradeInstance.level);
                updatePartDescription(gameInstance, `reactor_plating${i}`);
            }
        }
    },
    full_spectrum_reflectors: (upgradeInstance, gameInstance) => {
        const improvedNeutronReflectionLevel = gameInstance.upgrade_objects?.['improved_neutron_reflection']?.level || 0;
        for (let i = 1; i <= 6; i++) {
            const part = gameInstance.part_objects?.[`reflector${i}`];
            if (part && part.part) {
                part.power_increase = part.part.base_power_increase * (1 + (improvedNeutronReflectionLevel / 100)) + (part.part.base_power_increase * upgradeInstance.level);
                updatePartDescription(gameInstance, `reflector${i}`);
            }
        }
    },
    fluid_hyperdynamics: (upgradeInstance, gameInstance) => {
        const improvedHeatExchangersLevel = gameInstance.upgrade_objects?.['improved_heat_exchangers']?.level || 0;
        const improvedHeatVentsLevel = gameInstance.upgrade_objects?.['improved_heat_vents']?.level || 0;
        
        ['heat_inlet', 'heat_outlet', 'heat_exchanger'].forEach(type => {
            for (let i = 1; i <= 6; i++) {
                const part = gameInstance.part_objects?.[`${type}${i}`];
                if (part && part.part) {
                    part.transfer = part.part.base_transfer * (improvedHeatExchangersLevel + 1) * Math.pow(2, upgradeInstance.level);
                    updatePartDescription(gameInstance, `${type}${i}`);
                }
            }
        });
        for (let i = 1; i <= 6; i++) {
            const part = gameInstance.part_objects?.[`vent${i}`];
            if (part && part.part) {
                part.vent = part.part.base_vent * (improvedHeatVentsLevel + 1) * Math.pow(2, upgradeInstance.level);
                updatePartDescription(gameInstance, `vent${i}`);
            }
        }
    },
    fractal_piping: (upgradeInstance, gameInstance) => {
        const improvedHeatVentsLevel = gameInstance.upgrade_objects?.['improved_heat_vents']?.level || 0;
        const improvedHeatExchangersLevel = gameInstance.upgrade_objects?.['improved_heat_exchangers']?.level || 0;
        for (let i = 1; i <= 6; i++) {
            const vent = gameInstance.part_objects?.[`vent${i}`];
            if (vent && vent.part) {
                vent.containment = vent.part.base_containment * (improvedHeatVentsLevel + 1) * Math.pow(2, upgradeInstance.level);
                updatePartDescription(gameInstance, `vent${i}`);
            }
            const exchanger = gameInstance.part_objects?.[`heat_exchanger${i}`];
            if (exchanger && exchanger.part) {
                exchanger.containment = exchanger.part.base_containment * (improvedHeatExchangersLevel + 1) * Math.pow(2, upgradeInstance.level);
                updatePartDescription(gameInstance, `heat_exchanger${i}`);
            }
        }
    },
    ultracryonics: (upgradeInstance, gameInstance) => {
        const improvedCoolantCellsLevel = gameInstance.upgrade_objects?.['improved_coolant_cells']?.level || 0;
        for (let i = 1; i <= 6; i++) {
            const part = gameInstance.part_objects?.[`coolant_cell${i}`];
            if (part && part.part) {
                part.containment = part.part.base_containment * (improvedCoolantCellsLevel + 1) * Math.pow(2, upgradeInstance.level);
                updatePartDescription(gameInstance, `coolant_cell${i}`);
            }
        }
    },
    phlembotinum_core: (upgradeInstance, gameInstance) => {
        gameInstance.altered_max_power = gameInstance.base_max_power * Math.pow(4, upgradeInstance.level);
        gameInstance.altered_max_heat = gameInstance.base_max_heat * Math.pow(4, upgradeInstance.level);
        // UI update for max_power and max_heat should be triggered by their setters if they use uiSay
        // or manually:
        if(gameInstance.ui && gameInstance.ui.uiSay) {
            gameInstance.ui.uiSay('var', 'max_power', gameInstance.altered_max_power);
            gameInstance.ui.uiSay('var', 'max_heat', gameInstance.altered_max_heat);
        }
    },
    protium_cells: (upgradeInstance, gameInstance) => { /* Unlock part, no direct game state change */ },
    unstable_protium: (upgradeInstance, gameInstance) => {
        // This logic modifies base cell properties. updateAllCellPowers will apply further multipliers.
        const unleashedCellsLevel = gameInstance.upgrade_objects?.['unleashed_cells']?.level || 0;
        const infusedCellsLevel = gameInstance.upgrade_objects?.['infused_cells']?.level || 0;

        for (let i = 1; i <= 3; i++) { // Protium cells are level 1-3
            const part = gameInstance.part_objects?.[`protium${i}`];
            if (part && part.part) {
                // The original directly set part.base_heat, part.heat, part.base_power, part.power, part.ticks
                // This needs careful coordination with Part class and updateAllCellPowers
                // For now, let's assume updateAllCellPowers will handle the power recalc.
                // Ticks are directly affected:
                part.ticks = Math.ceil(part.part.base_ticks / Math.pow(2, upgradeInstance.level));
                updatePartDescription(gameInstance, `protium${i}`);
            }
        }
        if (typeof gameInstance.updateAllCellPowers === 'function') gameInstance.updateAllCellPowers();
    },
    // Generic handler for experimental parts that just unlock something
    // and call epart_onclick (which is now updateExperimentalPartCosts in upgradeManager)
    experimental_part_unlock: (upgradeInstance, gameInstance) => {
        if (gameInstance && typeof gameInstance.updateExperimentalPartCosts === 'function') {
            gameInstance.updateExperimentalPartCosts(upgradeInstance);
        }
    },
    // Cell power/tick/perpetual are dynamically generated in upgradeData.js
    // Their effects are specific to the cell type.
    cell_power_generic: (upgradeInstance, gameInstance) => {
        if (typeof gameInstance.updateAllCellPowers === 'function') gameInstance.updateAllCellPowers();
        const partType = upgradeInstance.upgrade.part?.type; // part.type from upgrade definition
        if (partType) {
            for (let i = 1; i <= 3; i++) { // Assuming cells go up to level 3
                updatePartDescription(gameInstance, `${partType}${i}`);
            }
        }
    },
    cell_tick_generic: (upgradeInstance, gameInstance) => {
        const partType = upgradeInstance.upgrade.part?.type;
        if (partType) {
            for (let i = 1; i <= 3; i++) {
                const part = gameInstance.part_objects?.[`${partType}${i}`];
                if (part && part.part) {
                    part.ticks = part.part.base_ticks * Math.pow(2, upgradeInstance.level);
                    updatePartDescription(gameInstance, `${partType}${i}`);
                }
            }
        }
    },
    cell_perpetual_generic: (upgradeInstance, gameInstance) => {
        const partType = upgradeInstance.upgrade.part?.type;
        if (partType) {
            for (let i = 1; i <= 3; i++) {
                const part = gameInstance.part_objects?.[`${partType}${i}`];
                if (part) {
                    part.perpetual = upgradeInstance.level > 0;
                    // updatePartDescription(gameInstance, `${partType}${i}`); // Description might not change
                }
            }
        }
    },
};

// Dynamically generated particle accelerator upgrades
for (let i = 1; i <= 6; i++) {
    upgradeEffects[`improved_particle_accelerators${i}`] = (upgradeInstance, gameInstance) => {
        const part = gameInstance.part_objects?.[`particle_accelerator${i}`];
        if (part && part.part) {
            part.ep_heat = part.part.base_ep_heat * (upgradeInstance.level + 1);
            updatePartDescription(gameInstance, `particle_accelerator${i}`);
        }
    };
}

console.log('upgradeEffects.js loaded');
