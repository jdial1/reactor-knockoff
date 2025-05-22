import game from './gameState.js'; // Import the game instance
import { addPropertyTo } from '../../utils/objectUtils.js'; // Import the new utility

class Tile {
  constructor(row, col) {
    this.part = null;
    this.heat = 0;
    this.display_power = null;
    this.display_heat = null;
    this.power = 0;
    this.containments = [];
    this.cells = [];
    this.reflectors = [];
    this.activated = false;
    this.row = row;
    this.col = col;
    this.enabled = false;
    this.updated = false; // General flag, purpose might need review from original game_loop
    
    this.display_chance = 0;
    this.display_chance_percent_of_total = 0;

    // Use the imported addPropertyTo utility
    // This utility will add _propertyName, propertyNameUpdated, propertyNameLast
    // and a setter that uses the property_buffer from objectUtils.js
    addPropertyTo(this, 'heat_contained', 0);
    addPropertyTo(this, 'ticks', 0);
    
    // Initialize the 'Last' values used by processBufferedProperties if needed,
    // or ensure addPropertyTo does this. addPropertyTo initializes 'propertyNameLast' to undefined.
    // this.heat_containedLast = 0; // Or whatever initial 'Last' value makes sense
    // this.ticksLast = 0;

    // UI element reference - to be handled when UI is refactored
    this.$el = null; 
  }

  get vent() {
    // vent_multiplier would be from game state, passed or accessed via imported game instance
    // For now, assuming vent_multiplier is 0 or handled externally
    if (this.part && this.part.vent) {
      // const game = getGameInstance(); // hypothetical
      // return this.part.vent * (1 + game.vent_multiplier / 100);
      return this.part.vent; // Simplified for now
    }
    return 0;
  }

  get transfer() {
    // transfer_multiplier would be from game state
    if (this.part && this.part.transfer) {
      // const game = getGameInstance(); // hypothetical
      // return this.part.transfer * (1 + game.transfer_multiplier / 100);
      return this.part.transfer; // Simplified for now
    }
    return 0;
  }

  disable() {
    this.enabled = false;
    // ui.say('evt', 'tile_disabled', this); // UI interaction placeholder
    console.log(`Tile ${this.row},${this.col} disabled`);
    if (this.$el) {
        // Example of how UI might be updated if $el was a DOM element
        // this.$el.classList.add('disabled-state'); 
    }
  }

  enable() {
    this.enabled = true;
    // ui.say('evt', 'tile_enabled', this); // UI interaction placeholder
    console.log(`Tile ${this.row},${this.col} enabled`);
    if (this.$el) {
        // this.$el.classList.remove('disabled-state');
    }
  }
}

function initializeTiles(gameInstance) {
  gameInstance.tiles = [];
  gameInstance.tiles_2d = [];
  for (let ri = 0; ri < gameInstance.max_rows; ri++) {
    // gameInstance.ui.say('evt', 'row_added', ri); // UI interaction placeholder
    console.log(`Initializing row: ${ri}`);
    const rowArray = [];
    for (let ci = 0; ci < gameInstance.max_cols; ci++) {
      const tile = new Tile(ri, ci);
      rowArray.push(tile);
      gameInstance.tiles_2d.push(tile);
      // gameInstance.ui.say('evt', 'tile_added', { // UI interaction placeholder
      //   row: ri,
      //   column: ci,
      //   tile: tile
      // });
      tile.disable(); // Initial state as per original code
    }
    gameInstance.tiles.push(rowArray);
  }
  // After creating all tiles, update active tiles based on current game rows/cols
  // This assumes gameInstance._rows and gameInstance._cols are set (e.g. to base_rows/cols)
  gameInstance.update_active_tiles();
}

// Tile Operations Logic

const active_cells = []; // Kept local to tileManager.js for now

