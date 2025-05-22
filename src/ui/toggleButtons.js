import * as DOM from './domElements.js';
// uiManager will be passed to the init function to access game and uiSay

const toggle_buttons_map = {}; // Stores the state and update functions for each button

/**
 * Creates a toggle button and sets up its event listener.
 * @param {string} buttonSelector - CSS selector for the button element.
 * @param {string} enable_text - Text to display when the feature is enabled (button action is to disable).
 * @param {string} disable_text - Text to display when the feature is disabled (button action is to enable).
 * @param {function} getState - Function that returns the current state (e.g., game.paused).
 * @param {function} enable_callback - Function to call when enabling the feature.
 * @param {function} disable_callback - Function to call when disabling the feature.
 * @param {boolean} always_update_text - Whether to update text immediately on click or rely on event.
 * @param {function} load_func - Custom function to handle loading saved state.
 * @param {object} uiManagerInstance - Instance of UIManager for accessing game and uiSay.
 */
const create_toggle_button = (
  buttonSelector,
  enable_text,
  disable_text,
  getState,
  enable_callback,
  disable_callback,
  always_update_text = false,
  load_func = null,
  uiManagerInstance // Pass uiManager here
) => {
  const buttonElement = document.querySelector(buttonSelector); // Use querySelector for flexibility
  if (!buttonElement) {
    console.warn(`Toggle button with selector ${buttonSelector} not found.`);
    return;
  }

  // Ensure enable_text and disable_text are provided, default if not.
  const currentEnableText = enable_text || 'Enable';
  const currentDisableText = disable_text || 'Disable';
  
  buttonElement.textContent = currentEnableText; // Initial text

  const update_text = () => {
    // getState() being true means the feature is "on", so button shows "disable" text.
    // getState() being false means feature is "off", so button shows "enable" text.
    buttonElement.textContent = getState() ? currentDisableText : currentEnableText;
  };
  
  toggle_buttons_map[buttonSelector] = {
    update_text,
    state: getState, // Store the getter for the state
    enable: enable_callback,
    disable: disable_callback,
    load_func,
  };

  buttonElement.addEventListener('click', (event) => {
    event.preventDefault();
    // If getState() is true (feature is on), call disable_callback (to turn it off).
    // If getState() is false (feature is off), call enable_callback (to turn it on).
    getState() ? disable_callback() : enable_callback();
    if (always_update_text) {
      update_text(); // Update text immediately if configured
    }
    // Otherwise, text update relies on the corresponding 'evt' from uiSay
  });

  update_text(); // Set initial button text
};

export function initializeToggleButtons(uiManagerInstance) {
  if (!uiManagerInstance || !uiManagerInstance.game) {
    console.error("UIManager instance or game instance is not available for initializing toggle buttons.");
    return;
  }
  const game = uiManagerInstance.game;

  // Pause/Unpause
  create_toggle_button(
    '#pause_toggle', 'Unpause', 'Pause', // Swapped texts: if game.paused is true, button should say "Unpause"
    () => game.paused,
    () => game.unpause(), // Called when game.paused is false (to unpause, i.e., start)
    () => game.pause(),   // Called when game.paused is true (to pause)
    false, null, uiManagerInstance
  );

  // Enable/Disable auto sell
  create_toggle_button(
    '#auto_sell_toggle', 'Enable Auto Sell', 'Disable Auto Sell', // If disabled is true, button shows "Enable"
    () => game.auto_sell_disabled,
    () => game.enable_auto_sell(),  // Called when auto_sell_disabled is true (to enable)
    () => game.disable_auto_sell(), // Called when auto_sell_disabled is false (to disable)
    false, null, uiManagerInstance
  );

  // Enable/Disable auto buy
  create_toggle_button(
    '#auto_buy_toggle', 'Enable Auto Buy', 'Disable Auto Buy',
    () => game.auto_buy_disabled,
    () => game.enable_auto_buy(),
    () => game.disable_auto_buy(),
    false, null, uiManagerInstance
  );

  // Enable/Disable heat control
  create_toggle_button(
    '#heat_control_toggle', 'Enable Heat Controller', 'Disable Heat Controller',
    () => game.heat_controlled, // True if controlled, so button shows "Disable"
    () => game.disable_heat_control(), // Called when heat_controlled is true (to disable)
    () => game.enable_heat_control(),  // Called when heat_controlled is false (to enable)
    false, null, uiManagerInstance
  );

  // Enable/Disable time flux
  create_toggle_button(
    '#time_flux_toggle', 'Enable Time Flux', 'Disable Time Flux',
    () => game.time_flux,
    () => game.disable_time_flux(),
    () => game.enable_time_flux(),
    false, null, uiManagerInstance
  );
  
  // Speed Hack (local UI state, not game state)
  let speed_hack_state = false;
  create_toggle_button(
    '#speed_hack', 'Enable Speed Hack', 'Disable Speed Hack',
    () => speed_hack_state,
    () => { // Enable callback (when speed_hack_state is false)
      speed_hack_state = true;
      if (DOM.main) DOM.main.classList.add('speed_hack');
      if (DOM.reactor) DOM.reactor.classList.add('speed_hack');
    },
    () => { // Disable callback (when speed_hack_state is true)
      speed_hack_state = false;
      if (DOM.main) DOM.main.classList.remove('speed_hack');
      if (DOM.reactor) DOM.reactor.classList.remove('speed_hack');
    },
    true, null, uiManagerInstance // always_update_text = true
  );

  // Offline Tick
  create_toggle_button(
    '#offline_tick', 'Enable Offline Tick', 'Disable Offline Tick',
    () => game.offline_tick,
    () => { game.offline_tick = false; }, // To disable offline_tick (when it's true)
    () => { game.offline_tick = true; },  // To enable offline_tick (when it's false)
    true, // always_update_text
    (savedState) => { game.offline_tick = savedState; }, // load_func
    uiManagerInstance
  );

  // More Stats Toggle (local UI state)
  let more_stats_state = DOM.main ? DOM.main.classList.contains('show_more_stats') : false;
  create_toggle_button(
    '#more_stats_toggle', '[+]', '[-]',
    () => more_stats_state,
    () => { // Enable callback (when more_stats_state is false, meaning not showing more stats)
        more_stats_state = true;
        if(DOM.main) DOM.main.classList.add('show_more_stats');
    },
    () => { // Disable callback (when more_stats_state is true, meaning showing more stats)
        more_stats_state = false;
        if(DOM.main) DOM.main.classList.remove('show_more_stats');
    },
    true, null, uiManagerInstance // always_update_text = true
  );
  // Initial text for more_stats_toggle might need to be set based on class presence
  if (toggle_buttons_map['#more_stats_toggle']) {
      toggle_buttons_map['#more_stats_toggle'].update_text();
  }

  console.log('Toggle buttons initialized.');
}

