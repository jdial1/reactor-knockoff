import game from './game/gameState.js';
import { update_tiles } from './game/tileManager.js';
import { startGameLoop } from './game/gameLoop.js'; // Import startGameLoop

// Initialize game state and tiles
game.resetToDefaults(); // This calls initializeTiles internally
console.log('Game object initialized and tiles created through resetToDefaults:');
console.log(JSON.parse(JSON.stringify(game))); // Deep copy for logging

// Perform initial tile update
update_tiles(game);
console.log('Initial tile update performed.');
console.log(JSON.parse(JSON.stringify(game)));

// Start the game loop
startGameLoop(); // No need to pass game, it's imported in gameLoop.js
console.log('Game loop started.');

// Example test of game actions:
console.log("Testing game actions...");
game.current_power = 100; // Set some power to sell
console.log('Set current_power to 100. Current money:', game.current_money, 'Current power:', game.current_power);
game.sell_power();
console.log('After selling power. Current money:', game.current_money, 'Current power:', game.current_power);

game.current_heat = 50; // Set some heat to reduce
console.log('Set current_heat to 50. Current heat:', game.current_heat);
game.manual_reduce_heat();
console.log('After manual heat reduction. Current heat:', game.current_heat);

// Example of pausing and unpausing
game.pause();
console.log('Game paused state:', game.paused);
// The actual loop stopping/starting will be fully implemented later when gameLoop.js is linked to these methods.
// For now, we're just checking the state change.
game.unpause();
console.log('Game unpaused state:', game.paused);

console.log('Final game state after tests:');
console.log(JSON.parse(JSON.stringify(game)));