function* get_tile_in_range(gameInstance, tile, x) {
  // Above tile in range
  for (let i = x; i > 0; i--) {
    const row = gameInstance.tiles[tile.row - i];
    if (row) {
      for (let colIdx = tile.col + i - x; colIdx <= tile.col - i + x; colIdx++) {
        const tile2 = row[colIdx];
        if (tile2) {
          yield tile2;
        }
      }
    }
  }

  // Same row as tile
  const row = gameInstance.tiles[tile.row];
  if (row) { // Ensure row exists, though it should if tile.row is valid
    for (let colIdx = tile.col - x; colIdx < tile.col; colIdx++) {
      const tile2 = row[colIdx];
      if (tile2) {
        yield tile2;
      }
    }

    for (let colIdx = tile.col + 1; colIdx < tile.col + x + 1; colIdx++) {
      const tile2 = row[colIdx];
      if (tile2) {
        yield tile2;
      }
    }
  }


  // Below tile in range
  for (let i = 1; i < x + 1; i++) {
    const row = gameInstance.tiles[tile.row + i];
    if (row) {
      for (let colIdx = tile.col + i - x; colIdx <= tile.col - i + x; colIdx++) {
        const tile2 = row[colIdx];
        if (tile2) {
          yield tile2;
        }
      }
    }
  }
}

function* heat_exchanger6_range(gameInstance, tile) {
  if (tile.row - 1 >= 0) yield gameInstance.tiles[tile.row - 1][tile.col];
  // Ensure tile.row exists before slicing
  if (gameInstance.tiles[tile.row]) {
    yield* gameInstance.tiles[tile.row].slice(0, tile.col);
    yield* gameInstance.tiles[tile.row].slice(tile.col + 1);
  }
  if (tile.row + 1 < gameInstance.max_rows) yield gameInstance.tiles[tile.row + 1][tile.col]; // check against max_rows
}

