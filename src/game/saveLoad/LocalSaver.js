class LocalSaver {
    constructor(gameInstance) {
        this.gameInstance = gameInstance;
        this.name = 'LocalSaver'; // For identification
    }

    /**
     * Saves data to localStorage.
     * @param {string} data - The stringified game data to save.
     * @param {function} [callback] - Optional callback to execute after saving.
     */
    save(data, callback) {
        if (this.gameInstance && this.gameInstance.save_debug) {
            console.log('LocalSaver.save: Saving data to localStorage.');
        }
        try {
            window.localStorage.setItem('rks', data); // 'rks' is the key from original game
            if (callback) {
                callback(null); // null for no error
            }
        } catch (error) {
            console.error('LocalSaver.save: Error saving to localStorage.', error);
            if (callback) {
                callback(error);
            }
        }
    }

    /**
     * Enables LocalSaver as the active saver.
     * In the original, this also removed a 'google_drive_save' item from localStorage.
     * This logic might be better placed in the SaveLoadManager when switching savers.
     */
    enable() {
        if (this.gameInstance && this.gameInstance.save_debug) {
            console.log('LocalSaver.enable: LocalSaver is being enabled.');
        }
        // The original also did: localStorage.removeItem('google_drive_save');
        // This should be handled by the SaveLoadManager when it switches to LocalSaver.
        // The active_saver assignment is also handled by SaveLoadManager.
        return true; // Indicate success or readiness
    }

    /**
     * Loads data from localStorage.
     * @param {function} callback - Callback to execute with the loaded data (or null if not found).
     */
    load(callback) {
        if (this.gameInstance && this.gameInstance.save_debug) {
            console.log('LocalSaver.load: Loading data from localStorage.');
        }
        try {
            const rks = window.localStorage.getItem('rks');
            if (callback) {
                callback(null, rks); // null for no error, rks is the data
            }
        } catch (error) {
            console.error('LocalSaver.load: Error loading from localStorage.', error);
            if (callback) {
                callback(error, null);
            }
        }
    }
}

export default LocalSaver;

console.log('LocalSaver.js loaded');
