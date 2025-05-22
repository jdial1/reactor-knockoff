import LocalSaver from './LocalSaver.js';
import GoogleSaver from './GoogleSaver.js';
// apply_to_tile and other game-specific logic will be called via gameInstance.loads()

class SaveLoadManager {
    constructor() {
        this.gameInstance = null;
        this.localSaver = null;
        this.googleSaver = null;
        this.activeSaver = null;
        this.saveTimeout = null;
        this.isGoogleApiReady = false; // Track if Google API has successfully loaded and authed
    }

    init(gameInstance) {
        this.gameInstance = gameInstance;
        this._log('SaveLoadManager initialized.');

        this.localSaver = new LocalSaver(this.gameInstance);
        
        // Initialize GoogleSaver, but don't assume it's immediately ready.
        // GoogleSaver will attempt to load its API.
        this.googleSaver = new GoogleSaver(this.gameInstance);

        // Attempt to set the active saver based on previous session or default
        this._initializeActiveSaver();

        // Start auto-save loop if applicable
        this._startAutoSaveLoop();
    }

    _log(message, ...args) {
        if (this.gameInstance && this.gameInstance.save_debug) {
            console.log(`SaveLoadManager: ${message}`, ...args);
        }
    }

    _initializeActiveSaver() {
        // Check if Google Save was active and successful previously
        const googleSaveActive = localStorage.getItem('google_drive_save_active') === '1';
        
        if (googleSaveActive && this.googleSaver) {
            this._log('Attempting to enable GoogleSaver based on previous session.');
            // The `enable` method of GoogleSaver now handles its own async setup.
            // It will try to auth and if successful, it can become the active saver.
            // We need a way for GoogleSaver to report its readiness.
            // For now, we'll optimistically try to set it. UI should reflect actual state.
            this.setActiveSaver('google', false); // false for isUserInitiated, it's an auto-attempt
        } else {
            this._log('Defaulting to LocalSaver.');
            this.setActiveSaver('local');
        }
    }
    
    // Method for GoogleSaver to call back when it's ready (or failed)
    // This would be passed to GoogleSaver or an event system would be used.
    // For now, GoogleSaver directly updates localStorage, which _initializeActiveSaver checks.
    // A more robust system might involve promises or event emitters from the savers.

    setActiveSaver(saverType, isUserInitiated = true) {
        this._log(`Attempting to set active saver to: ${saverType}`);
        let previouslyActiveSaver = this.activeSaver;

        if (saverType === 'google' && this.googleSaver) {
            // The enable method is asynchronous and handles GAPI loading and auth.
            // It should ideally return a promise or use a callback to signal success/failure.
            this.googleSaver.enable((error) => {
                if (error) {
                    this._log(`Failed to enable GoogleSaver: ${error.message}. Reverting to previous or local saver.`);
                    // If there was a previously active saver and it wasn't google, revert. Otherwise, local.
                    if (previouslyActiveSaver && previouslyActiveSaver !== this.googleSaver) {
                        this.activeSaver = previouslyActiveSaver;
                    } else {
                        this.activeSaver = this.localSaver;
                        localStorage.removeItem('google_drive_save_active'); // Ensure this is cleared
                    }
                    this._log(`Active saver is now: ${this.activeSaver.name}`);
                    if (this.gameInstance.ui && this.gameInstance.ui.uiSay) {
                        this.gameInstance.ui.uiSay('evt', 'saver_changed', { name: this.activeSaver.name, error: error.message });
                    }
                } else {
                    this._log('GoogleSaver enabled successfully.');
                    this.activeSaver = this.googleSaver;
                    localStorage.setItem('google_drive_save_active', '1');
                    if (this.gameInstance.ui && this.gameInstance.ui.uiSay) {
                        this.gameInstance.ui.uiSay('evt', 'saver_changed', { name: this.activeSaver.name });
                    }
                    // If a load was pending or if user initiated Google Drive and save was found:
                    if (isUserInitiated && this.gameInstance.ui && typeof this.gameInstance.ui.handleGoogleSaveFound === 'function') {
                         // This part is tricky. The original GoogleSaver.enable had a callback
                         // that could trigger a confirm dialog and page reload.
                         // This logic needs to be in the UI layer, triggered by an event.
                         this.gameInstance.ui.handleGoogleSaveFound();
                    }
                }
            }, isUserInitiated);
            // Temporarily set to googleSaver, but it's not truly active until its enable callback succeeds.
            // UI should reflect this intermediate state or wait for confirmation.
            // For now, we assume the UI will update based on 'saver_changed' event.
            this.activeSaver = this.googleSaver; // Optimistic, might be reverted in callback
            
        } else if (saverType === 'local' && this.localSaver) {
            this.localSaver.enable(); // This is synchronous
            this.activeSaver = this.localSaver;
            localStorage.removeItem('google_drive_save_active');
            this._log(`Active saver set to: ${this.activeSaver.name}`);
            if (this.gameInstance.ui && this.gameInstance.ui.uiSay) {
                 this.gameInstance.ui.uiSay('evt', 'saver_changed', { name: this.activeSaver.name });
            }
        } else {
            this._log(`Unknown saver type or saver not initialized: ${saverType}`);
            return false;
        }
        return true;
    }

