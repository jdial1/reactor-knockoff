import * as DOM from './domElements.js';
import game from '../game/gameState.js'; // Direct import for now
import { fmt } from '../utils/numberFormatting.js';
// import { uiSay } from './uiUpdater.js'; // If needed to trigger further UI changes

let adjust_primary_size_timeout;
export function adjust_primary_size() {
    if (!DOM.reactor_section || !DOM.primary) return;
    // If an element has display:none, it's offsetWidth would be 0
    // so we have to temporary restore the display to get it's real offsetWidth
    const original_display = DOM.reactor_section.style.display;
    DOM.reactor_section.style.display = 'inherit';
    // We also have to unset the width or else the offsetWidth would be capped to the primary width
    DOM.primary.style.width = '';
    DOM.primary.style.width = `${DOM.reactor_section.offsetWidth + 32}px`;
    DOM.reactor_section.style.display = original_display;
}

export const coreEventHandlers = {
  row_added: (rowIndex) => {
    // console.log(`Event: row_added - Row ${rowIndex}`);
    // In the original, this created a DOM element for the row and added it to $reactor.
    // This kind of DOM construction will be part of a dedicated Tile UI rendering system.
    // For now, we acknowledge the event.
    // Example of what it might do:
    // const rowDiv = document.createElement('div');
    // rowDiv.className = 'row';
    // DOM.reactor.appendChild(rowDiv);
    // game.ui.elements.rows[rowIndex] = { dom: rowDiv, tiles: [] }; // Store for later use
  },

  tile_added: (val) => { // val is { row: ri, column: ci, tile: tile }
    // console.log(`Event: tile_added - Tile at ${val.row},${val.column}`);
    const tile = val.tile;
    // Original code created a button, set its tile property, and added percent bar elements.
    // This DOM creation logic will be moved to a dedicated Tile UI rendering part.
    // For now, we'll just ensure the tile object gets its $el placeholder.
    // tile.$el = document.createElement('button'); // Placeholder
    // tile.$el.className = 'tile';
    // tile.$el.tile = tile; // Crucial link for event handlers to get back to the Tile object

    // const percentWrapperWrapper = document.createElement('div');
    // percentWrapperWrapper.className = 'percent_wrapper_wrapper';
    // const percentWrapper = document.createElement('div');
    // percentWrapper.className = 'percent_wrapper';
    // tile.$percent = document.createElement('p'); // Store reference for updates
    // tile.$percent.className = 'percent';
    // percentWrapper.appendChild(tile.$percent);
    // percentWrapperWrapper.appendChild(percentWrapper);
    // tile.$el.appendChild(percentWrapperWrapper);

    // const gameRow = game.ui.elements.rows[val.row]; // Assuming rows are stored
    // if (gameRow) {
    //   gameRow.dom.appendChild(tile.$el);
    //   gameRow.tiles.push(tile);
    // }
    // tile.disable(); // This method exists on Tile, but $el might not be fully ready.
  },

  part_added: (part_obj) => { // part_obj is the instance of the Part class
    // console.log(`Event: part_added - Part ${part_obj.id}`);
    // Original code created a button for the part shop.
    // part_obj.className = `part_${part_obj.id}`; // Store for class list
    // part_obj.$el = document.createElement('BUTTON');
    // part_obj.$el.className = `part locked ${part_obj.className}`; // Initial classes
    // part_obj.$el._part = part_obj; // Link back to the part object

    // const imageDiv = document.createElement('div');
    // imageDiv.className = 'image';
    // imageDiv.textContent = 'Click to Select'; // Placeholder text/image
    // part_obj.$el.appendChild(imageDiv);

    // // Append to correct category container
    // const category = part_obj.category || (part_obj.part && part_obj.part.category);
    // switch (category) {
    //   case 'cell': if (DOM.cells_container) DOM.cells_container.appendChild(part_obj.$el); break;
    //   case 'reflector': if (DOM.reflectors_container) DOM.reflectors_container.appendChild(part_obj.$el); break;
    //   // ... other categories
    //   default: console.warn(`Unknown part category for UI: ${category}`);
    // }
  },

  tile_disabled: (tile) => {
    // console.log(`Event: tile_disabled - Tile ${tile.row},${tile.col}`);
    if (tile && tile.$el) { // $el would be the DOM element for the tile
      tile.$el.classList.remove('enabled');
    }
    clearTimeout(adjust_primary_size_timeout);
    adjust_primary_size_timeout = setTimeout(adjust_primary_size, 10);
  },

  tile_enabled: (tile) => {
    // console.log(`Event: tile_enabled - Tile ${tile.row},${tile.col}`);
    if (tile && tile.$el) { // $el would be the DOM element for the tile
      tile.$el.classList.add('enabled');
    }
    clearTimeout(adjust_primary_size_timeout);
    adjust_primary_size_timeout = setTimeout(adjust_primary_size, 10);
  },

  game_inited: () => {
    // console.log('Event: game_inited');
    // The main update_interface loop is started by UIManager.init -> uiUpdater.update_interface
    // So, no explicit call needed here unless there's post-init specific UI logic.
  },

  game_loaded: () => {
    // console.log('Event: game_loaded');
    if (DOM.parts) DOM.parts.scrollTop = DOM.parts.scrollHeight; // Scroll part shop
  },

  game_updated: () => { // Fired when game version changes on load
    // console.log('Event: game_updated (version change)');
    // This originally called _show_page('reactor_upgrades', 'patch_section', true);
    // The UIManager will need a showPage method.
    if (game.ui && typeof game.ui.showPage === 'function') {
      game.ui.showPage('reactor_upgrades', 'patch_section'); // Removed boolean, handle in showPage
    }
  },

  objective_unloaded: () => {
    // console.log('Event: objective_unloaded');
    if (DOM.objectives_section) DOM.objectives_section.classList.add('unloading');
  },

  objective_loaded: (objectiveData) => {
    // console.log('Event: objective_loaded', objectiveData);
    if (DOM.objectives_section && DOM.objective_title && DOM.objective_reward) {
      DOM.objectives_section.classList.add('loading');
      DOM.objective_title.textContent = objectiveData.title;
      if (objectiveData.reward) {
        DOM.objective_reward.textContent = `$${fmt(objectiveData.reward)}`;
      } else if (objectiveData.ep_reward) {
        DOM.objective_reward.textContent = `${fmt(objectiveData.ep_reward)}EP`;
      } else {
        DOM.objective_reward.textContent = '';
      }
      DOM.objectives_section.classList.remove('unloading');
      setTimeout(() => {
        if (DOM.objectives_section) DOM.objectives_section.classList.remove('loading');
      }, 100);
    }
  },
  
  // Handlers for button text updates based on game state changes (from original evts)
  // These will be called by uiSay('evt', 'paused') etc.
  // The actual button enabling/disabling is handled by the toggleButton system itself.
  paused: () => {
    if (game.ui && typeof game.ui.updateToggleButtonText === 'function') {
      game.ui.updateToggleButtonText('#pause_toggle');
    }
  },
  unpaused: () => {
    if (game.ui && typeof game.ui.updateToggleButtonText === 'function') {
      game.ui.updateToggleButtonText('#pause_toggle');
    }
  },
  auto_sell_disabled: () => {
    if (game.ui && typeof game.ui.updateToggleButtonText === 'function') {
      game.ui.updateToggleButtonText('#auto_sell_toggle');
    }
  },
  auto_sell_enabled: () => {
    if (game.ui && typeof game.ui.updateToggleButtonText === 'function') {
      game.ui.updateToggleButtonText('#auto_sell_toggle');
    }
  },
  auto_buy_disabled: () => {
    if (game.ui && typeof game.ui.updateToggleButtonText === 'function') {
      game.ui.updateToggleButtonText('#auto_buy_toggle');
    }
  },
  auto_buy_enabled: () => {
    if (game.ui && typeof game.ui.updateToggleButtonText === 'function') {
      game.ui.updateToggleButtonText('#auto_buy_toggle');
    }
  },
  heat_control_disabled: () => {
    if (game.ui && typeof game.ui.updateToggleButtonText === 'function') {
      game.ui.updateToggleButtonText('#heat_control_toggle');
    }
  },
  heat_control_enabled: () => {
    if (game.ui && typeof game.ui.updateToggleButtonText === 'function') {
      game.ui.updateToggleButtonText('#heat_control_toggle');
    }
  },
  time_flux_disabled: () => {
    if (game.ui && typeof game.ui.updateToggleButtonText === 'function') {
      game.ui.updateToggleButtonText('#time_flux_toggle');
    }
  },
  time_flux_enabled: () => {
    if (game.ui && typeof game.ui.updateToggleButtonText === 'function') {
      game.ui.updateToggleButtonText('#time_flux_toggle');
    }
  },
   melting_down: (isMelting) => { // Added from gameLoop logic
    // console.log('Event: melting_down', isMelting);
    // This would typically update a visual indicator for meltdown state.
  },
};

