import * as DOM from './domElements.js';
import game from '../game/gameState.js'; // Assuming game is the default export from gameState.js
import { fmt } from '../utils/numberFormatting.js'; // Corrected path
import { processBufferedProperties } from '../utils/objectUtils.js'; // Import property processor

// --- State for UI updates ---
const current_vars = new Map();
const update_vars = new Map();
let do_check_upgrades_affordability = false; // Related to update_interface logic

// --- Helper Functions ---
const round_percentage = (perc, step = 1) => {
  return Math.round(perc * 100 / step) * step;
};

const perc = (numeratorKey, denominatorKey, domElement) => {
  const numerator = current_vars.get(numeratorKey);
  const denominator = current_vars.get(denominatorKey);
  if (domElement && typeof numerator === 'number' && typeof denominator === 'number' && denominator !== 0) {
    let percent = round_percentage(numerator / denominator);
    if (percent > 100) percent = 100;
    if (percent < 0) percent = 0; // Ensure percent is not negative
    domElement.style.width = `${percent}%`;
  } else if (domElement) {
    domElement.style.width = '0%'; // Default to 0% if data is invalid
  }
};

const update_heat_background = (currentHeat, maxHeat) => {
  if (!DOM.reactor_background) return;

  const current_heat_val = currentHeat; // Already a number from current_vars
  const max_heat_val = maxHeat;       // Already a number from current_vars

  if (current_heat_val <= max_heat_val) {
    DOM.reactor_background.style.willChange = '';
    DOM.reactor_background.style.backgroundColor = 'transparent';
  } else if (current_heat_val > max_heat_val && current_heat_val <= max_heat_val * 2) {
    DOM.reactor_background.style.willChange = 'opacity';
    const opacity = round_percentage((current_heat_val - max_heat_val) / max_heat_val, 2) / 100;
    DOM.reactor_background.style.backgroundColor = `rgba(255, 0, 0, ${opacity})`;
  } else { // current_heat_val > max_heat_val * 2
    DOM.reactor_background.style.willChange = 'opacity';
    DOM.reactor_background.style.backgroundColor = 'rgb(255, 0, 0)';
  }
};

const timestampFmt = (ts) => {
  ts = Math.round(ts / 1000);
  let s = String(ts % 60);
  if (s.length < 2) s = `0${s}`;
  ts = Math.floor(ts / 60);
  if (ts === 0) return s;

  let m = String(ts % 60);
  if (m.length < 2) m = `0${m}`;
  ts = Math.floor(ts / 60);
  if (ts === 0) return `${m}:${s}`;

  let h = String(ts % 24);
  if (h.length < 2) h = `0${h}`;
  ts = Math.floor(ts / 24);
  if (ts === 0) return `${h}:${m}:${s}`;

  const d = String(ts);
  return `${d}:${h}:${m}:${s}`;
};

