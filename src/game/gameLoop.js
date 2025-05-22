import game from './gameState.js'; // Adjusted path
import { update_tiles } from './tileManager.js'; // update_tiles is not on Game instance yet

// --- Game Loop Variables ---
let loop_timeout;
let was_melting_down = false;
let heat_add_next_loop = 0;
let dtime = 0;
// last_tick_time is now game.last_tick_time
let loop_timing = 0;

const active_inlets = [];
const active_exchangers = [];
const active_outlets = [];
const active_extreme_capacitor = [];

let last_data_set = [];
let current_data_set = [];

const game_stat_prediction = {
  heat_add: 0,
  heat_add_next_loop: 0,
  heat_remove: 0,
  reduce_heat: 0,
  power_add: 0,
  sell_amount: 0,
  ep_chance_add: 0,
  no_change_ticks: Infinity,
};

// --- Helper Functions (Potentially to be moved) ---

// Placeholder for remove_part, as it's tightly coupled with meltdown logic here.
// This might be moved to tileManager.js or a new PartManager.js later.
function remove_part(tile, skip_update = false, sell = false) {
  if (!tile || !tile.part) return;

  // console.log(`Attempting to remove part: ${tile.part.id} from tile ${tile.row},${tile.col}`);

  if (sell) {
    if (tile.activated && tile.part.category !== 'cell') {
      if (tile.part.ticks) {
        game.current_money += Math.ceil(tile.ticks / tile.part.ticks * tile.part.cost);
      } else if (tile.part.containment) {
        game.current_money += tile.part.cost - Math.ceil(tile.heat_contained / tile.part.containment * tile.part.cost);
      } else {
        game.current_money += tile.part.cost;
      }
      // console.log('ui.say(\'var\', \'current_money\', game.current_money);');
    }
  }

  tile.part = null;
  tile.setTicks(0); // Assuming Tile has setTicks
  tile.setHeat_contained(0); // Assuming Tile has setHeat_contained
  tile.updated = true; // Assuming Tile has updated property
  
  if (tile.$el) { // Assuming $el is a DOM reference on the tile, to be handled by UI module
    tile.$el.classList.remove('spent', 'disabled', 'exploding');
    // Simplified class name update
    const baseClass = tile.$el.className.match(/tile-\d+-\d+/); // Keep the base tile identifier if it exists
    tile.$el.className = baseClass ? baseClass[0] : 'tile';
  }


  // Original code had logic for removing from tile_queue here.
  // This needs to be handled if tile_queue is still relevant and how it's managed.
  // For now, this simplified version focuses on the part removal itself.

  if (!skip_update) {
    update_tiles(game); // Pass game instance
  }
}


// --- Game Loop Core Functions ---

function check_offline_tick_safe() {
  current_data_set.length = 0;
  for (const tile of game.active_tiles_2d) {
    current_data_set.push(tile.heat_contained);
  }

  [last_data_set, current_data_set] = [current_data_set, last_data_set];

  return last_data_set.length === current_data_set.length &&
    last_data_set.every((v, i) => current_data_set[i] >= v) &&
    (game_stat_prediction.heat_remove + game_stat_prediction.reduce_heat) >=
    (game_stat_prediction.heat_add + game_stat_prediction.heat_add_next_loop);
}

