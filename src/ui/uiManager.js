import { update_interface, syncUiVarsWithGame, uiSay as baseUiSay, registerUiEventHandler, setCheckUpgradesAffordability } from './uiUpdater.js';
import * as DOM from './domElements.js'; // May be needed for event handlers later
import { coreEventHandlers, attachDirectButtonListeners, createPartShopItem, createUpgradeShopItem, handleUpgradeClick } from './eventHandlers.js'; // Added upgrade handlers
import { initializeToggleButtons, getToggleButtonsSaves, loadToggleButtonsState, updateToggleButtonText as baseUpdateToggleButtonText } from './toggleButtons.js';

class UIManager {
  constructor() {
    this.game = null;
    this.isInitialized = false;
    // console.log('UIManager constructor called');
  }

  // Expose uiSay for game modules to call
  uiSay(type, name, val) {
    // This directly calls the imported baseUiSay from uiUpdater.js
    baseUiSay(type, name, val);
  }

  init(gameInstance) {
    if (this.isInitialized) {
      // console.log('UIManager already initialized.');
      return;
    }
    // console.log('UIManager init called with gameInstance:', gameInstance);
    this.game = gameInstance;

    // Sync current game state to UI vars
    syncUiVarsWithGame();

    // Original UI class called Object.keys(toggle_buttons).forEach((f)=>update_button(f)())
    // This part is complex and depends on toggle_buttons and update_button logic,
    // which are not yet refactored. Commenting out for now.
    // console.log('Toggle button initialization skipped for now.');

    // Start the main UI update loop
    // The original used setTimeout directly. We'll start it via update_interface itself.
    update_interface(this.game); // Pass game instance
    // console.log('Initial UI update loop started via update_interface.');

    this.isInitialized = true;
    // console.log('UIManager initialized.');

    // Setup basic event handlers that were in app.ui.js evts
    this.setupInitialEventHandlers();
    // Attach direct listeners for buttons etc.
    attachDirectButtonListeners(this); // Pass the uiManager instance
    // Initialize toggle buttons
    initializeToggleButtons(this); // Pass the uiManager instance
  }

  // Expose toggle button save/load functionality
  getToggleButtonsSaves() {
    return getToggleButtonsSaves();
  }

  loadToggleButtonsState(savedStates) {
    loadToggleButtonsState(savedStates);
  }
  
  // Expose for event handlers that need to update button text (e.g. after pause/unpause evt)
  updateToggleButtonText(buttonSelector) {
    baseUpdateToggleButtonText(buttonSelector);
  }

  // A place to add future methods for managing UI components, event listeners, etc.

  // --- Event Handling Logic (moved from app.ui.js evts and adapted) ---
  // This section will grow as more UI interaction is refactored.

  setupInitialEventHandlers() {
    // Register all handlers from coreEventHandlers
    for (const eventName in coreEventHandlers) {
      if (Object.hasOwnProperty.call(coreEventHandlers, eventName)) {
        registerUiEventHandler(eventName, coreEventHandlers[eventName]);
      }
    }
    // console.log('Core event handlers registered.');

    registerUiEventHandler('saver_changed', (data) => {
        this.updateSaverButtonDisplay(data.name, data.error);
    });
  }

  updateSaverButtonDisplay(activeSaverName, error = null) {
    if (DOM.enable_local_save_button && DOM.enable_google_drive_save_button) {
        if (activeSaverName === 'LocalSaver') {
            DOM.enable_local_save_button.style.display = 'none';
            DOM.enable_google_drive_save_button.style.display = '';
        } else if (activeSaverName === 'GoogleSaver') {
            DOM.enable_local_save_button.style.display = '';
            DOM.enable_google_drive_save_button.style.display = 'none';
        } else { // Default or error case
            DOM.enable_local_save_button.style.display = '';
            DOM.enable_google_drive_save_button.style.display = '';
        }
    }
    if (error) {
        // Optionally display the error to the user
        console.error(`Error with saver: ${error}`);
        // alert(`Save system error: ${error}`); // Or a more subtle notification
    }
  }
  