function update_tiles(gameInstance) {
  let transfer_multiplier = 0; // Calculated based on gameInstance properties
  let vent_multiplier = 0; // Calculated based on gameInstance properties

  gameInstance.max_power = gameInstance.altered_max_power; // Referencing gameInstance
  gameInstance.max_heat = gameInstance.altered_max_heat; // Referencing gameInstance
  let total_heat = 0;
  gameInstance.stats_power = 0;

  active_cells.length = 0;

  let stat_vent = 0;
  let stat_inlet = 0;
  let stat_outlet = 0;

  let part_count = 0;

  for (const tile of gameInstance.active_tiles_2d) {
    if (!tile) continue; // Skip if tile is undefined
    // Enable all disabled tile in active tiles
    if (tile.enabled === false) {
      tile.enable();
    }

    const tile_part = tile.part;

    // Zero out heat and power
    tile.heat = 0;
    tile.power = 0;

    // Alter counts
    tile.containments.length = 0;
    tile.cells.length = 0;
    tile.reflectors.length = 0;

    if (tile_part && tile.activated) {
      part_count++;

      if (tile_part.vent) {
        stat_vent += tile_part.vent;
      }

      if (tile_part.category !== 'cell' || tile.ticks) {
        let tiles_in_range_gen;
        if (tile_part.id === 'heat_exchanger6') {
          tiles_in_range_gen = heat_exchanger6_range(gameInstance, tile);
        } else {
          tiles_in_range_gen = get_tile_in_range(gameInstance, tile, tile_part.range || 1);
        }

        for (const tile2 of tiles_in_range_gen) {
          if (!tile2) continue; // Skip if tile2 is undefined
          if (tile2.part && tile2.activated) {
            if (tile2.part.containment) {
              if (tile.part.category === 'vent' || tile.part.id === 'coolant_cell6') {
                tile.containments.unshift(tile2);
              } else {
                tile.containments.push(tile2);
              }
            } else if (tile2.part.category === 'cell' && tile2.ticks !== 0) {
              tile.cells.push(tile2);
            } else if (tile2.part.category === 'reflector') {
              tile.reflectors.push(tile2);
            }
          }
        }
      }

      if (tile_part.category === 'capacitor') {
        // Assuming part.level exists on tile_part.part (as per original: tile_part.part.level)
        // This structure (part.part) needs to be confirmed when Part class is refactored
        const level = tile_part.level || (tile_part.part && tile_part.part.level) || 0;
        transfer_multiplier += level * gameInstance.transfer_capacitor_multiplier;
        vent_multiplier += level * gameInstance.vent_capacitor_multiplier;
      } else if (tile_part.category === 'reactor_plating') {
        const level = tile_part.level || (tile_part.part && tile_part.part.level) || 0;
        transfer_multiplier += level * gameInstance.transfer_plating_multiplier;
        vent_multiplier += level * gameInstance.vent_plating_multiplier;
      }


      if (tile_part.category === 'heat_inlet') {
        stat_inlet += tile_part.transfer * tile.containments.length;
      }

      if (tile_part.category === 'heat_outlet') {
        stat_outlet += tile_part.transfer * tile.containments.length;
      }

      if (tile_part.category === 'cell') { // tile.ticks already checked above for range scan
        active_cells.push(tile);
      }

      if (tile_part.reactor_power) {
        gameInstance.max_power += tile_part.reactor_power;
      }

      if (tile_part.reactor_heat) {
        gameInstance.max_heat += tile_part.reactor_heat;
      }

      if (tile_part.id === 'reactor_plating6') {
        gameInstance.max_power += tile_part.reactor_heat; // Yes, reactor_heat, as per original
      }
    }
  }

  for (const tile of active_cells) {
    if (!tile) continue;
    const tile_part = tile.part;
    if (!tile_part) continue;


    if (tile.cells.length) {
      let pulses = 0;
      for (const tile2 of tile.cells) {
        if (tile2 && tile2.part) pulses += tile2.part.pulses;
      }
      // Ensure tile_part.part exists if cell_multiplier is there
      const cell_multiplier = (tile_part.part && tile_part.part.cell_multiplier) || tile_part.cell_multiplier || 0;
      tile.heat += tile_part.base_heat * Math.pow(cell_multiplier + pulses, 2) / tile_part.cell_count;
      tile.power += tile_part.base_power * (cell_multiplier + pulses);
    } else {
      tile.heat += tile_part.heat;
      tile.power += tile_part.power;
    }

    if (tile.reflectors.length) {
      let tile_power_mult = 0;
      let tile_heat_mult = 0;

      for (const tile_reflector of tile.reflectors) {
        if (tile_reflector && tile_reflector.part) {
          tile_power_mult += tile_reflector.part.power_increase;
          if (tile_reflector.part.heat_increase) {
            tile_heat_mult += tile_reflector.part.heat_increase;
          }
        }
      }
      tile.power += tile.power * (tile_power_mult / 100);
      tile.heat += tile.heat * (tile_heat_mult / 100);
    }

    tile.display_heat = tile.heat;
    tile.display_power = tile.power;

    total_heat += tile.heat;
    gameInstance.stats_power += tile.power;

    if (tile.containments.length) {
      const heat_remove = Math.ceil(tile.heat / tile.containments.length);
      for (const tile_containment of tile.containments) {
        if (tile_containment) { // Check if tile_containment is not null/undefined
             tile.heat -= heat_remove;
             tile_containment.heat += heat_remove;
        }
      }
    }
  }

  // console.log('ui.say(\'var\', \'max_power\', gameInstance.max_power);');
  // console.log('ui.say(\'var\', \'max_heat\', gameInstance.max_heat);');

  stat_vent *= (1 + vent_multiplier / 100);
  stat_inlet *= (1 + transfer_multiplier / 100);
  stat_outlet *= (1 + transfer_multiplier / 100);

  // console.log('ui.say(\'var\', \'stats_vent\', stat_vent);');
  // console.log('ui.say(\'var\', \'stats_inlet\', stat_inlet);');
  // console.log('ui.say(\'var\', \'stats_outlet\', stat_outlet);');

  if (part_count === 0 && gameInstance.current_power + gameInstance.current_money < gameInstance.base_money) {
    gameInstance.current_money = gameInstance.base_money - gameInstance.current_power;
    // console.log('ui.say(\'var\', \'current_money\', gameInstance.current_money);');
  }

  // console.log('ui.say(\'var\', \'stats_heat\', total_heat);');
  // console.log('ui.say(\'var\', \'total_power\', gameInstance.stats_power);');
  gameInstance.stats_cash = Math.ceil(gameInstance.max_power * gameInstance.auto_sell_multiplier);
  // console.log('ui.say(\'var\', \'stats_cash\', gameInstance.stats_cash);');
}


export { Tile, initializeTiles, update_tiles, get_tile_in_range, heat_exchanger6_range };
