import { initializeTiles } from './tileManager.js';
import { initializeTiles } from './tileManager.js';
import uiManager from '../ui/uiManager.js';
import { rawPartData } from '../parts/partData.js';
import { createPart, updateAllCellPowers } from '../parts/partManager.js';
import { getRawUpgradeData } from '../upgrades/upgradeData.js';
import { initializeTiles } from './tileManager.js';
import uiManager from '../ui/uiManager.js';
import { rawPartData } from '../parts/partData.js';
import { createPart, updateAllCellPowers } from '../parts/partManager.js';
import { getRawUpgradeData } from '../upgrades/upgradeData.js';
import { createUpgrade, updateExperimentalPartCosts as managerUpdateExperimentalPartCosts, checkAllUpgradesAffordability as managerCheckAllUpgradesAffordability } from '../upgrades/upgradeManager.js';
import saveLoadManagerInstance from './saveLoad/SaveLoadManager.js';
import hotkeyManagerInstance from './hotkeys/hotkeyManager.js';
import { initializeObjectives, setObjective as setObjectiveFromManager } from './objectives/objectiveManager.js'; // Import objective functions

// apply_to_tile will be imported if loads() needs it directly and it's not part of another module's responsibility yet
// import { apply_to_tile } from '../ui/eventHandlers.js'; // Example, if needed

const single_cell_description = 'Produces %power power and %heat heat per tick. Lasts for %ticks ticks.';
const multi_cell_description = 'Acts as %count %type cells. Produces %power power and %heat heat per tick.';

// The local addProperty helper function is no longer needed as Game class properties are explicitly defined.
// function addProperty(name, default_value) { ... }

class Game {
	constructor() {
		// settings
		this.version = '1.3.2';
		this.base_cols = 14;
		this.base_rows = 11;
		this.max_cols = 35;
		this.max_rows = 32;
		this.debug = false;
		this.save_debug = false;
		this.offline_tick = true;
		this.base_loop_wait = 1000;
		this.base_power_multiplier = 1;
		this.base_heat_multiplier = 4;
		this.base_manual_heat_reduce = 1;
		this.upgrade_max_level = 32;
		this.base_max_heat = 1000;
		this.base_max_power = 100;
		this.base_money = 10;
		this.save_interval = 60000;

		// Current Game State Variables (previously global)
		this.current_power = 0;
		this.max_heat = this.base_max_heat;
		this.max_power = this.base_max_power;
		this.power_multiplier = this.base_power_multiplier;
		this.heat_multiplier = this.base_heat_multiplier;
		this.protium_particles = 0;
		this.total_exotic_particles = 0;
		this.last_tick_time = null; // for offline progress

		// Game state properties
		this.current_heat = 0;
		this.tiles = [];
		this.tiles_2d = [];
		this.active_tiles = [];
		this.active_tiles_2d = [];
		this.loop_wait = this.base_loop_wait;
		this.heat_power_multiplier = 0;
		this.heat_controlled = 0;
		this.manual_heat_reduce = this.base_manual_heat_reduce;
		this.auto_sell_multiplier = 0;
		this.transfer_plating_multiplier = 0;
		this.transfer_capacitor_multiplier = 0;
		this.vent_plating_multiplier = 0;
		this.vent_capacitor_multiplier = 0;
		this.altered_max_power = this.base_max_power;
		this.altered_max_heat = this.base_max_heat;
		this.stats_power = 0;
		this.stats_cash = 0;
		this.paused = false;
		this.auto_sell_disabled = false;
		this.auto_buy_disabled = false;
		this.has_melted_down = false;
		this.current_money = this.base_money;
		this.exotic_particles = 0;
		this.current_exotic_particles = 0;
		this.time_flux = true;
		this.heat_outlet_controlled = 0;
		this.current_objective = 0; // Moved from global

		this._rows = this.base_rows;
		this._cols = this.base_cols;

		// Displayed
		this.part_objects_array = [];
		this.part_objects = {};
		this.upgrade_objects_array = [];
		this.upgrade_objects = {};

		// Objectives
		this.sold_power = false;
		this.sold_heat = false;

		// Dependencies
		this.ui = uiManager; 
		this.saveLoadManager = saveLoadManagerInstance; // Assign the imported instance
		// this.save_manager = null; // This is replaced by saveLoadManager
        this.hotkeyManager = hotkeyManagerInstance;

		// Initialize UI, SaveLoadManager, and HotkeyManager
		this.ui.init(this);
		this.saveLoadManager.init(this);
        this.hotkeyManager.init(this);
        // initializeObjectives(this, 0); // Called in resetToDefaults
	}

