// Constants
const CLIENT_ID = '572695445092-svr182bgaass7vt97r5mnnk4phmmjh5u.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/drive.appfolder'];
const GAPI_SCRIPT_SRC = 'https://apis.google.com/js/client.js'; // Will append ?onload=googleApiLoaded
const SAVE_FILENAME = 'reactor_knockoff_save.txt'; // Consistent filename

let google_api_script_loaded = false;
let google_auth_initialized = false; // To track if gapi.auth.authorize has been called

class GoogleSaver {
    constructor(gameInstance) {
        this.gameInstance = gameInstance;
        this.name = 'GoogleSaver';
        this.file_id = null;
        this.file_meta = null; // Stores metadata of the save file
        this.tried_load_before_auth = false;
        this.pending_load_callback = null;
        this.pending_enable_callback = null;
        this.access_token = null;
        this.authChecked = false; // Similar to original
        this.gapiLoadFailed = false;

        // Make the global callback unique to this instance or manage it if multiple instances could exist
        // For a single-page app, one instance is typical.
        if (!window.googleApiLoadedGlobal) {
            window.googleApiLoadedGlobal = this._handleGoogleApiLoaded.bind(this);
        }
        this._loadGapiScript();
    }

    _log(message, ...args) {
        if (this.gameInstance && this.gameInstance.save_debug) {
            console.log(`GoogleSaver: ${message}`, ...args);
        }
    }

    _loadGapiScript() {
        if (google_api_script_loaded || document.querySelector(`script[src^="${GAPI_SCRIPT_SRC}"]`)) {
            this._log('GAPI script already loaded or load initiated.');
            if(google_api_script_loaded && !google_auth_initialized && this.pending_enable_callback){
                 this._log('GAPI script was loaded, proceeding with pending auth.');
                 this.checkAuth(null, true); // Try immediate auth if script is there but we missed onload
            }
            return;
        }
        this._log('Loading GAPI script...');
        const el = document.createElement('script');
        el.setAttribute('type', 'text/javascript');
        el.setAttribute('src', `${GAPI_SCRIPT_SRC}?onload=googleApiLoadedGlobal`);
        el.onerror = () => {
            this._log('GAPI script failed to load.');
            this.gapiLoadFailed = true;
            // Inform UI or SaveLoadManager to disable Google Save option
            if (this.gameInstance.ui && this.gameInstance.ui.uiSay) {
                this.gameInstance.ui.uiSay('evt', 'google_save_unavailable', { error: 'GAPI script load failed' });
            }
        };
        document.getElementsByTagName('head')[0].appendChild(el);
    }

    _handleGoogleApiLoaded() {
        this._log('Google API script loaded via callback.');
        google_api_script_loaded = true;
        if (this.pending_enable_callback || !google_auth_initialized) {
            this._log('Auth was pending or not initialized, calling checkAuth.');
            // false for immediate: if user interaction (like button click) is expected to trigger this path,
            // we want the popup. If it's a background load, true might be appropriate.
            // The original logic used 'event ? false : true' for immediate.
            // Let's assume if enable was called, it might have been from a button.
            this.checkAuth(null, !this.pending_enable_callback_is_user_initiated); 
        }
    }

    enable(callback, isUserInitiated = true) {
        this._log(`Enable called. google_api_script_loaded: ${google_api_script_loaded}, authChecked: ${this.authChecked}, file_id: ${this.file_id}`);
        this.pending_enable_callback = callback;
        this.pending_enable_callback_is_user_initiated = isUserInitiated;

        if (this.gapiLoadFailed) {
            this._log("Cannot enable, GAPI script failed to load.");
            if (callback) callback(new Error("Google API script failed to load."));
            return false;
        }

        if (google_api_script_loaded && this.authChecked && this.file_id) {
            this._log('Already enabled and ready.');
            if (callback) callback(null); // null for no error
            return true;
        }
        
        if (google_api_script_loaded) {
            this._log('GAPI script loaded, but not fully authed/ready. Initiating checkAuth.');
            this.checkAuth(null, !isUserInitiated); // if user initiated, allow popup
        } else {
            this._log('GAPI script not loaded yet. Load was initiated.');
            // _handleGoogleApiLoaded will call checkAuth when script loads.
        }
        return true; // Indicates process started
    }