    saveGame(isAutoSave = false) {
        if (!this.activeSaver) {
            this._log('No active saver to save game.');
            return;
        }
        if (!this.gameInstance || typeof this.gameInstance.saves !== 'function') {
            this._log('Game instance or gameInstance.saves method is not available.');
            return;
        }

        const saveData = this.gameInstance.saves();
        this._log(`Saving game with ${this.activeSaver.name}...`);

        this.activeSaver.save(saveData, (error) => {
            if (error) {
                this._log(`Error saving game with ${this.activeSaver.name}:`, error);
                // Potentially try to fallback to local save if cloud save fails?
            } else {
                this._log(`Game saved successfully with ${this.activeSaver.name}.`);
                if (!isAutoSave && this.gameInstance.ui && typeof this.gameInstance.ui.showNotification === 'function') {
                    // this.gameInstance.ui.showNotification("Game Saved!"); // Example
                }
            }
            // Restart auto-save timer regardless of success/failure of this particular save,
            // unless the error is critical and indicates the saver is unusable.
            this._resetAutoSaveTimer();
        });
    }

    loadGame() {
        if (!this.activeSaver) {
            this._log('No active saver to load game from.');
            // Attempt to initialize default saver if none is active
            if (!this.activeSaver) this._initializeActiveSaver(); 
            // If still no active saver, then truly can't load
            if (!this.activeSaver) {
                 console.error("SaveLoadManager: Critical - No active saver available for loading.");
                 return;
            }
        }
        if (!this.gameInstance || typeof this.gameInstance.loads !== 'function') {
            this._log('Game instance or gameInstance.loads method is not available.');
            return;
        }
        
        this._log(`Loading game with ${this.activeSaver.name}...`);
        this.activeSaver.load((error, saveData) => {
            if (error) {
                this._log(`Error loading game with ${this.activeSaver.name}:`, error);
                // If cloud load fails, should it attempt to load from local as a backup?
                // For now, just report error.
                if (this.gameInstance.ui && typeof this.gameInstance.ui.showNotification === 'function') {
                    // this.gameInstance.ui.showNotification(`Error loading game: ${error.message}`);
                }
            } else if (saveData) {
                this._log('Save data loaded, applying to game state...');
                this.gameInstance.loads(saveData); // This should trigger relevant UI updates via its own logic
                this._log('Game state loaded.');
                 if (this.gameInstance.ui && this.gameInstance.ui.uiSay) {
                    this.gameInstance.ui.uiSay('evt', 'game_loaded_successfully');
                }
            } else {
                this._log('No save data found to load.');
                // This is not an error, just means new game or empty save.
                // Game should already be in its default state from constructor or resetToDefaults.
                // gameInstance.loads(null) should handle this gracefully.
                this.gameInstance.loads(null);
            }
        });
    }

    _startAutoSaveLoop() {
        if (this.gameInstance && this.gameInstance.save_interval > 0) {
            this._log(`Starting auto-save loop with interval: ${this.gameInstance.save_interval}ms`);
            this._resetAutoSaveTimer();
        }
    }

    _resetAutoSaveTimer() {
        clearTimeout(this.saveTimeout);
        if (this.gameInstance && this.gameInstance.save_interval > 0 && !this.gameInstance.debug) { // No auto-save in debug
            this.saveTimeout = setTimeout(() => {
                this._log('Auto-saving game...');
                this.saveGame(true); // true for isAutoSave
            }, this.gameInstance.save_interval);
        }
    }

    // Call this method if save_interval changes in game options
    updateAutoSaveInterval() {
        this._log('Auto-save interval updated. Resetting timer.');
        this._resetAutoSaveTimer();
    }
}

const saveLoadManager = new SaveLoadManager();
export default saveLoadManager;

console.log('SaveLoadManager.js loaded');
