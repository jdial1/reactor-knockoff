import { getRawObjectiveData } from './objectiveData.js';
import Objective from './Objective.js';

let gameInstance = null; // Stored game instance
let all_objectives_instances = []; // Array of Objective instances
let current_objective_index = 0;
let objective_unloading = false; // Used by UI events
let active_objective_instance = null;
let objective_timeout = null;

const OBJECTIVE_INTERVAL = 2000; // ms, original objective_interval
const OBJECTIVE_WAIT_NEW = 3000; // ms, original objective_wait

function _log(message, ...args) {
    if (gameInstance && gameInstance.debug) { // Assuming gameInstance has a debug flag
        console.log(`ObjectiveManager: ${message}`, ...args);
    }
}

/**
 * Checks the current objective and advances if completed.
 */
function checkObjectives() {
    if (!gameInstance || !active_objective_instance) {
        _log("checkObjectives: Called without gameInstance or active_objective_instance.");
        return;
    }

    if (gameInstance.paused) {
        _log("checkObjectives: Game is paused, skipping check.");
        clearTimeout(objective_timeout);
        objective_timeout = setTimeout(checkObjectives, OBJECTIVE_INTERVAL);
        return;
    }
    
    if (active_objective_instance.check()) {
        _log(`Objective "${active_objective_instance.title}" completed.`);
        current_objective_index++;

        if (active_objective_instance.reward) {
            gameInstance.current_money += active_objective_instance.reward;
            if (gameInstance.ui && gameInstance.ui.uiSay) {
                gameInstance.ui.uiSay('var', 'current_money', gameInstance.current_money);
            }
        } else if (active_objective_instance.ep_reward) {
            gameInstance.exotic_particles += active_objective_instance.ep_reward;
            if (gameInstance.ui && gameInstance.ui.uiSay) {
                gameInstance.ui.uiSay('var', 'exotic_particles', gameInstance.exotic_particles);
            }
        }
        setObjective(current_objective_index, false); // Pass false for skipWait
    } else {
        clearTimeout(objective_timeout);
        objective_timeout = setTimeout(checkObjectives, OBJECTIVE_INTERVAL);
    }
}

/**
 * Sets the current objective.
 * @param {number} objectiveIndex - The index of the objective to set.
 * @param {boolean} [skipWait=false] - Whether to skip the initial wait period.
 */
export function setObjective(objectiveIndex, skipWait = false) {
    if (!gameInstance) {
        _log("setObjective: gameInstance not initialized.");
        return;
    }
    
    current_objective_index = objectiveIndex; // Update current index

    const wait = skipWait ? 0 : OBJECTIVE_WAIT_NEW;
    active_objective_instance = null; // Clear previous active objective

    if (all_objectives_instances[current_objective_index]) {
        objective_unloading = true;
        if (gameInstance.ui && gameInstance.ui.uiSay) {
            gameInstance.ui.uiSay('evt', 'objective_unloaded');
        }
        _log(`Unloaded previous objective. Setting new objective in ${wait}ms.`);

        clearTimeout(objective_timeout);
        objective_timeout = setTimeout(() => {
            active_objective_instance = all_objectives_instances[current_objective_index];
            objective_unloading = false;
            _log(`Objective loaded: "${active_objective_instance.title}"`);
            if (gameInstance.ui && gameInstance.ui.uiSay) {
                gameInstance.ui.uiSay('evt', 'objective_loaded', active_objective_instance);
            }
            if (typeof active_objective_instance.start === 'function') {
                active_objective_instance.start();
            }
            clearTimeout(objective_timeout); // Clear again before setting the check loop
            objective_timeout = setTimeout(checkObjectives, OBJECTIVE_INTERVAL);
        }, wait);
    } else {
        _log(`No objective found at index: ${current_objective_index}. Max objectives reached or error.`);
        // Optionally handle "all objectives complete" scenario
        active_objective_instance = { title: "All objectives completed!", check: () => false }; // Dummy final objective
         if (gameInstance.ui && gameInstance.ui.uiSay) {
            gameInstance.ui.uiSay('evt', 'objective_loaded', active_objective_instance);
        }
    }
}

/**
 * Initializes the objectives system.
 * @param {object} instance - The main game instance.
 * @param {number} [startIndex=0] - Optional starting objective index (e.g., from a save).
 */
export function initializeObjectives(instance, startIndex = 0) {
    gameInstance = instance;
    _log("Initializing objectives...");

    const rawObjectives = getRawObjectiveData(gameInstance);
    all_objectives_instances = rawObjectives.map(data => new Objective(data, gameInstance));
    _log(`${all_objectives_instances.length} objectives processed.`);
    
    current_objective_index = startIndex; // Set to loaded or default
    // Game.loads() will call setObjective directly with the loaded index.
    // If not loading, this call sets the first objective.
    // This ensures setObjective is called once after all initializations.
    // If loading a save, game.loads will call setObjective again with the correct index.
    if (startIndex === 0) { // Only set the first objective if not loading a specific index later
       setObjective(current_objective_index, true); // true to skipWait for the very first objective
    }
}

/**
 * Gets the current objective index.
 * @returns {number}
 */
export function getCurrentObjectiveIndex() {
    return current_objective_index;
}

console.log('objectiveManager.js loaded');