    checkAuth(callback, immediate = false) {
        this._log(`checkAuth called. Immediate: ${immediate}`);
        if (!google_api_script_loaded) {
            this._log("GAPI not loaded, cannot check auth yet.");
            // Storing the desire to check auth to be picked up by _handleGoogleApiLoaded
            google_auth_initialized = false; // Ensure it gets called
            this.pending_enable_callback_is_user_initiated = !immediate; // if immediate is false, it means user might be involved
            return;
        }
        google_auth_initialized = true;

        gapi.auth.authorize(
            { client_id: CLIENT_ID, scope: SCOPES, immediate: immediate },
            (authResult) => {
                this._log('gapi.auth.authorize CB', authResult);
                if (authResult && !authResult.error) {
                    this.authChecked = true;
                    this.access_token = authResult.access_token;
                    localStorage.setItem('google_drive_save_active', '1'); // Indicate Google Save is active
                    
                    if (callback) { // Usually for token refresh
                        callback();
                    } else {
                        gapi.client.load('drive', 'v2', () => {
                            this._log('GAPI drive client loaded.');
                            this._getOrCreateFile();
                        });
                    }
                } else {
                    this.authChecked = false;
                    localStorage.removeItem('google_drive_save_active');
                    if (!immediate) { // Failed even with user interaction
                        this._log('Auth failed. Switching to local saves is implied by SaveLoadManager.');
                        if (this.gameInstance.ui && this.gameInstance.ui.uiSay) {
                             this.gameInstance.ui.uiSay('evt', 'google_auth_failed');
                        }
                        if(this.pending_enable_callback) this.pending_enable_callback(new Error("Google Auth failed"));
                        this.pending_enable_callback = null;
                    } else {
                        // Auth failed in immediate mode, try non-immediate (allow popup)
                        this._log('Immediate auth failed, trying non-immediate.');
                        this.checkAuth(callback, false);
                    }
                }
            }
        );
    }

    _getOrCreateFile() {
        this._log('Getting or creating save file...');
        const listFiles = (callback) => {
            const retrievePage = (request, result) => {
                request.execute((resp) => {
                    result = result.concat(resp.items || []);
                    const nextPageToken = resp.nextPageToken;
                    if (nextPageToken) {
                        request = gapi.client.drive.files.list({ pageToken: nextPageToken, q: "'appfolder' in parents" });
                        retrievePage(request, result);
                    } else {
                        callback(result);
                    }
                });
            };
            const initialRequest = gapi.client.drive.files.list({ q: "'appfolder' in parents" });
            retrievePage(initialRequest, []);
        };

        listFiles((files) => {
            this._log('Files in appfolder:', files);
            const existingFile = files.find(f => f.title === SAVE_FILENAME);
            if (existingFile) {
                this.file_id = existingFile.id;
                this.file_meta = existingFile;
                this._log(`Found existing save file. ID: ${this.file_id}`);
                if (this.pending_load_callback) {
                    this.load(this.pending_load_callback);
                } else if (this.pending_enable_callback) {
                    this.pending_enable_callback(null); // Success
                    this.pending_enable_callback = null;
                }
            } else {
                this._log('No save file found, creating new one.');
                this._createNewSaveFile(() => {
                     if (this.pending_enable_callback) {
                        this.pending_enable_callback(null); // Success
                        this.pending_enable_callback = null;
                    }
                    // If load was pending, it means there was no file to load, so callback with null data
                    if(this.pending_load_callback) {
                        this.pending_load_callback(null, null); // No error, no data
                        this.pending_load_callback = null;
                    }
                });
            }
        });
    }

