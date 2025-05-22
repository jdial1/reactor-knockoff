// This module will house functions related to tile interactions and game events.
// It will have dependencies on UI, Parts, and the main game instance.

import game from './gameState.js'; // Assuming game state might be needed
import { update_tiles } from './tileManager.js'; // For updating tiles after an action

// Placeholder for clicked_part, which would come from a UI/PartSelection module
let clicked_part = null; 

// Placeholder for tile_queue, which is part of the game state or managed by game rules
// let tile_queue = game.tile_queue || []; // Access from game instance if available

/**
 * Applies a part to a tile.
 * Original function from js/app.js
 * @param {Tile} tile The tile to apply the part to.
 * @param {Part} part The part to apply.
 * @param {boolean} force Skip enablement check.
 */
function apply_to_tile(tile, part, force = false) {
  if (!tile) return;
  if (!tile.enabled && !force) {
    // console.log(`Tile ${tile.row},${tile.col} is not enabled. Cannot apply part.`);
    return;
  }

  tile.part = part;
  if (tile.$el) { // UI related
    tile.$el.classList.remove('spent', 'disabled', 'exploding');
    // Simplified class name update, actual part/category classes would be more dynamic
    // const part_replace = /[\b\s]part_[a-z0-9_]+\b/;
    // const category_replace = /[\b\s]category_[a-z_]+\b/;
    // tile.$el.className = tile.$el.className
    //   .replace(part_replace, '')
    //   .replace(category_replace, '')
    //   + ' ' + part.className // Assuming part has a className property
    //   + ' category_' + part.category;

    if (part.ticks) {
      if (!tile.ticks) {
        // tile.$el.classList.add('spent');
      }
    }
    if (!tile.activated) {
      // tile.$el.classList.add('disabled');
    }
  }
  // console.log(`Applied part ${part ? part.id : 'null'} to tile ${tile.row},${tile.col}`);
}

/**
 * Removes a part from a tile.
 * Original function from js/app.js
 * @param {Tile} remove_tile The tile to remove the part from.
 * @param {boolean} skip_update Skip calling update_tiles.
 * @param {boolean} sell If true, refund part cost.
 */
function remove_part(remove_tile, skip_update = false, sell = false) {
  if (!remove_tile || !remove_tile.part) return;

  // console.log(`Removing part from tile ${remove_tile.row},${remove_tile.col}. Sell: ${sell}`);

  if (sell) {
    if (remove_tile.activated && remove_tile.part.category !== 'cell') {
      if (remove_tile.part.ticks) {
        game.current_money += Math.ceil(remove_tile.ticks / remove_tile.part.ticks * remove_tile.part.cost);
      } else if (remove_tile.part.containment) {
        game.current_money += remove_tile.part.cost - Math.ceil(remove_tile.heat_contained / remove_tile.part.containment * remove_tile.part.cost);
      } else {
        game.current_money += remove_tile.part.cost;
      }
      // console.log('ui.say(\'var\', \'current_money\', game.current_money);');
    }
  }

  remove_tile.part = null;
  if (typeof remove_tile.setTicks === 'function') remove_tile.setTicks(0);
  if (typeof remove_tile.setHeat_contained === 'function') remove_tile.setHeat_contained(0);
  remove_tile.updated = true;
  
  if (remove_tile.$el) { // UI related
    remove_tile.$el.classList.remove('spent', 'disabled', 'exploding');
    // const part_replace = /[\b\s]part_[a-z0-9_]+\b/;
    // const category_replace = /[\b\s]category_[a-z_]+\b/;
    // remove_tile.$el.className = remove_tile.$el.className
    //   .replace(part_replace, '')
    //   .replace(category_replace, '');
  }


  if (!skip_update) {
    update_tiles(game); // Pass game instance
  }

  // Original logic for tile_queue manipulation:
  // This needs to be adapted based on how tile_queue is managed in the new structure
  // For now, it's commented out as game.tile_queue might not be directly mutable this way.
  /*
  const rpl = game.tile_queue ? game.tile_queue.length : 0;
  if (rpl) {
    for (let rpqi = 0; rpqi < rpl; rpqi++) {
      const tile2 = game.tile_queue[rpqi];
      if (tile2 === remove_tile || !tile2.part) { // Check if it's the removed tile or tile has no part
        game.tile_queue.splice(rpqi, 1);
        rpqi--; // Adjust index after splice
        // rpl--; // Length changes, but loop condition will handle it
      }
    }
  }
  */
}

/**
 * Handles mouse click on a tile to apply or remove a part.
 * Original function from js/app.js
 * @param {Event} e The mouse event.
 * @param {boolean} skip_update Skip calling update_tiles.
 * @param {number} part_replacement_result Result from part_replaceable check.
 */