export function attachDirectButtonListeners(uiManagerInstance) {
    const gameInstance = uiManagerInstance.game; // Get game instance from uiManager

    if (!gameInstance) {
        console.error("Game instance is not available in attachDirectButtonListeners.");
        return;
    }

    // Reboot and Refund
    if (DOM.reboot_button) {
        DOM.reboot_button.addEventListener('click', (event) => {
            event.preventDefault();
            if (confirm("Are you sure you want to reboot? This will reset progress but keep exotic particles and related upgrades.")) {
                if (typeof gameInstance.reboot === 'function') gameInstance.reboot();
                else console.warn('gameInstance.reboot is not a function');
            }
        });
    }
    if (DOM.refund_button) {
        DOM.refund_button.addEventListener('click', (event) => {
            event.preventDefault();
            if (confirm("Are you sure you want to refund? This will reset all progress, including exotic particles and their upgrades, giving you all EP back.")) {
                 if (typeof gameInstance.reboot === 'function') gameInstance.reboot(true); // Pass true for refund
                 else console.warn('gameInstance.reboot is not a function');
            }
        });
    }

    // Reduce Heat Manually
    if (DOM.reduce_heat_button) {
        DOM.reduce_heat_button.addEventListener('click', (event) => {
            event.preventDefault();
            if (typeof gameInstance.manual_reduce_heat === 'function') gameInstance.manual_reduce_heat();
        });
    }

    // Sell Power
    if (DOM.sell_button) {
        DOM.sell_button.addEventListener('click', (event) => {
            event.preventDefault();
            if (typeof gameInstance.sell_power === 'function') gameInstance.sell_power();
        });
    }

    // Save/Load/Export/Import related buttons

    // Enable Local Saver Button
    if (DOM.enable_local_save_button) {
        DOM.enable_local_save_button.addEventListener('click', (event) => {
            event.preventDefault();
            if (gameInstance.saveLoadManager) {
                gameInstance.saveLoadManager.setActiveSaver('local');
                // UI should update based on 'saver_changed' event from SaveLoadManager
                // to hide/show the correct enable button.
                // Example: DOM.enable_local_save_button.style.display = 'none';
                //          DOM.enable_google_drive_save_button.style.display = '';
            }
        });
    }

    // Enable Google Drive Saver Button
    if (DOM.enable_google_drive_save_button) {
        DOM.enable_google_drive_save_button.addEventListener('click', (event) => {
            event.preventDefault();
            if (gameInstance.saveLoadManager) {
                gameInstance.saveLoadManager.setActiveSaver('google');
                // UI should update based on 'saver_changed' event.
                // Example: DOM.enable_google_drive_save_button.style.display = 'none';
                //          DOM.enable_local_save_button.style.display = '';
            }
        });
    }
    
    // Manual Save Button
    if (DOM.trigger_save_button) {
        DOM.trigger_save_button.addEventListener('click', () => {
            if (gameInstance.saveLoadManager) {
                 gameInstance.saveLoadManager.saveGame();
                 // The saveGame method in SaveLoadManager now handles the alert/notification.
            } else {
                alert("Save manager not available.");
            }
        });
    }
    
    // More save/load buttons (download, export, import) would follow a similar pattern,
    // but their full implementation depends on the SaveManager and specific UI logic (like modals)
    // which is out of scope for this step's primary focus on event attachment.
    // For now, we'll log that they are placeholders.

    if (DOM.download_save_button) {
        DOM.download_save_button.addEventListener('click', () => {
            console.log("Download save button clicked - full implementation pending SaveManager.");
            // Original logic:
            // var save_data = ui.game.saves();
            // ui.game.save_manager.active_saver.save(save_data);
            // var saveAsBlob = new Blob([ save_data ], { type: 'text/plain' });
            // ... createObjectURL, downloadLink ...
        });
    }

    if (DOM.export_save_button) {
        DOM.export_save_button.addEventListener('click', () => {
            console.log("Export save button clicked - full implementation pending SaveManager and modal UI.");
            // Original logic:
            // var save_data = ui.game.saves();
            // ui.game.save_manager.active_saver.save(save_data);
            // $('#import_button').style.display = "none";
            // $("#txtImportExport").value = save_data;
            // $("#txtImportExport").select();
            // $("#Import_Export_dialog").showModal();
        });
    }
    
    if (DOM.import_save_button) { // The one that opens the dialog
        DOM.import_save_button.addEventListener('click', () => {
            console.log("Import save (open dialog) button clicked - full implementation pending modal UI.");
            // Original logic:
            // $('#import_button').style.display = null;
            // $("#txtImportExport").value = "";
            // $("#Import_Export_dialog").showModal();
        });
    }

    if (DOM.import_button_confirm) { // The one inside the dialog
         DOM.import_button_confirm.addEventListener('click', () => {
            console.log("Import (confirm from dialog) button clicked - full implementation pending modal UI.");
            // if (DOM.import_export_text_area && typeof gameInstance.loads === 'function') {
            //    gameInstance.loads(DOM.import_export_text_area.value);
            // }
            // if(DOM.import_export_text_area) DOM.import_export_text_area.value = "";
        });
    }
    
    if (DOM.reset_game_button) {
        DOM.reset_game_button.addEventListener('click', () => {
            if (confirm("Confirm reset game? This will erase your save!")) {
                if (gameInstance.saveLoadManager && gameInstance.saveLoadManager.activeSaver && 
                    typeof gameInstance.saveLoadManager.activeSaver.save === 'function') {
                    // Save an empty string or a representation of a reset state
                    gameInstance.saveLoadManager.activeSaver.save(btoa(JSON.stringify({})), (err) => {
                        if (err) console.error("Error during reset save:", err);
                        document.location.reload();
                    }); 
                } else {
                     // Fallback or if no active saver, clear local storage as a last resort.
                    localStorage.removeItem('rks'); // Default key for LocalSaver
                    localStorage.removeItem('google_drive_save_active'); // Clear Google Drive flag
                    document.location.reload();
                }
            }
        });
    }

    if (DOM.import_export_close_button && DOM.import_export_dialog) {
        DOM.import_export_close_button.addEventListener('click', () => {
            if (typeof DOM.import_export_dialog.close === 'function') {
                DOM.import_export_dialog.close();
            } else {
                // Fallback for browsers not supporting <dialog> or if it's not a dialog
                // DOM.import_export_dialog.style.display = 'none';
            }
        });
    }

    // Delegated event for page navigation
    if (DOM.main) {
        DOM.main.addEventListener('click', (event) => {
            const navElement = event.target.closest('nav'); // Find the closest 'nav' parent
            if (navElement) {
                event.preventDefault();
                const pageId = navElement.dataset.page;
                const sectionId = navElement.dataset.section;
                if (pageId && sectionId && typeof uiManagerInstance.showPage === 'function') {
                    uiManagerInstance.showPage(sectionId, pageId);
                }
            }
        });
    }

    // More stats toggle
    if (DOM.more_stats_toggle_button && DOM.main) {
        DOM.more_stats_toggle_button.addEventListener('click', () => {
            DOM.main.classList.toggle('show_more_stats');
            // The original also called update_button('#more_stats_toggle')() to update text.
            // This will be handled by the ToggleButton system when it's refactored.
            if (uiManagerInstance.updateToggleButtonText) {
                uiManagerInstance.updateToggleButtonText('more_stats_toggle');
            }
        });
    }

    // Delegated event for spoilers
    if (DOM.help_section) {
        DOM.help_section.addEventListener('click', (event) => {
            const showSpoilerElement = event.target.closest('.show_spoiler');
            if (showSpoilerElement) {
                 const hasSpoilerParent = showSpoilerElement.closest('.has_spoiler');
                 if (hasSpoilerParent) {
                     hasSpoilerParent.classList.toggle('show');
                 }
            }
        });
    }
    console.log('Direct button listeners attached.');

    // Part selection from shop
    if (DOM.all_parts) {
        DOM.all_parts.addEventListener('click', (event) => {
            const partElement = event.target.closest('.part');
            if (partElement && partElement._part) { // _part is the Part instance
                const partInstance = partElement._part;
                
                // Logic from js/app.js for selecting/deselecting a part
                if (clicked_part && clicked_part === partInstance) {
                    setClickedPart(null); // Deselect
                    partElement.classList.remove('part_active');
                    if (DOM.main) DOM.main.classList.remove('part_active');
                    // The original also called _tooltip_hide(). The tooltipManager.hideTooltip() can be used.
                    // import { hideTooltip } from '../ui/tooltipManager.js'; // Would need this import
                    // hideTooltip(); 
                } else {
                    // The original called part_tooltip_show.apply(this, e);
                    // This implies the tooltip should be shown for the selected part.
                    // The tooltipManager.showTooltip can be called directly.
                    // import { showTooltip } from '../ui/tooltipManager.js'; // Would need this import
                    // showTooltip(partInstance, null, () => partInstance.updateTooltipContent(null));

                    if (clicked_part && clicked_part.$el) {
                        clicked_part.$el.classList.remove('part_active');
                    }
                    setClickedPart(partInstance);
                    partElement.classList.add('part_active');
                    if (DOM.main) DOM.main.classList.add('part_active');
                }
            }
        });
    } else {
        console.warn("DOM.all_parts not found, cannot attach part selection listener.");
    }
}
console.log('uiEventHandlers.js loaded with attachDirectButtonListeners');

