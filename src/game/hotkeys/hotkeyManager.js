// src/game/hotkeys/hotkeyManager.js

let skip = 1; // Module-level variable, formerly global 'skip'

// Helper for filtering tiles based on the part of a reference tile
const equal_filter = (referenceTile) => {
    const partToMatch = referenceTile.part;
    return function* (tileGenerator) {
        for (const tile of tileGenerator) {
            if (tile.part === partToMatch) {
                yield tile;
            }
        }
    };
};

class HotkeyManager {
    constructor() {
        this.gameInstance = null;
    }

    init(gameInstance) {
        this.gameInstance = gameInstance;
        this._setupEventListeners();
        console.log('HotkeyManager initialized.');
    }

    // --- Hotkey Action Functions (now methods) ---

    * replacer(partToMatch) {
        if (!this.gameInstance) return;
        for (let ri = 0; ri < this.gameInstance.rows; ri++) {
            const row = this.gameInstance.tiles[ri];
            for (let ci = 0; ci < this.gameInstance.cols; ci++) {
                const tile = row[ci];
                if (partToMatch === tile.part) {
                    yield tile;
                }
            }
        }
    }

    * remover(partToMatch, ticksThreshold) {
        if (!this.gameInstance) return;
        for (let ri = 0; ri < this.gameInstance.rows; ri++) {
            const row = this.gameInstance.tiles[ri];
            for (let ci = 0; ci < this.gameInstance.cols; ci++) {
                const tile = row[ci];
                // Original: if ( part === tile.part && ( !tile.part.part.base_ticks || ticks || !tile.ticks ) )
                // Assuming part.part.base_ticks implies it's a part that uses ticks.
                // ticksThreshold is the 'ticks' variable from original, representing current tile ticks for double click logic,
                // or undefined/null for shift+click logic (remove all).
                // So, if ticksThreshold is provided (double click), remove if current tile.ticks matches.
                // If not provided (shift+click), remove if !tile.part.part.base_ticks (not a ticking part) OR !tile.ticks (already spent).
                let shouldRemove = false;
                if (partToMatch === tile.part) {
                    if (ticksThreshold !== undefined) { // From double click logic
                         if (tile.ticks === ticksThreshold) shouldRemove = true;
                    } else { // From Shift+Click logic (remove all matching)
                        if (!tile.part?.part?.base_ticks || !tile.ticks) { // Check tile.part.part existence
                           shouldRemove = true;
                        }
                    }
                }
                if (shouldRemove) {
                    yield tile;
                }
            }
        }
    }

    * checker(referenceTile) {
        if (!this.gameInstance) return;
        let placement = !((referenceTile.row % 2) ^ (referenceTile.col % 2));
        for (let ri = 0; ri < this.gameInstance.rows; ri++) {
            let toggle = placement;
            const row = this.gameInstance.tiles[ri];
            for (let ci = 0; ci < this.gameInstance.cols; ci++) {
                if (toggle) {
                    yield row[ci];
                }
                toggle = !toggle;
            }
            placement = !placement;
        }
    }

    // --- Row & Column Iterators ---
    // _row and _column are now private helper methods or part of the public methods directly.
    
    _rowGenerator(tile, startOffset, step) {
        const game = this.gameInstance;
        return function*() {
            if (!game || !game.tiles[tile.row]) return;
            const row = game.tiles[tile.row];
            for (let ci = startOffset; ci < game.cols; ci += step) {
                if (row[ci]) yield row[ci];
            }
        }
    }

    row(tile) { // Full row, filtered by tile's part
        return equal_filter(tile)(this._rowGenerator(tile, tile.col % skip, skip)());
    }

    shift_row(tile) { // Full row, unfiltered
         return this._rowGenerator(tile, tile.col % skip, skip)();
    }
    
    _columnGenerator(tile, startOffset, step) {
        const game = this.gameInstance;
        return function*() {
            if (!game) return;
            for (let ri = startOffset; ri < game.rows; ri += step) {
                const row = game.tiles[ri];
                if (row && row[tile.col]) yield row[tile.col];
            }
        }
    }

    column(tile) { // Full column, filtered by tile's part
        return equal_filter(tile)(this._columnGenerator(tile, tile.row % skip, skip)());
    }

    shift_column(tile) { // Full column, unfiltered
        return this._columnGenerator(tile, tile.row % skip, skip)();
    }


    // --- Event Listeners for 'skip' variable ---
    _handleKeyDown(event) {
        const r = /Digit([2-9])/.exec(event.code);
        if (!event.repeat && r) {
            const key = r[1];
            // Original: if ( event.ctrlKey || event.altKey ) event.preventDefault();
            // Let's keep preventDefault if modifier is pressed, as it's likely for this specific hotkey feature
            if (event.ctrlKey || event.altKey || event.shiftKey) { // Consider shift as well for skip modification
                 // event.preventDefault(); // Be careful with global preventDefault
            }
            skip = parseInt(key, 10);
            // console.log(`Hotkey skip set to: ${skip}`);
        }
    }

    _handleKeyUp(event) {
        const r = /Digit([2-9])/.exec(event.code);
        if (!event.repeat && r) {
            const key = r[1];
            // if ( event.ctrlKey || event.altKey || event.shiftKey ) event.preventDefault();

            if (parseInt(key, 10) === skip) {
                // console.log(`Hotkey skip reset to 1 (was ${skip})`);
                skip = 1;
            }
        }
    }

    _setupEventListeners() {
        // Add listeners to window. Ensure they are bound to 'this' if they need 'this.gameInstance'
        // or make them static/module-level if they don't.
        // For 'skip', it's a module-level variable, so direct binding isn't strictly needed for these handlers.
        window.addEventListener("keydown", this._handleKeyDown.bind(this));
        window.addEventListener("keyup", this._handleKeyUp.bind(this));
        // console.log('Hotkey event listeners for skip value attached to window.');
    }

    // Method to get current skip value if needed by other modules (e.g. eventHandlers)
    getSkipValue() {
        return skip;
    }
}

const hotkeyManager = new HotkeyManager();
export default hotkeyManager;

console.log('hotkeyManager.js loaded');