	// addProperty assignment is removed as the local helper is removed.
	// Game class properties are defined directly.

	update_active_tiles() {
		this.active_tiles.length = 0;
		this.active_tiles_2d.length = 0;
		for (let ri = 0; ri < this._rows; ri++) {
			const row = this.tiles[ri];
			const arow = [];
			for (let ci = 0; ci < this._cols; ci++) {
				const tile = row[ci];
				arow.push(tile);
				this.active_tiles_2d.push(tile);
			}
			this.active_tiles.push(arow); // arow was correct, not row
		}
	}

	set_active_tiles(row, col) {
		this._rows = row;
		this._cols = col;
		this.update_active_tiles();
	}

	get rows() {
		return this._rows;
	}

	set rows(length) {
		this._rows = length;
		this.update_active_tiles();
	}

	get cols() {
		return this._cols;
	}

	set cols(length) {
		this._cols = length;
		this.update_active_tiles();
	}

	resetToDefaults() {
		this.current_heat = 0;
		this.current_power = 0;
		this.current_money = this.base_money;
		this.cols = this.base_cols; // Uses setter
		this.rows = this.base_rows; // Uses setter
		this.max_heat = this.base_max_heat;
		this.auto_sell_multiplier = 0;
		this.max_power = this.base_max_power;
		this.loop_wait = this.base_loop_wait;
		this.power_multiplier = this.base_power_multiplier;
		this.heat_multiplier = this.base_heat_multiplier;
		this.manual_heat_reduce = this.base_manual_heat_reduce;
		this.vent_capacitor_multiplier = 0;
		this.vent_plating_multiplier = 0;
		this.transfer_capacitor_multiplier = 0;
		this.transfer_plating_multiplier = 0;
		this.heat_power_multiplier = 0;
		this.heat_controlled = 0;
		this.time_flux = true;
		this.heat_outlet_controlled = 0;
		this.altered_max_heat = this.base_max_heat;
		this.altered_max_power = this.base_max_power;
		this.protium_particles = 0;
		// this.last_tick_time will be handled by game loop or load

		initializeTiles(this); // Initialize tiles

        // Initialize Parts
        this.part_objects = {};
        this.part_objects_array = [];
        rawPartData.forEach(partSetting => {
            if (partSetting.levels) {
                for (let i = 0; i < partSetting.levels; i++) {
                    const part_obj = createPart(partSetting, i + 1, this);
                    this.part_objects[part_obj.id] = part_obj;
                    this.part_objects_array.push(part_obj);
                    // The UI event for adding parts to the shop will be handled by uiManager
                    // after all parts are created.
                }
            } else {
                const part_obj = createPart(partSetting, partSetting.level || 1, this);
                this.part_objects[part_obj.id] = part_obj;
                this.part_objects_array.push(part_obj);
            }
        });
        updateAllCellPowers(this);
        if (this.ui && typeof this.ui.setupPartsUI === 'function') {
            this.ui.setupPartsUI(); // Tell UI to create part elements in the shop
        }

        // Initialize Upgrades
        this.upgrade_objects = {};
        this.upgrade_objects_array = [];
        const rawUpgrades = getRawUpgradeData(this); // Pass gameInstance
        rawUpgrades.forEach(rawUpgradeItem => {
            const upgradeObj = createUpgrade(rawUpgradeItem, this);
            this.upgrade_objects[upgradeObj.id] = upgradeObj; // Use upgradeObj.id
            this.upgrade_objects_array.push(upgradeObj);
        });

        // Set initial level and cost for all upgrades (as per original loop)
        this.upgrade_objects_array.forEach(upgradeObj => {
            upgradeObj.setLevel(0); // This calculates initial cost for level 1
        });
        
        if (this.ui && typeof this.ui.setupUpgradesUI === 'function') {
            this.ui.setupUpgradesUI(); // Tell UI to create upgrade elements in the shop
        }
        this.checkAllUpgradesAffordability(); // Initial affordability check
        
        initializeObjectives(this, this.current_objective || 0); // Initialize objectives, potentially with loaded index
	}