export function createPartShopItem(part_obj) {
    if (!part_obj || !part_obj.part) { // part_obj is the Part instance, part_obj.part is the raw definition
        console.warn('createPartShopItem: Invalid part_obj received', part_obj);
        return;
    }

    // The Part instance itself should store its final className if needed, or we generate it.
    const className = `part_${part_obj.id}`; 
    
    part_obj.$el = document.createElement('button'); // Store $el on the Part instance
    // Initial classes, 'locked' might be dynamic later via affordability checks.
    // Affordability will be handled by the main UI update loop (update_interface)
    // which calls check_affordability -> part.setAffordable -> updates classList.
    part_obj.$el.className = `part unaffordable ${className}`; // Start as unaffordable, UI loop will correct
    part_obj.$el._part = part_obj; // CRITICAL: Link DOM element back to the Part instance

    const imageDiv = document.createElement('div');
    imageDiv.className = 'image';
    imageDiv.textContent = 'Click to Select'; // Placeholder
    part_obj.$el.appendChild(imageDiv);

    const category = part_obj.category;
    let container = null;
    switch (category) {
        case 'cell': container = DOM.cells_container; break;
        case 'reflector': container = DOM.reflectors_container; break;
        case 'capacitor': container = DOM.capacitors_container; break;
        case 'vent': container = DOM.vents_container; break;
        case 'heat_exchanger': container = DOM.heat_exchangers_container; break;
        case 'heat_inlet': container = DOM.heat_inlets_container; break;
        case 'heat_outlet': container = DOM.heat_outlets_container; break;
        case 'coolant_cell': container = DOM.coolant_cells_container; break;
        case 'reactor_plating': container = DOM.reactor_platings_container; break;
        case 'particle_accelerator': container = DOM.particle_accelerators_container; break;
        default:
            console.warn(`Unknown part category for UI shop item: ${category} for part ${part_obj.id}`);
            if (DOM.parts) container = DOM.parts; // Fallback container
            break;
    }

    if (container) {
        container.appendChild(part_obj.$el);
    } else {
        console.warn(`No UI container found for part category: ${category} (Part ID: ${part_obj.id})`);
    }
}