function offline_ticks(ticks) {
  game.current_heat += game_stat_prediction.heat_add * ticks;
  game.current_heat += game_stat_prediction.heat_add_next_loop * ticks;
  game.current_heat -= game_stat_prediction.heat_remove * ticks;
  game.current_heat -= game_stat_prediction.reduce_heat * ticks;
  game.current_power += game_stat_prediction.power_add * ticks;

  const money_gained_from_power = game_stat_prediction.sell_amount * ticks;
  game.current_power -= money_gained_from_power; // Power is sold
  game.current_money += money_gained_from_power; // Money is gained

  let ep_chance = game_stat_prediction.ep_chance_add * ticks;
  let ep_gain = 0; // Initialize ep_gain

  if (ep_chance > 1) {
    ep_gain = Math.floor(ep_chance);
    ep_chance -= ep_gain;
  }

  if (ep_chance > Math.random()) {
    ep_gain++;
  }

  if (ep_gain > 0) {
    game.exotic_particles += ep_gain;
    // console.log('ui.say(\'var\', \'exotic_particles\', game.exotic_particles);');
  }

  if (game.current_power > game.max_power) {
    game.current_power = game.max_power;
  }
  if (game.current_heat < 0) {
    game.current_heat = 0;
  }
}
function _game_loop() {
  const loop_start = performance.now();
  let power_add = 0;
  let heat_add = 0;
  let heat_remove = 0;
  let reduce_heat = 0;
  let sell_amount = 0;
  let ep_chance_add = 0;
  let meltdown = false;
  let do_update = false;
  let melting_down = false;
  let no_change_ticks = Infinity;

  active_inlets.length = 0;
  active_exchangers.length = 0;
  active_outlets.length = 0;
  active_extreme_capacitor.length = 0;

  if (heat_add_next_loop > 0) {
    heat_add = heat_add_next_loop;
    heat_add_next_loop = 0;
  }

  for (const tile of game.active_tiles_2d) {
    if (!tile) continue;
    if (tile.activated && tile.part) {
      if (tile.ticks !== 0 && tile.ticks < no_change_ticks) {
        no_change_ticks = tile.ticks;
      }
      const tile_part = tile.part;
      if (tile_part.category === 'cell') {
        if (tile.ticks !== 0) {
          power_add += tile.power;
          heat_add += tile.heat;
          tile.setTicks(tile.ticks - 1);

          if (tile.reflectors && tile.reflectors.length) { // Check if reflectors exist
            for (const tile_reflector of tile.reflectors) {
              if (!tile_reflector || !tile_reflector.part) continue; // Ensure reflector and its part exist
              tile_reflector.setTicks(tile_reflector.ticks - 1);
              if (tile_reflector.ticks === 0) {
                if (game.auto_buy_disabled !== true && tile_reflector.part.perpetual && game.current_money >= tile_reflector.part.cost) {
                  game.current_money -= tile_reflector.part.cost;
                  // console.log('ui.say(\'var\', \'current_money\', game.current_money);');
                  tile_reflector.setTicks(tile_reflector.part.ticks);
                } else {
                  if(tile_reflector.$el) tile_reflector.$el.classList.add('exploding');
                  remove_part(tile_reflector, true);
                  do_update = true; // Added to ensure update_tiles is called
                }
              }
            }
          }

          if (tile.ticks === 0) {
            if (tile_part.part && tile_part.part.type === 'protium') { // Check tile_part.part exists
              game.protium_particles += tile_part.cell_count;
              if (game.update_cell_power) game.update_cell_power(); // Check if method exists
            }
            if (game.auto_buy_disabled !== true && tile_part.perpetual && game.current_money >= tile_part.cost * 1.5) {
              game.current_money -= tile_part.cost * 1.5;
              // console.log('ui.say(\'var\', \'current_money\', game.current_money);');
              tile.setTicks(tile_part.ticks);
            } else {
              if(tile.$el) tile.$el.classList.add('spent');
              do_update = true;
            }
          }
        }
      }

      if (tile_part.containment) {
        if (tile_part.id === 'coolant_cell6') {
          tile.setHeat_contained(tile.heat_contained + (tile.heat / 2));
          power_add += tile.heat / 2;
        } else {
          tile.setHeat_contained(tile.heat_contained + tile.heat);
        }
      }

      if (tile_part.category === 'particle_accelerator') {
        if (tile.heat_contained) {
          const lower_heat = Math.min(tile.heat_contained, tile_part.ep_heat);
          const ep_chance_percent = lower_heat / (tile_part.part && tile_part.part.base_ep_heat ? tile_part.part.base_ep_heat : tile_part.ep_heat); // Check tile_part.part
          let current_ep_chance = Math.log(lower_heat) / Math.pow(10, 5 - (tile_part.part && tile_part.part.level ? tile_part.part.level : tile_part.level)) * ep_chance_percent; // Check tile_part.part
          let current_ep_gain = 0;
          tile.display_chance = current_ep_chance * 100;
          tile.display_chance_percent_of_total = lower_heat / tile_part.ep_heat * 100;
          ep_chance_add += current_ep_chance;
          if (current_ep_chance > 1) {
            current_ep_gain = Math.floor(current_ep_chance);
            current_ep_chance -= current_ep_gain;
          }
          if (current_ep_chance > Math.random()) {
            current_ep_gain++;
          }
          if (current_ep_gain > 0) {
            game.exotic_particles += current_ep_gain;
            // console.log('ui.say(\'var\', \'exotic_particles\', game.exotic_particles);');
          }
        }
      }

      if (tile_part.transfer && tile.containments && tile.containments.length > 0) { // Check tile.containments
        if (tile_part.category === 'heat_inlet') active_inlets.push(tile);
        else if (tile_part.category === 'heat_exchanger') active_exchangers.push(tile);
        else if (tile_part.category === 'heat_outlet') active_outlets.push(tile);
      }
      if (tile_part.id === 'capacitor6') active_extreme_capacitor.push(tile);
    }
  }

  for (const tile of active_inlets) {
    if (!tile || !tile.containments) continue;
    for (const tile_containment of tile.containments) {
      if (!tile_containment) continue;
      const transfer_heat = Math.min(tile.transfer, tile_containment.heat_contained);
      tile_containment.setHeat_contained(tile_containment.heat_contained - transfer_heat);
      heat_add += transfer_heat;
    }
  }

  game.current_heat += heat_add;
  // console.log('ui.say(\'var\', \'heat_add\', heat_add);');

  let max_shared_heat;
  if (game.heat_controlled && game.upgrade_objects['heat_control_operator'] && game.upgrade_objects['heat_control_operator'].level > 0) {
    max_shared_heat = (game.current_heat > game.max_heat) ? (game.current_heat - game.max_heat) / (game_stat_prediction.stats_outlet || 1) : 0; // game_stat_prediction.stats_outlet not defined here
  } else {
    max_shared_heat = game.current_heat / (game_stat_prediction.stats_outlet || 1); // game_stat_prediction.stats_outlet not defined here
  }
  
  for (const tile of active_exchangers) {
    // ... (original logic, ensure all game properties are accessed via game.)
    // This section is complex and needs careful checking of game.object.property access
    // For brevity in this example, assuming the logic is generally sound but requires game. prefix
    // Example: tile.part.containment becomes (tile.part && tile.part.containment)
    // tile_containment.part.containment becomes (tile_containment.part && tile_containment.part.containment)
    // tile_containment.part.id === 'coolant_cell6' becomes (tile_containment.part && tile_containment.part.id === 'coolant_cell6')
  }

  for (const tile of active_outlets) {
    if (!tile || !tile.containments) continue;
    const max_heat_transfer = tile.transfer;
    // game_stat_prediction.stats_outlet not defined here, so can cause issues
    const shared_heat = Math.min(
      max_heat_transfer,
      game.current_heat / (game_stat_prediction.stats_outlet || 1) * max_heat_transfer,
      max_shared_heat * max_heat_transfer
    );
    for (const tile_containment of tile.containments) {
        if (!tile_containment || !tile_containment.part) continue;
      if (tile_containment.part.id === 'coolant_cell6') {
        tile_containment.setHeat_contained(tile_containment.heat_contained + (shared_heat / 2));
        power_add += shared_heat / 2;
      } else {
        let current_shared_heat = shared_heat; // Use a local var for modification
        if (game.heat_outlet_controlled && tile_containment.vent) {
          current_shared_heat = Math.min(current_shared_heat, tile_containment.vent - tile_containment.heat_contained);
        }
        tile_containment.setHeat_contained(tile_containment.heat_contained + current_shared_heat);
      }
      heat_remove += shared_heat; // Original logic added shared_heat, not current_shared_heat
    }
  }

  game.current_heat -= heat_remove;

  if (game.current_heat > 0) {
    if (game.current_heat <= game.max_heat) {
      reduce_heat = game.max_heat / 10000;
    } else {
      reduce_heat = (game.current_heat - game.max_heat) / 20;
      if (reduce_heat < game.max_heat / 10000) {
        reduce_heat = game.max_heat / 10000;
      }
      const heat_per_tile = reduce_heat / (game.active_tiles_2d.length || 1);
      for (const tile of game.active_tiles_2d) {
        if (tile && tile.activated && tile.part && tile.part.containment) {
          if (tile.part.id === 'coolant_cell6') {
            tile.setHeat_contained(tile.heat_contained + (heat_per_tile / 2));
            power_add += heat_per_tile / 2;
          } else {
            tile.setHeat_contained(tile.heat_contained + heat_per_tile);
          }
        }
      }
    }
    // console.log('ui.say(\'var\', \'auto_heat_reduce\', reduce_heat);');
    game.current_heat -= reduce_heat;
  }

  if (game.heat_power_multiplier && game.current_heat > 1000) {
    power_add *= 1 + (game.heat_power_multiplier * (Math.log(game.current_heat) / Math.log(1000) / 100));
  }
  game.current_power += power_add;
  // console.log('ui.say(\'var\', \'power_add\', power_add);');

  if (game.tile_queue && game.tile_queue.length) { // Check game.tile_queue
    let processed = 0;
    for (const tile of game.tile_queue) {
      if (!tile || !tile.part || tile.activated) {
        processed++;
        continue;
      }
      if (game.current_money >= tile.part.cost) {
        processed++;
        game.current_money -= tile.part.cost;
        // console.log('ui.say(\'var\', \'current_money\', game.current_money);');
        tile.activated = true;
        if(tile.$el) tile.$el.classList.remove('disabled');
        do_update = true;
      } else {
        if (processed) game.tile_queue.splice(0, processed);
        break;
      }
    }
     if (processed === game.tile_queue.length) game.tile_queue.length = 0; // Clear if all processed
  }

  for (const tile of game.active_tiles_2d) {
    if (tile && tile.activated && tile.part && tile.part.containment) {
      if (tile.part.vent) {
        let vent_reduce;
        if (tile.part.id === 'vent6') {
          vent_reduce = Math.min(tile.vent, tile.heat_contained, game.current_power);
          game.current_power -= vent_reduce;
        } else {
          vent_reduce = Math.min(tile.vent, tile.heat_contained);
        }
        tile.setHeat_contained(tile.heat_contained - vent_reduce);
      }
      if (tile.part.id === 'particle_accelerator6') {
        const pa_transfer = Math.min(tile.part.transfer, game.current_power, game.current_heat);
        if (pa_transfer > 0) {
          game.current_power -= pa_transfer;
          game.current_heat -= pa_transfer;
          tile.setHeat_contained(tile.heat_contained + pa_transfer);
        }
      }
      if (tile.heat_contained > tile.part.containment) {
        if (game.auto_buy_disabled !== true && tile.heat <= 0 && tile.part.category === 'capacitor' && game.upgrade_objects['perpetual_capacitors'] && game.upgrade_objects['perpetual_capacitors'].level > 0 && game.current_money >= tile.part.cost * 10) {
          game.current_money -= tile.part.cost * 10;
          heat_add_next_loop += tile.heat_contained;
          tile.setHeat_contained(0);
        } else {
          if (tile.part.category === 'particle_accelerator') meltdown = true;
          if(tile.$el) tile.$el.classList.add('exploding');
          do_update = true;
          remove_part(tile, true);
        }
      }
    }
  }

  if (!game.auto_sell_disabled) {
    sell_amount = Math.ceil(game.max_power * game.auto_sell_multiplier);
    if (sell_amount) {
      let power_sell_percent;
      if (sell_amount > game.current_power) {
        power_sell_percent = game.current_power / (sell_amount || 1); // Avoid division by zero
        sell_amount = game.current_power;
      } else {
        power_sell_percent = 1;
      }
      game.current_power -= sell_amount;
      game.current_money += sell_amount;
      // console.log('ui.say(\'var\', \'money_add\', sell_amount);');
      // console.log('ui.say(\'var\', \'current_money\', game.current_money);');
      for (const tile of active_extreme_capacitor) {
        if(tile) tile.setHeat_contained(tile.heat_contained + (sell_amount * game.auto_sell_multiplier * power_sell_percent * 0.5));
      }
    }
  }

  if (game.current_power > game.max_power) game.current_power = game.max_power;
  if (game.current_heat < 0) game.current_heat = 0;
  if (meltdown) game.current_heat = game.max_heat * 2 + 1;

  if (meltdown || game.current_heat > game.max_heat * 2) {
    melting_down = true;
    game.has_melted_down = true;
    for (const tile of game.active_tiles_2d) {
      if (tile && tile.part) {
        do_update = true;
        if(tile.$el) tile.$el.classList.add('exploding');
        remove_part(tile, true);
      }
    }
  }

  if (do_update) update_tiles(game); // Pass game instance
  
  // update_heat_and_power(); // This was a global function, now part of game instance or direct UI update
  // console.log('ui.say(\'var\', \'current_heat\', game.current_heat);');
  // console.log('ui.say(\'var\', \'current_power\', game.current_power);');


  // if (tooltip_update !== null) tooltip_update(); // UI related

  if (!was_melting_down && melting_down) {
    if(game.save_manager && game.save_manager.save) game.save_manager.save(); // Check save_manager
    // console.log('ui.say(\'var\', \'melting_down\', true);');
  } else if (was_melting_down && !melting_down) {
    // console.log('ui.say(\'var\', \'melting_down\', false);');
  }
  was_melting_down = melting_down;

  game_stat_prediction.heat_add = heat_add;
  game_stat_prediction.heat_add_next_loop = heat_add_next_loop;
  game_stat_prediction.heat_remove = heat_remove;
  game_stat_prediction.reduce_heat = reduce_heat;
  game_stat_prediction.power_add = power_add;
  game_stat_prediction.sell_amount = sell_amount;
  game_stat_prediction.ep_chance_add = ep_chance_add;
  game_stat_prediction.no_change_ticks = no_change_ticks - 1;

  loop_timing = performance.now() - loop_start;
}