    _createNewSaveFile(callback) {
        this._log('Creating new save file...');
        const boundary = '-------314159265358979323846264';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;
        const contentType = 'text/plain';
        const metadata = { title: SAVE_FILENAME, mimeType: contentType, parents: [{ id: 'appfolder' }] };
        // Create an empty file initially
        const base64Data = btoa('{}'); // Save an empty JSON object
        const multipartRequestBody =
            `${delimiter}Content-Type: application/json\r\n\r\n${JSON.stringify(metadata)}` +
            `${delimiter}Content-Type: ${contentType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64Data}${close_delim}`;
        
        const request = gapi.client.request({
            path: '/upload/drive/v2/files', method: 'POST', params: { uploadType: 'multipart' },
            headers: { 'Content-Type': `multipart/mixed; boundary="${boundary}"` },
            body: multipartRequestBody,
        });
        request.execute((file) => {
            if (file && file.id) {
                this._log(`New file created. ID: ${file.id}`, file);
                this.file_id = file.id;
                this.file_meta = file; // Store new file metadata
                if (callback) callback(null);
            } else {
                this._log('Error creating new file:', file);
                 if (callback) callback(new Error("Failed to create new Google Drive file."));
            }
        });
    }

    save(data, callback) {
        this._log(`Save called. File ID: ${this.file_id}`);
        if (!this.file_id || !this.authChecked) {
            this._log('Cannot save: Not authenticated or no file ID.');
            if (callback) callback(new Error('Google Drive: Not authenticated or no file ID.'));
            return;
        }

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;
        const contentType = 'text/plain';
        const base64Data = btoa(data);
        const multipartRequestBody =
            `${delimiter}Content-Type: application/json\r\n\r\n${JSON.stringify({ mimeType: contentType })}` + // Only update mimeType if needed, or send minimal metadata
            `${delimiter}Content-Type: ${contentType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64Data}${close_delim}`;

        const request = gapi.client.request({
            path: `/upload/drive/v2/files/${this.file_id}`, method: 'PUT',
            params: { uploadType: 'multipart', alt: 'json' },
            headers: { 'Content-Type': `multipart/mixed; boundary="${boundary}"` },
            body: multipartRequestBody,
        });
        request.execute((response) => {
            this._log('Save request response:', response);
            if (!response || response.error) {
                this._log('Error saving file:', response.error);
                if (response.error && response.error.code === 401) { // Unauthorized
                    this.authChecked = false;
                    this.checkAuth(() => this.save(data, callback), true); // Re-auth and retry
                } else {
                    if (callback) callback(response.error || new Error("Unknown error during save."));
                }
            } else {
                this.file_meta = response; // Update file metadata
                if (callback) callback(null);
            }
        });
    }

    load(callback) {
        this._log(`Load called. File ID: ${this.file_id}, File Meta: ${!!this.file_meta}`);
        if (!this.authChecked) {
            this._log('Cannot load: Not authenticated.');
            this.pending_load_callback = callback; // Store to load after auth
            this.enable(() => { /* Load will be retried if pending_load_callback is set */ }, true);
            return;
        }
        if (!this.file_id || !this.file_meta) {
            this._log('Cannot load: File ID or metadata missing. Will try to get/create file first.');
            this.pending_load_callback = callback;
            this._getOrCreateFile(); // This will eventually call load again if file found or created
            return;
        }

        if (this.file_meta && this.file_meta.downloadUrl) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.file_meta.downloadUrl);
            xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    this._log('File downloaded successfully.');
                    callback(null, xhr.responseText);
                } else {
                    this._log(`Error downloading file: ${xhr.status}`, xhr.responseText);
                    callback(new Error(`Download failed with status ${xhr.status}`), null);
                }
            };
            xhr.onerror = () => {
                this._log('XHR error during download.');
                callback(new Error('Network error during file download.'), null);
            };
            xhr.send();
        } else {
            this._log('No download URL available for the file.');
            callback(new Error('No download URL for Google Drive file.'), null);
        }
        this.pending_load_callback = null; // Clear after attempt
    }
    
    // deleteFile method might be needed for a full "reset" or if user explicitly wants to remove cloud save.
    // For now, it's not directly part of the save/load flow for typical game operation.
    // _deleteFile(fileId, callback) { ... }
}

export default GoogleSaver;

console.log('GoogleSaver.js loaded');