export function createUpgradeShopItem(upgrade_obj, gameInstance) {
    if (!upgrade_obj || !upgrade_obj.upgrade) {
        console.warn('createUpgradeShopItem: Invalid upgrade_obj received', upgrade_obj);
        return;
    }

    const upgradeData = upgrade_obj.upgrade; // Raw data from upgradeData.js

    upgrade_obj.$el = document.createElement('button');
    upgrade_obj.$el.className = 'upgrade'; // Base class
    upgrade_obj.$el.upgrade = upgrade_obj; // Link DOM element back to Upgrade instance

    // Add specific class from upgradeData if it exists (e.g. "protium", "cell_power")
    if (upgradeData.classList && Array.isArray(upgradeData.classList)) {
        upgradeData.classList.forEach(cls => upgrade_obj.$el.classList.add(cls));
    }
    if (upgrade_obj.level >= upgrade_obj.max_level) {
        upgrade_obj.$el.classList.add('maxed');
    }
    if (!upgrade_obj.affordable) { // Check initial affordability
        upgrade_obj.$el.classList.add('unaffordable');
    }


    // Create inner structure (title, level, cost) - simplified from original
    const titleEl = document.createElement('span');
    titleEl.className = 'title';
    titleEl.textContent = upgradeData.title || 'N/A';
    upgrade_obj.$el.appendChild(titleEl);

    const levelEl = document.createElement('span');
    levelEl.className = 'level';
    levelEl.textContent = `${upgrade_obj.level}/${upgrade_obj.max_level}`;
    upgrade_obj.$el.appendChild(levelEl);
    
    const costEl = document.createElement('span');
    costEl.className = 'cost';
    costEl.textContent = upgrade_obj.display_cost + (upgradeData.ecost ? ' EP' : ''); // display_cost is set by setLevel(0)
    upgrade_obj.$el.appendChild(costEl);


    // Determine container based on upgradeData.type
    let container = null;
    switch (upgradeData.type) {
        case 'cell_tick_upgrades': container = DOM.cell_tick_upgrades_container; break;
        case 'cell_power_upgrades': container = DOM.cell_power_upgrades_container; break;
        case 'cell_perpetual_upgrades': container = DOM.cell_perpetual_upgrades_container; break;
        case 'other': container = DOM.other_upgrades_container; break;
        case 'vents': container = DOM.vent_upgrades_container; break;
        case 'exchangers': container = DOM.exchanger_upgrades_container; break;
        case 'experimental_laboratory': container = DOM.experimental_laboratory_container; break;
        case 'experimental_boost': container = DOM.experimental_boost_container; break;
        case 'experimental_cells': container = DOM.experimental_cells_container; break;
        case 'experimental_cells_boost': container = DOM.experimental_cells_boost_container; break;
        case 'experimental_parts': container = DOM.experimental_parts_container; break;
        case 'experimental_particle_accelerators': container = DOM.experimental_particle_accelerators_container; break;
        default:
            console.warn(`Unknown upgrade type for UI container: ${upgradeData.type} for upgrade ${upgradeData.id}`);
            if (DOM.all_upgrades_container) container = DOM.all_upgrades_container; // Fallback
            break;
    }

    if (container) {
        container.appendChild(upgrade_obj.$el);
    } else {
        console.warn(`No UI container found for upgrade type: ${upgradeData.type} (Upgrade ID: ${upgradeData.id})`);
    }
}