function mouse_apply_to_tile(e, skip_update = false, part_replacement_result) {
  // 'this' in the original code referred to the DOM element of the tile.
  // This needs to be adapted. For now, assume 'tile' is passed directly or obtained via 'e.target'.
  // This function will require significant refactoring once UI interaction is handled.
  
  // const tile = this.tile; // 'this.tile' was how original code got the Tile object from DOM element.
  // For now, let's assume 'e.target.tile' might hold it, or it's passed in.
  // This is a major placeholder.
  const tile = e.target && e.target.tile; 
  if (!tile) {
    // console.error("mouse_apply_to_tile: Tile object not found on event target.");
    return;
  }

  const tile_mousedown_right = e.button === 2; // Assuming standard mouse buttons

  // console.log(`Mouse apply to tile ${tile.row},${tile.col}. Right click: ${tile_mousedown_right}`);

  if (tile_mousedown_right) {
    remove_part(tile, skip_update, true);
  } else if (clicked_part) {
    // The logic for part_replaceable and cost checking is complex and
    // depends on clicked_part and game.current_money.
    // This is heavily simplified and commented out.
    /*
    const can_replace = skip_replaceable_check || (part_replacement_result = tile_replaceable(tile));
    const can_afford = (part_replacement_result !== 3 || game.current_money >= clicked_part.cost);

    if (can_replace && (part_replacement_result !== 2 || tile.activated === false || tile.ticks === 0) && can_afford) {
      remove_part(tile, true, true); // Reclaim money
      if (game.current_money < clicked_part.cost) {
        tile.activated = false;
        if(game.tile_queue) game.tile_queue.push(tile);
      } else {
        tile.activated = true;
        game.current_money -= clicked_part.cost;
        // ui.say('var', 'current_money', game.current_money);
      }
      if (typeof tile.setTicks === 'function') tile.setTicks(clicked_part.ticks);
      apply_to_tile(tile, clicked_part);
      if (!skip_update) {
        update_tiles(game);
      }
    }
    */
  }
}

// Placeholder for setClickedPart, as clicked_part is local here for now
function setClickedPart(part) {
    clicked_part = part;
    // console.log("Clicked part set to:", part ? part.id : null);
}

// Variables for tile interaction logic (moved from js/app.js)
let tile_mousedown = false;
let tile_mousedown_right = false;
// let tile_queue = game.tile_queue || []; // Managed by gameInstance now
let last_click_button = null; // To track which mouse button was pressed
let last_tile_interacted = null;
let double_click_tile_ref = null; // Stores the Tile object for double click comparison
let double_click_part_ref = null; // Stores part on the tile at first click
let double_click_ticks_ref = null; // Stores ticks on the tile at first click
let clear_double_click_task = null;

function clearDoubleClickState() {
    double_click_tile_ref = null;
    double_click_part_ref = null;
    double_click_ticks_ref = null;
}

/**
 * Determines which hotkey action to perform based on modifier keys.
 * @param {Tile} tile - The tile instance involved in the event.
 * @param {MouseEvent} event - The mouse event.
 * @param {object} gameInstance - The main game instance.
 * @returns {Generator|null} A generator yielding tiles, or null if no hotkey action.
 */
function determineHotkeyAction(tile, event, gameInstance) {
    if (!gameInstance || !gameInstance.hotkeyManager) return null;

    if (event.shiftKey && event.ctrlKey && event.altKey) {
        return gameInstance.hotkeyManager.checker(tile);
    } else if (event.shiftKey && event.ctrlKey) {
        return gameInstance.hotkeyManager.shift_row(tile);
    } else if (event.shiftKey && event.altKey) {
        return gameInstance.hotkeyManager.shift_column(tile);
    } else if (event.ctrlKey) {
        return gameInstance.hotkeyManager.row(tile);
    } else if (event.altKey) {
        return gameInstance.hotkeyManager.column(tile);
    }
    // Special handling for double click or shift+click for replacer/remover
    // This part needs careful integration with the mousedown logic that sets double_click_tile_ref etc.
    // For now, this function focuses on modifier-based hotkeys.
    // The replacer/remover logic based on double_click_tile_ref will be in the mousedown handler.
    return null; 
}

// Check if tile part is replaceable with clicked/selected part
// return values:
//    0 = tile can't be replace with the selected part
//    1 = empty tile, can be safely removed or queued
//    2 = same parts, should check ticks before replacing if needed, ie: check cell empty before replacing
//    3 = different parts but same category, should check amount of money for replacement if needed
function part_replaceable(partOnTile, currentClickedPart) {
    if (currentClickedPart) {
        if (!partOnTile) return 1; // Empty tile
        if (partOnTile === currentClickedPart) return 2; // Same part
        if (partOnTile.category === currentClickedPart.category) return 3; // Same category
    }
    return 0; // Not replaceable or no part selected
}


/**
 * Handles the mousedown event on a reactor tile.
 * @param {MouseEvent} event - The mousedown event.
 * @param {object} gameInstance - The main game instance.
 */