  setupPartsUI() {
    if (!this.game || !this.game.part_objects_array) {
      console.error("setupPartsUI: Game instance or part_objects_array not available.");
      return;
    }
    // Clear existing parts in UI containers to prevent duplication on reset
    // This assumes part containers are direct children of DOM.all_parts or specific category containers
    const containers = [
        DOM.cells_container, DOM.reflectors_container, DOM.capacitors_container,
        DOM.vents_container, DOM.heat_exchangers_container, DOM.heat_inlets_container,
        DOM.heat_outlets_container, DOM.coolant_cells_container, DOM.reactor_platings_container,
        DOM.particle_accelerators_container,
    ];
    containers.forEach(container => {
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
    });


    // Import createPartShopItem at the top of the file.
    // The circular dependency (uiManager -> eventHandlers -> game -> uiManager)
    // should be handled by ES module loading behavior (live bindings).
    // If this causes runtime issues, a more advanced pattern like passing functions
    // or using an event emitter might be needed, but for now, direct import is cleaner.
    // For this to work, ensure createPartShopItem is exported from eventHandlers.js
    // and imported at the top of uiManager.js
    
    // The import will be: import { createPartShopItem } from './eventHandlers.js';
    // This was added to the list of imports already in a previous step, but ensure it's correct.
    // For the purpose of this diff, assume createPartShopItem is available in scope.

    for (const part_obj of this.game.part_objects_array) {
      // Ensure createPartShopItem is correctly imported and available
      if (typeof createPartShopItem === 'function') { // Check if it's defined
        createPartShopItem(part_obj);
      } else {
        console.error('createPartShopItem is not defined. Check imports in uiManager.js');
      }
    }
    // console.log('Parts UI setup complete.');
  }

  setupUpgradesUI() {
    if (!this.game || !this.game.upgrade_objects_array) {
      console.error("setupUpgradesUI: Game instance or upgrade_objects_array not available.");
      return;
    }

    // Clear existing upgrade elements from all known containers
    const containers = [
        DOM.cell_tick_upgrades_container, DOM.cell_power_upgrades_container,
        DOM.cell_perpetual_upgrades_container, DOM.other_upgrades_container,
        DOM.vent_upgrades_container, DOM.exchanger_upgrades_container,
        DOM.experimental_laboratory_container, DOM.experimental_boost_container,
        DOM.experimental_cells_container, DOM.experimental_cells_boost_container,
        DOM.experimental_parts_container, DOM.experimental_particle_accelerators_container,
        DOM.all_upgrades_container // Fallback if type is unknown and it goes there
    ];
    containers.forEach(container => {
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
    });

    for (const upgrade_obj of this.game.upgrade_objects_array) {
      createUpgradeShopItem(upgrade_obj, this.game); // Pass gameInstance
    }
    // console.log('Upgrades UI setup complete.');

    // Attach delegated event listener for upgrade clicks
    if (DOM.all_upgrades_container) {
        // Remove existing listener to prevent duplicates if setupUpgradesUI is called multiple times
        // This requires storing the handler if it's not anonymous or using a more robust system.
        // For simplicity, if this is only called once at init, it's fine.
        // If called on reset, DOM elements are cleared, so old listeners on children are gone.
        // But the listener on all_upgrades_container would persist.
        // A simple way is to ensure this listener is only attached once.
        if (!DOM.all_upgrades_container.hasClickListener) {
             DOM.all_upgrades_container.addEventListener('click', (event) => handleUpgradeClick(event, this.game));
             DOM.all_upgrades_container.hasClickListener = true; // Mark as listener attached
        }
    } else {
        console.warn("DOM.all_upgrades_container not found, cannot attach upgrade click listener.");
    }
  }

  // showPage logic (was previously part of setupInitialEventHandlers, now a standalone method)
  showPage(sectionId, pageId) {
    // console.log(`Showing page: ${pageId} in section: ${sectionId}`);
    const sectionElement = document.getElementById(sectionId);
    const pageElement = document.getElementById(pageId);

    if (sectionElement && pageElement) {
        const pages = sectionElement.getElementsByClassName('page');
        for (let i = 0; i < pages.length; i++) {
            pages[i].classList.remove('showing');
        }
        pageElement.classList.add('showing');

        if (pageId === 'upgrades_section' || pageId === 'experimental_upgrades_section') {
            setCheckUpgradesAffordability(true);
        } else {
            setCheckUpgradesAffordability(false);
        }
    }
  }
}

const uiManager = new UIManager();
export default uiManager;

// fmt is now imported at the top from numberFormatting.js
// No longer need this placeholder.
// function fmt(value, places = null) {
//     if (typeof value !== 'number') return value;
//     if (places !== null) return value.toFixed(places);
//     return value.toLocaleString(); // Basic formatting
// }
console.log('uiManager.js loaded');