    // Methods calling imported manager functions
    updateExperimentalPartCosts(purchasedUpgradeInstance) {
        managerUpdateExperimentalPartCosts(this, purchasedUpgradeInstance);
    }

    checkAllUpgradesAffordability() {
        managerCheckAllUpgradesAffordability(this);
    }

	saves() {
		// Ensure tile_queue is defined, perhaps as a property of Game or passed in
		const tile_queue = this.tile_queue || []; // Assuming tile_queue is part of Game instance

		const stiles = this.active_tiles_2d.map((tile) => tile.part ?
			{ id: tile.part.id, ticks: tile.ticks, activated: tile.activated, heat_contained: tile.heat_contained } : null);

		const squeue = tile_queue.map((tile) => { return { row: tile.row, col: tile.col } });

		const supgrades = this.upgrade_objects_array.map((upgrade) => { return { id: upgrade.upgrade.id, level: upgrade.level } });

		const saveData = {
			active_tiles_2d: { rows: this.rows, cols: this.cols, tiles: stiles },
			tile_queue: squeue,
			upgrades: supgrades,
			current_power: this.current_power, // This is a direct property
			current_money: this.current_money, // This is a direct property
			current_heat: this.current_heat,   // This is a direct property
			exotic_particles: this.exotic_particles,
			current_exotic_particles: this.current_exotic_particles,
			total_exotic_particles: this.total_exotic_particles, // This is a direct property
			buttons_state: (this.ui && typeof this.ui.getToggleButtonsSaves === 'function') ? this.ui.getToggleButtonsSaves() : {},
			protium_particles: this.protium_particles, // This is a direct property
			current_objective: this.current_objective, // This is a direct property
			last_tick_time: this.last_tick_time, // This is a direct property
			offline_tick: this.offline_tick,
			version: this.version
		};
		return window.btoa(JSON.stringify(saveData));
	}