export function handleUpgradeClick(event, gameInstance) {
    const buttonElement = event.target.closest('.upgrade');
    if (!buttonElement || !buttonElement.upgrade) return;

    const upgradeInstance = buttonElement.upgrade;

    // Original logic:
    // if ( upgrade.level >= upgrade.upgrade.levels ) { return; }
    // else if ( upgrade.ecost && (!upgrade.erequires || game.upgrade_objects[upgrade.erequires].level) && game.current_exotic_particles >= upgrade.ecost ) { ... }
    // else if ( upgrade.cost && game.current_money >= upgrade.cost ) { ... }
    // else { return; }
    // upgrade.setLevel(upgrade.level + 1);
    // if ( tooltip_showing ) { upgrade.updateTooltip(); }
    // update_tiles();
    // return true

    let purchased = false;
    do {
        if (upgradeInstance.purchase()) { // purchase() checks affordability and calls setLevel
            purchased = true;
        } else {
            break; // Stop if purchase failed (cannot afford or max level)
        }
    } while (event.shiftKey && purchased); // Continue if Shift key is held and purchase was successful

    if (purchased) {
        // Tooltip update is handled by the tooltip system if it's visible and has an update callback.
        // update_tiles() needs to be called if an upgrade affects game elements processed by it.
        // Many effects now call gameInstance.updateAllCellPowers() or similar, which should trigger necessary downstream updates.
        // A general gameInstance.ui.uiSay('evt', 'game_state_changed') or similar could trigger update_tiles.
        if (gameInstance.ui && typeof gameInstance.ui.uiSay === 'function') {
             gameInstance.ui.uiSay('evt', 'upgrade_purchased', { id: upgradeInstance.id, newLevel: upgradeInstance.level });
        }
        // Potentially call update_tiles(gameInstance) if the upgrade could have broad effects not covered by specific update calls.
        // This dependency needs to be managed. For now, assume specific effects handle their updates.
        // Example: if (gameInstance.update_tiles_needed_after_upgrade) update_tiles(gameInstance);
    }
}