export function getToggleButtonsSaves() {
  const sbuttons = {};
  for (const buttonId in toggle_buttons_map) {
    if (Object.hasOwnProperty.call(toggle_buttons_map, buttonId)) {
      sbuttons[buttonId] = toggle_buttons_map[buttonId].state();
    }
  }
  return sbuttons;
}

export function loadToggleButtonsState(savedStates) {
  if (!savedStates) return;
  for (const buttonId in savedStates) {
    if (Object.hasOwnProperty.call(savedStates, buttonId) && toggle_buttons_map[buttonId]) {
      const buttonObj = toggle_buttons_map[buttonId];
      const savedValue = savedStates[buttonId];
      if (buttonObj.load_func) {
        buttonObj.load_func(savedValue);
      } else {
        // Default load behavior: if current state from getState() doesn't match savedValue, click the button.
        // This assumes clicking toggles to the desired state.
        // This might be tricky if enable/disable callbacks don't perfectly set the state for getState().
        // For example, if getState is game.paused, and savedState is true (meaning should be paused).
        // If game.paused is currently false, we call buttonObj.disable() (which is game.pause()).
        if (buttonObj.state() !== savedValue) {
            // If saved state is true (feature should be ON), but current state is false (feature is OFF) -> call the "ON" action.
            // The "ON" action is disable_callback if getState means "is feature active?" (e.g. game.paused)
            // or enable_callback if getState means "is feature disabled?" (e.g. game.auto_sell_disabled)
            // This logic is complex because of the varied meanings of getState()
            // A simpler way: just call the appropriate callback to match the saved state.
            if (savedValue) { // If saved state means "feature should be on/active/disabled depending on button type"
                // This part needs careful mapping of button logic to savedState meaning.
                // Example for pause: savedValue = true means "game should be paused".
                // If current game.paused is false, call game.pause() (which is buttonObj.disable)
                if (buttonObj.state() === false && buttonObj.disable) buttonObj.disable();
            } else { // If saved state means "feature should be off/inactive/enabled"
                // Example for pause: savedValue = false means "game should be unpaused".
                // If current game.paused is true, call game.unpause() (which is buttonObj.enable)
                 if (buttonObj.state() === true && buttonObj.enable) buttonObj.enable();
            }
        }
      }
      buttonObj.update_text(); // Update text after attempting to load state
    }
  }
}

// Called by uiSay('evt', 'eventName') to update button text if event matches a button
export function updateToggleButtonText(buttonSelector) {
    if (toggle_buttons_map[buttonSelector]) {
        toggle_buttons_map[buttonSelector].update_text();
    }
}

console.log('toggleButtons.js loaded');