// --- var_objs: Configuration for UI variable updates ---
// Needs fmt function, assuming it will be imported or defined globally/utils
const var_objs = {
  manual_heat_reduce: {
    onupdate: () => {
      if (DOM.manual_heat_reduce_display) { // manual_heat_reduce is the text display
        DOM.manual_heat_reduce_display.textContent = `-${fmt(current_vars.get('manual_heat_reduce'))}`;
      }
    },
  },
  auto_heat_reduce: {
    onupdate: () => {
      if (DOM.auto_heat_reduce_display) { // auto_heat_reduce is the text display
        DOM.auto_heat_reduce_display.textContent = `-${fmt(current_vars.get('auto_heat_reduce'))}`;
      }
    },
  },
  flux_tick_time: {
    onupdate: () => {
      if (DOM.time_flux) { // time_flux is the DOM element for displaying this
        const flux_tick_time_val = current_vars.get('flux_tick_time');
        DOM.time_flux.textContent = flux_tick_time_val > 1000 ? timestampFmt(flux_tick_time_val) : '-';
      }
    },
  },
  current_money: { dom: DOM.money, num: true },
  current_power: {
    dom: DOM.current_power,
    num: true,
    onupdate: () => perc('current_power', 'max_power', DOM.power_percentage),
  },
  max_power: {
    dom: DOM.max_power,
    num: true,
    onupdate: () => perc('current_power', 'max_power', DOM.power_percentage),
  },
  total_power: { dom: DOM.stats_power, num: true }, // Original was stats_power
  current_heat: {
    dom: DOM.current_heat,
    num: true,
    onupdate: () => {
      perc('current_heat', 'max_heat', DOM.heat_percentage);
      update_heat_background(current_vars.get('current_heat'), current_vars.get('max_heat'));
    },
  },
  total_heat: { dom: DOM.stats_heat, num: true }, // Original was stats_heat
  max_heat: {
    dom: DOM.max_heat,
    num: true,
    onupdate: () => {
      perc('current_heat', 'max_heat', DOM.heat_percentage);
      if (DOM.auto_heat_reduce_display) { // auto_heat_reduce is the text display
          DOM.auto_heat_reduce_display.textContent = `-${fmt(current_vars.get('max_heat') / 10000)}`;
      }
      update_heat_background(current_vars.get('current_heat'), current_vars.get('max_heat'));
    },
  },
  exotic_particles: {
    dom: DOM.exotic_particles,
    num: true,
    onupdate: () => {
      if (DOM.reboot_exotic_particles) {
        DOM.reboot_exotic_particles.textContent = fmt(current_vars.get('exotic_particles'));
      }
    },
  },
  current_exotic_particles: {
    dom: DOM.current_exotic_particles,
    num: true,
    onupdate: () => {
      if (DOM.refund_exotic_particles) {
        const total_ep = current_vars.get('total_exotic_particles') || 0; // Ensure total_ep is defined
        const current_ep = current_vars.get('current_exotic_particles');
        DOM.refund_exotic_particles.textContent = fmt(total_ep - current_ep);
      }
    },
  },
  stats_cash: { dom: DOM.stats_cash, num: true, places: 2 },
  stats_outlet: { dom: DOM.stats_outlet, num: true, places: 2 },
  stats_inlet: { dom: DOM.stats_inlet, num: true, places: 2 },
  stats_vent: { dom: DOM.stats_vent, num: true, places: 2 },
  // stats_heat is already defined as total_heat for its main display
  money_add: { dom: DOM.money_per_tick, num: true },
  power_add: { dom: DOM.power_per_tick, num: true },
  heat_add: { dom: DOM.heat_per_tick, num: true },
};

// --- Core Update Functions ---
const update_var = (obj, value) => {
  if (obj.dom) {
    if (obj.num) {
      obj.dom.textContent = fmt(value, obj.places || null);
    } else {
      obj.dom.textContent = value;
    }
  }
  if (obj.onupdate) {
    obj.onupdate();
  }
};

const updateAllVars = () => {
  for (const [key, value] of update_vars) {
    const obj = var_objs[key];
    if (!obj) continue;
    update_var(obj, value);
  }
  update_vars.clear();
};

// --- Main Interface Update Loop Function ---
// This is a simplified structure. Original has more complex affordability checks.
let update_interface_task = null;
const update_interface_interval = 100; // ms

