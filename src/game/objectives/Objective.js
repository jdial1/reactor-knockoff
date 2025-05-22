class Objective {
    /**
     * Creates an instance of an Objective.
     * @param {object} objectiveDataItem - The raw data for this objective.
     * @param {object} gameInstance - The main game instance.
     */
    constructor(objectiveDataItem, gameInstance) {
        this.title = objectiveDataItem.title || 'Untitled Objective';
        this.reward = objectiveDataItem.reward || 0;
        this.ep_reward = objectiveDataItem.ep_reward || 0;
        this.gameInstance = gameInstance; // Keep a reference to the game instance

        // The original check function expects 'game' to be in its scope.
        // We will adapt how it's called in ObjectiveManager.
        // The check function itself is defined in objectiveData.js.
        this._rawCheckFunction = objectiveDataItem.check;

        // Handle 'start' function if it exists
        if (typeof objectiveDataItem.start === 'function') {
            this._rawStartFunction = objectiveDataItem.start;
        }

        // Other potential properties from objectiveDataItem can be stored if needed
        // For example, if objectives had IDs or specific types:
        // this.id = objectiveDataItem.id;
        // this.type = objectiveDataItem.type;
    }

    /**
     * Checks if the objective's conditions are met.
     * This method calls the raw check function, passing the gameInstance.
     * @returns {boolean} True if the objective is completed, false otherwise.
     */
    check() {
        if (typeof this._rawCheckFunction === 'function') {
            // The check functions in objectiveData.js expect 'game' (which is gameInstance).
            return this._rawCheckFunction(this.gameInstance);
        }
        console.warn(`Objective "${this.title}" has no valid check function.`);
        return false;
    }

    /**
     * Executes the start function for this objective, if it exists.
     * The start function might set up initial conditions or UI elements specific to this objective.
     */
    start() {
        if (typeof this._rawStartFunction === 'function') {
            // The start functions also expect 'game' (gameInstance).
            this._rawStartFunction(this.gameInstance);
        }
    }
}

export default Objective;

console.log('Objective.js loaded');