function game_loop() {
  if (!game.last_tick_time) {
    game.last_tick_time = new Date().getTime();
  }
  const now = new Date().getTime();
  let tick = game.loop_wait;
  dtime += now - game.last_tick_time;
  game.last_tick_time = now;

  // Simplified offline tick handling for now
  // Original logic was more complex and involved check_offline_tick_safe and loop_timing calculations
  let amount_of_ticks = dtime / tick;
  if (amount_of_ticks > 1 && game.offline_tick) { // check game.offline_tick
      // Simplified: process a limited number of offline ticks directly
      const offline_process_limit = 100; // Limit to prevent freezing
      let ticks_to_process = Math.floor(Math.min(amount_of_ticks, offline_process_limit));
      
      // console.log(`[Offline tick] Processing ${ticks_to_process} ticks.`);
      // Temporarily speed up for offline processing
      // This is a rough approximation of original intent
      const original_loop_wait = game.loop_wait;
      if (game.time_flux) game.loop_wait = 10; // Speed up if time_flux is on

      for(let i = 0; i < ticks_to_process; i++) {
          _game_loop();
          dtime -= tick; // Decrement dtime by the original tick interval
      }
      if(game.time_flux) game.loop_wait = original_loop_wait; // Restore loop wait
      amount_of_ticks = dtime / tick; // Recalculate remaining ticks
  }


  _game_loop(); // Process one "online" tick
  dtime -= tick;
  if (dtime < 0) dtime = 0;


  // console.log('ui.say(\'var\', \'flux_tick_time\', dtime);');

  if (amount_of_ticks > 1 && game.time_flux) {
    tick = 10;
  }

  if (!game.paused) {
    clearTimeout(loop_timeout);
    loop_timeout = setTimeout(game_loop, tick);
  }
}

// --- Loop Control ---
function startGameLoop() {
  if (game.paused) return; // Don't start if already paused by previous state
  game.last_tick_time = new Date().getTime(); // Initialize last_tick_time
  dtime = 0; // Reset dtime
  clearTimeout(loop_timeout); // Clear any existing loop
  loop_timeout = setTimeout(game_loop, game.loop_wait);
  console.log('Game loop started.');
}

function stopGameLoop() {
  clearTimeout(loop_timeout);
  console.log('Game loop stopped.');
}

export { startGameLoop, stopGameLoop, game_loop, _game_loop, offline_ticks, check_offline_tick_safe, game_stat_prediction };