export function update_interface(_gameInstance = game) { // Pass game instance
  // const start_ui_loop = performance.now();

  // window.updateProperty(); // This was the old global function.
  // processBufferedProperties handles the 'Updated' flags for Tile properties.
  processBufferedProperties(); 
  
  // updateAllVars handles updating DOM elements based on current_vars (set by uiSay)
  updateAllVars();

  clearTimeout(update_interface_task);
  update_interface_task = setTimeout(() => update_interface(_gameInstance), update_interface_interval);

  // Reactor section specific updates (tile percentages)
  if (DOM.reactor_section && DOM.reactor_section.classList.contains('showing')) {
    for (const tile of _gameInstance.active_tiles_2d) {
      if (!tile || !tile.$el) continue; // $el will be set by UI event handlers for tiles
      
      const tilePercentEl = tile.$el.querySelector ? tile.$el.querySelector('.percent') : null; // Assuming $percent is a class within tile.$el
      if (!tilePercentEl) continue;

      if (tile.ticksUpdated) { // Assume ticksUpdated is a boolean flag on the tile
        if (tile.part) {
          const width = round_percentage(tile.ticks / tile.part.ticks, round_percentage(100/28)); // Original used Math.round(100/28)
          tilePercentEl.style.width = `${width}%`;
        } else {
          tilePercentEl.style.width = '0%';
        }
        tile.ticksUpdated = false;
      }

      if (tile.heat_containedUpdated) { // Assume heat_containedUpdated is a boolean flag
        if (tile.part && tile.part.containment) {
          const width = round_percentage(tile.heat_contained / tile.part.containment, round_percentage(100/28));
          tilePercentEl.style.width = `${width}%`;
        } else {
          tilePercentEl.style.width = '0%';
        }
        tile.heat_containedUpdated = false;
      }
    }
  }

  // Upgrade and Part affordability checks
  if (do_check_upgrades_affordability && _gameInstance.upgrade_objects_array) {
    // _gameInstance.checkAllUpgradesAffordability(); // This is now called by Upgrade.setLevel or on init.
                                                 // No need to call it every UI tick unless explicitly required.
    for (const upgrade of _gameInstance.upgrade_objects_array) {
      if (upgrade.$el && upgrade.affordableUpdated) { // Check if DOM element exists and update is needed
        if (upgrade.affordable) {
          upgrade.$el.classList.remove('unaffordable');
        } else {
          upgrade.$el.classList.add('unaffordable');
        }
        // Update level and cost text, and maxed status, as these might change
        const levelDisplay = upgrade.$el.querySelector('.level');
        if (levelDisplay) levelDisplay.textContent = `${upgrade.level}/${upgrade.max_level}`;
        
        const costDisplay = upgrade.$el.querySelector('.cost');
        if (costDisplay) costDisplay.textContent = upgrade.display_cost + (upgrade.upgrade.ecost ? ' EP' : '');

        if (upgrade.level >= upgrade.max_level) {
            upgrade.$el.classList.add('maxed');
            upgrade.$el.classList.remove('unaffordable'); // Maxed implies it's not 'unaffordable' in the typical sense
        } else {
            upgrade.$el.classList.remove('maxed');
        }
        upgrade.affordableUpdated = false; // Reset flag
      }
    }
  }

  // Part affordability (original logic from app.ui.js update_interface)
  // window.check_affordability(); // This is now _gameInstance.checkAllPartsAffordability() - needs to be created
  if (_gameInstance.part_objects_array && typeof _gameInstance.checkAllPartsAffordability === 'function') {
    // _gameInstance.checkAllPartsAffordability(); // Call if exists, or integrate directly below
    for (const part of _gameInstance.part_objects_array) {
        if (part.$el && part.affordableUpdated) { // Check if DOM element exists and update is needed
            if (part.affordable) {
                part.$el.classList.remove('unaffordable', 'locked'); // Locked might be separate
            } else {
                part.$el.classList.add('unaffordable');
                // Logic for 'locked' (e.g. due to erequires) would also go here or in Part.setAffordable
                if (part.erequires && (!_gameInstance.upgrade_objects[part.erequires] || !_gameInstance.upgrade_objects[part.erequires].level)) {
                    part.$el.classList.add('locked');
                } else {
                     part.$el.classList.remove('locked');
                }
            }
            part.affordableUpdated = false; // Reset flag
        }
    }
  }
  // console.log(performance.now() - start_ui_loop);
}

// --- uiSay: Event Emitter for UI Changes ---
const evts = {}; // Placeholder for specific event handlers (like row_added, tile_added from original)

export function uiSay(type, name, val) {
  if (type === 'var') {
    if (val === current_vars.get(name)) return;
    current_vars.set(name, val);
    update_vars.set(name, val);
  } else if (type === 'evt') {
    if (evts[name]) {
      evts[name](val); // Call the event handler if it exists
    } else {
      // console.log(`UI Event: ${name}`, val); // Log unhandled events for now
    }
  } else {
    // console.log('uiSay called with unknown type:', type, name, val);
  }
}

// Function to register event handlers for uiSay (evt type)
export function registerUiEventHandler(eventName, handler) {
    evts[eventName] = handler;
}

// Function to set the flag for checking upgrade affordability
export function setCheckUpgradesAffordability(value) {
    do_check_upgrades_affordability = value;
}

// Initialize current_vars with some defaults from game state if needed, or let uiSay populate it.
// Example: if (game.current_money !== undefined) current_vars.set('current_money', game.current_money);
// This ensures that initial UI rendering can use values from game state.
// This should ideally happen after game is loaded/initialized.
export function syncUiVarsWithGame() {
    uiSay('var', 'current_money', game.current_money);
    uiSay('var', 'current_power', game.current_power);
    uiSay('var', 'max_power', game.max_power);
    uiSay('var', 'current_heat', game.current_heat);
    uiSay('var', 'max_heat', game.max_heat);
    uiSay('var', 'exotic_particles', game.exotic_particles);
    uiSay('var', 'current_exotic_particles', game.current_exotic_particles);
    uiSay('var', 'total_exotic_particles', game.total_exotic_particles); // Added this
    uiSay('var', 'manual_heat_reduce', game.manual_heat_reduce);
    uiSay('var', 'auto_heat_reduce', game.max_heat / 10000); // As per original max_heat onupdate
    uiSay('var', 'flux_tick_time', game.dtime || 0); // Assuming game.dtime might be relevant
    // ... any other vars that need initial sync
}

console.log('uiUpdater.js loaded');