export function handleReactorTileMousedown(event, gameInstance) {
    if (!event.target.tile) return; // Ensure the clicked element has a .tile property
    const currentTile = event.target.tile;

    tile_mousedown = true;
    tile_mousedown_right = event.button === 2; // Right click
    last_click_button = event.button;
    last_tile_interacted = currentTile;

    let tilesToProcess = null;
    let partReplacementResult; // To pass to mouse_apply_to_tile if needed

    // Check for double click / shift+click specific actions (remover/replacer)
    if ( (event.shiftKey && !tile_mousedown_right) || // Shift + Left Click for replacer
         (event.shiftKey && tile_mousedown_right) ||  // Shift + Right Click for remover
         (double_click_tile_ref && last_click_button === event.button && double_click_tile_ref === currentTile) // Double click
       ) {
        const partForAction = event.shiftKey ? currentTile.part : double_click_part_ref;
        const ticksForAction = event.shiftKey ? currentTile.ticks : double_click_ticks_ref;
        
        if (tile_mousedown_right && partForAction) { // Remover logic (Shift + Right or Double Right Click)
            tilesToProcess = gameInstance.hotkeyManager.remover(partForAction, ticksForAction);
            // For remover, partReplacementResult is not directly used by mouse_apply_to_tile in the same way
        } else if (!tile_mousedown_right && clicked_part) { // Replacer logic (Shift + Left or Double Left Click)
            // If it's a double click, use the part from the first click for comparison
            // If it's a shift+click, use the current tile's part for comparison to find others.
            const referencePartForComparison = event.shiftKey ? currentTile.part : double_click_part_ref;
            partReplacementResult = part_replaceable(referencePartForComparison, clicked_part);
            tilesToProcess = gameInstance.hotkeyManager.replacer(referencePartForComparison); 
        }

    } else { // Regular click or modifier hotkeys
        tilesToProcess = determineHotkeyAction(currentTile, event, gameInstance);
    }

    if (tilesToProcess) {
        for (const tile of tilesToProcess) {
            // mouse_apply_to_tile expects the event to have 'this.tile' in original code.
            // We need to simulate that or pass tile directly.
            // Create a mock event or adapt mouse_apply_to_tile.
            // For now, let's assume mouse_apply_to_tile can be adapted to take tile directly.
            const mockEvent = { target: { tile: tile }, button: event.button };
            mouse_apply_to_tile(mockEvent, true, partReplacementResult); // true for skip_update
        }
        update_tiles(gameInstance); // Single update after all changes
    } else {
        // Standard single tile click/action
        mouse_apply_to_tile(event); // Pass original event
    }

    // Double click state management
    if (!event.shiftKey) { // Don't interfere with shift+click chains for double click logic
        double_click_part_ref = currentTile.part;
        double_click_ticks_ref = currentTile.ticks;
        double_click_tile_ref = currentTile;
        if (clear_double_click_task) clearTimeout(clear_double_click_task);
        clear_double_click_task = setTimeout(clearDoubleClickState, 300);
    }
}

/**
 * Handles mousemove over reactor tiles, applying action if mouse button is down.
 * @param {MouseEvent} event - The mousemove event.
 * @param {object} gameInstance - The main game instance.
 */
export function handleReactorTileMousemove(event, gameInstance) {
    if (!tile_mousedown || !event.target.tile || last_tile_interacted === event.target.tile) {
        return;
    }
    const currentTile = event.target.tile;
    last_tile_interacted = currentTile;

    // Logic similar to mousedown for applying action during drag
    let tilesToProcess = null;
    let partReplacementResult;

    if ( (event.shiftKey && !tile_mousedown_right) || // Shift + Left Drag
         (event.shiftKey && tile_mousedown_right) ||  // Shift + Right Drag
         (double_click_tile_ref && last_click_button === event.button && double_click_tile_ref === currentTile)
       ) {
        const partForAction = event.shiftKey ? currentTile.part : double_click_part_ref;
        const ticksForAction = event.shiftKey ? currentTile.ticks : double_click_ticks_ref;

        if (tile_mousedown_right && partForAction) {
            tilesToProcess = gameInstance.hotkeyManager.remover(partForAction, ticksForAction);
        } else if (!tile_mousedown_right && clicked_part) {
            const referencePartForComparison = event.shiftKey ? currentTile.part : double_click_part_ref;
            partReplacementResult = part_replaceable(referencePartForComparison, clicked_part);
            tilesToProcess = gameInstance.hotkeyManager.replacer(referencePartForComparison);
        }
    } else {
        tilesToProcess = determineHotkeyAction(currentTile, event, gameInstance);
    }
    
    if (tilesToProcess) {
        for (const tile of tilesToProcess) {
            const mockEvent = { target: { tile: tile }, button: last_click_button }; // Use last_click_button for drag
            mouse_apply_to_tile(mockEvent, true, partReplacementResult);
        }
        update_tiles(gameInstance);
    } else {
        const mockEvent = { target: { tile: currentTile }, button: last_click_button };
        mouse_apply_to_tile(mockEvent);
    }
}

/**
 * Handles mouseup event globally to reset dragging state.
 */
export function handleGlobalMouseup() {
    tile_mousedown = false;
    tile_mousedown_right = false;
    // last_click_button = null; // Keep last_click_button for potential 'click' event after mouseup
}


export { apply_to_tile, remove_part, mouse_apply_to_tile, setClickedPart };