	loads(rksString) {
		if (this.save_debug) console.log('save_game.load', rksString);
		this.resetToDefaults(); // Start with defaults

		let rks = {};
		if (rksString) {
			try {
				rks = JSON.parse(window.atob(rksString));
			} catch (err) {
				console.error("Error parsing save data:", err);
				rks = {}; // Load defaults if parsing fails
			}
		}

		// Current values
		this.current_heat = rks.current_heat || this.current_heat;
		this.current_power = rks.current_power || this.current_power;
		this.current_money = typeof rks.current_money === 'number' ? rks.current_money : this.base_money;
		this.exotic_particles = rks.exotic_particles || 0; // Ensure default if undefined
		this.current_exotic_particles = rks.current_exotic_particles || 0; // Ensure default
		this.total_exotic_particles = rks.total_exotic_particles || 0;
        if (this.ui && this.ui.uiSay) this.ui.uiSay('var', 'total_exotic_particles', this.total_exotic_particles);


		this.max_heat = rks.max_heat || this.base_max_heat; // Ensure default
		this.manual_heat_reduce = rks.manual_heat_reduce || this.base_manual_heat_reduce; // Ensure default
		this.paused = rks.paused || false; // Ensure default
		this.current_objective = rks.current_objective || 0; // Ensure default
		this.protium_particles = rks.protium_particles || 0; // Ensure default
        this.offline_tick = typeof rks.offline_tick === 'boolean' ? rks.offline_tick : true; // Default to true


		if (rks.offline_tick === false || !this.offline_tick) { // Check against the value just set from save or default
			this.last_tick_time = null;
		} else {
			this.last_tick_time = rks.last_tick_time || null; // Ensure it's null if not in save
		}

		const save_version = rks.version || null;

        if (this.ui && typeof this.ui.loadToggleButtonsState === 'function' && rks.buttons_state) {
            this.ui.loadToggleButtonsState(rks.buttons_state);
        }

        if (this.ui && this.ui.uiSay) {
            this.ui.uiSay('var', 'manual_heat_reduce', this.manual_heat_reduce);
            this.ui.uiSay('var', 'auto_heat_reduce', this.max_heat / 10000);
        }
		
		// Tiles - old save loading for backward compatibility (assuming apply_to_tile is available)
		if (rks.tiles) {
			for (let ri_load = 0; ri_load < this.max_rows; ri_load++) {
				const row_load = this.tiles[ri_load];
				const srow_load = rks.tiles[ri_load];

				if (srow_load) {
					for (let ci_load = 0; ci_load < this.max_cols; ci_load++) {
						const stile_load = srow_load[ci_load];

						if (stile_load) {
							const tile_load = row_load[ci_load];
							tile_load.setTicks(stile_load.ticks);
							tile_load.activated = stile_load.activated;
							tile_load.setHeat_contained(stile_load.heat_contained);
							const part_load = this.part_objects[stile_load.id];
                            // TODO: apply_to_tile needs to be available, possibly from uiManager or eventHandlers
                            // if (typeof apply_to_tile === 'function') apply_to_tile(tile_load, part_load, true);
						}
					}
				}
			}
		}
		
		if (rks.active_tiles_2d && this.part_objects) { // Ensure part_objects is initialized
			this.set_active_tiles(rks.active_tiles_2d.rows || this.base_rows, rks.active_tiles_2d.cols || this.base_cols);
			for (const [i_load, stile_load] of rks.active_tiles_2d.tiles.entries()) {
				if (stile_load && this.active_tiles_2d[i_load]) { // Check tile exists
					const tile_load = this.active_tiles_2d[i_load];
					tile_load.setTicks(stile_load.ticks || 0);
					tile_load.activated = stile_load.activated || false;
					tile_load.setHeat_contained(stile_load.heat_contained || 0);
					const part_load = this.part_objects[stile_load.id];
                    // if (part_load && typeof apply_to_tile === 'function') apply_to_tile(tile_load, part_load, true);
				}
			}
		}

		this.tile_queue = []; // Always reset tile_queue on load
		if (rks.tile_queue && Array.isArray(rks.tile_queue)) {
			for (const stile_load of rks.tile_queue) {
                if (this.tiles[stile_load.row] && this.tiles[stile_load.row][stile_load.col]) {
				    this.tile_queue.push(this.tiles[stile_load.row][stile_load.col]);
                }
			}
		}

		// Upgrades - ensure upgrade_objects is initialized
		if (rks.upgrades) {
			for (const supgrade_load of rks.upgrades) {
				const supgrade_object_load = this.upgrade_objects[supgrade_load.id];
				if (supgrade_object_load) {
					supgrade_object_load.setLevel(supgrade_load.level);
				}
			}
		}

        if (this.upgrade_objects && rks.upgrades && Array.isArray(rks.upgrades)) {
			for (const supgrade_load of rks.upgrades) {
				const supgrade_object_load = this.upgrade_objects[supgrade_load.id];
				if (supgrade_object_load) {
					supgrade_object_load.setLevel(supgrade_load.level || 0);
				}
			}
		}

        // Post-load updates
        if (typeof this.updateAllCellPowers === 'function') this.updateAllCellPowers(); // Ensure this method exists on Game
        // update_nodes(); // Now part of uiUpdater logic or direct DOM updates
        // if (typeof update_tiles === 'function') update_tiles(this); // This should be called after load to reflect changes
        // update_heat_and_power(); // Now part of uiUpdater logic (via uiSay for these vars)

		if (save_version !== this.version && this.ui && this.ui.uiSay) {
			this.ui.uiSay('evt', 'game_updated', { oldVersion: save_version, newVersion: this.version });
		}
        
        // After all game state is loaded, set the objective based on the loaded index
        setObjectiveFromManager(this.current_objective, true); // true to skipWait

		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'game_loaded_successfully');

        // Auto-save timer is handled by SaveLoadManager
	}

	reboot(refund) {
		// clearTimeout(loop_timeout); // loop_timeout is global

		this.resetToDefaults();

		for (const tile of this.tiles_2d) {
			// remove_part(tile, true); // remove_part is global
			tile.disable(); // Assuming Tile class has disable method
		}

		this.total_exotic_particles += this.exotic_particles;
		// if (this.ui) this.ui.say('var', 'total_exotic_particles', this.total_exotic_particles); // UI dependent

		if (refund === true) {
			for (const upgrade of this.upgrade_objects_array) {
				upgrade.setLevel(0); // Assuming Upgrade class has setLevel
			}
			this.current_exotic_particles = this.total_exotic_particles;
		} else {
			for (const upgrade of this.upgrade_objects_array) {
				if (!upgrade.ecost) { // Assuming Upgrade class has ecost
					upgrade.setLevel(0);
				} else {
					upgrade.setLevel(upgrade.level); // Assuming Upgrade class has level
				}
			}
			this.current_exotic_particles += this.exotic_particles;
		}

		// update_tiles(); // update_tiles is global

		this.exotic_particles = 0;

		// if (this.ui) { // UI dependent
		// 	this.ui.say('var', 'exotic_particles', this.exotic_particles);
		// 	this.ui.say('var', 'current_exotic_particles', this.current_exotic_particles);
		// }

		// update_nodes(); // update_nodes is global

		// clearTimeout(loop_timeout);
		// loop_timeout = setTimeout(game_loop, this.loop_wait); // game_loop is global
	}

	// --- Game Control Methods ---
	pause() {
		// console.log('Game paused (placeholder)');
		// This will later call a function from gameLoop.js to stop the loop
		this.paused = true;
		this.last_tick_time = null; // Stop accumulation of dtime while paused
		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'paused', true);
		console.log('Game paused.');
		// stopGameLoop(); // Will be called from here eventually
	}

	unpause() {
		// console.log('Game unpaused (placeholder)');
		// This will later call a function from gameLoop.js to start the loop
		this.paused = false;
		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'unpaused', true);
		console.log('Game unpaused.');
		// startGameLoop(); // Will be called from here eventually
	}

	// --- Game Action Methods ---
	manual_reduce_heat() {
		if (this.current_heat > 0) {
			this.current_heat -= this.manual_heat_reduce;
			if (this.current_heat < 0) this.current_heat = 0;
			if (this.current_heat === 0) this.sold_heat = true;
			// ui.say('var', 'current_heat', this.current_heat); // Comment out UI
			console.log('Manual heat reduce, new heat:', this.current_heat);
		}
	}

	sell_power() { // Renamed from 'sell' to be more specific
		if (this.current_power > 0) {
			this.current_money += this.current_power;
			this.current_power = 0;
			// ui.say('var', 'current_money', this.current_money); // Comment out UI
			// ui.say('var', 'current_power', this.current_power); // Comment out UI
			this.sold_power = true;
			console.log('Power sold, new money:', this.current_money, 'new power:', this.current_power);
		}
	}

	// --- Auto Feature Toggles (Moved from global window functions) ---
	disable_auto_sell() {
		this.auto_sell_disabled = true;
		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'auto_sell_disabled', true);
		console.log('Auto-sell disabled.');
	}

	enable_auto_sell() {
		this.auto_sell_disabled = false;
		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'auto_sell_enabled', true);
		console.log('Auto-sell enabled.');
	}

	disable_auto_buy() {
		this.auto_buy_disabled = true;
		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'auto_buy_disabled', true);
		console.log('Auto-buy disabled.');
	}

	enable_auto_buy() {
		this.auto_buy_disabled = false;
		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'auto_buy_enabled', true);
		console.log('Auto-buy enabled.');
	}

	disable_heat_control() {
		this.heat_controlled = false; // Was a boolean in original, not 0
		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'heat_control_disabled', true);
		console.log('Heat control disabled.');
	}

	enable_heat_control() {
		this.heat_controlled = true; // Was a boolean in original, not 1
		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'heat_control_enabled', true);
		console.log('Heat control enabled.');
	}

	disable_time_flux() {
		this.time_flux = false;
		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'time_flux_disabled', true);
		console.log('Time flux disabled.');
	}

	enable_time_flux() {
		this.time_flux = true;
		if (this.ui && this.ui.uiSay) this.ui.uiSay('evt', 'time_flux_enabled', true);
		console.log('Time flux enabled.');
	}
}

const game = new Game();
export default game;
