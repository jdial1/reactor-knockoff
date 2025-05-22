// import { fmt } from '../utils/formatters.js'; // Placeholder
import { setupUpgradeTooltipContent, updateUpgradeTooltipContent } from './upgradeTooltipLogic.js';
// upgradeEffects.js will be imported by upgradeManager.js to associate effects.

// Placeholder for fmt until it's properly set up in utils
function fmt(value, places = null) {
    if (typeof value !== 'number' && typeof value !== 'string') return String(value);
    if (typeof value === 'string') {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        value = num;
    }
    if (places !== null) return value.toFixed(places);
    return value.toLocaleString();
}

class Upgrade {
  constructor(upgradeData, gameInstance) {
    this.upgrade = upgradeData; // Raw upgrade definition
    this.gameInstance = gameInstance;
    this.id = upgradeData.id; // For convenience

    this.max_level = upgradeData.levels || gameInstance.upgrade_max_level || 1; // Default to 1 if not specified
    this.level = 0;
    
    this.cost = upgradeData.cost || 0; // Initial base cost
    this.ecost = upgradeData.ecost || 0; // Initial base EP cost
    
    this.display_cost = ''; // Will be set by setLevel

    this.erequires = upgradeData.erequires || null; // Experimental requirement

    // UI state for affordability
    this._affordable = false; // Start as not affordable
    this.affordableUpdated = true; // Flag for UI to update

    // This will be assigned by upgradeManager.createUpgrade
    this.applyEffect = null; 
    this.removeEffect = null; // For future use if upgrades can be reverted/ respecced

    // $el will be created by the UI rendering logic (e.g., createUpgradeShopItem)
    // and assigned to this instance.
    this.$el = null; 
  }

  get affordable() {
    return this._affordable;
  }

  setAffordable(value) {
    const changed = this._affordable !== value;
    this._affordable = value;
    if (changed) {
      this.affordableUpdated = true;
      // Optional: could emit an event if specific UI updates are needed beyond polling
      // if (this.gameInstance.ui && this.gameInstance.ui.uiSay) {
      //   this.gameInstance.ui.uiSay('var', `upgrade_${this.id}_affordable`, value);
      // }
    }
  }

  canAfford() {
    if (this.level >= this.max_level) return false;
    if (this.erequires && (!this.gameInstance.upgrade_objects[this.erequires] || !this.gameInstance.upgrade_objects[this.erequires].level)) {
        return false; // Requirement not met
    }
    if (this.ecost) { // EP cost
        return this.gameInstance.current_exotic_particles >= this.ecost;
    }
    return this.gameInstance.current_money >= this.cost; // Money cost
  }

  purchase() {
    if (!this.canAfford()) return false;

    if (this.ecost) {
        this.gameInstance.current_exotic_particles -= this.ecost;
        if (this.gameInstance.ui && this.gameInstance.ui.uiSay) {
             this.gameInstance.ui.uiSay('var', 'current_exotic_particles', this.gameInstance.current_exotic_particles);
        }
    } else {
        this.gameInstance.current_money -= this.cost;
         if (this.gameInstance.ui && this.gameInstance.ui.uiSay) {
            this.gameInstance.ui.uiSay('var', 'current_money', this.gameInstance.current_money);
        }
    }
    this.setLevel(this.level + 1);
    return true;
  }

  setLevel(level) {
    this.level = Math.min(level, this.max_level); // Ensure level doesn't exceed max

    // Recalculate cost based on the new level
    // Original logic from js/app.upgrade.js: this.cost = Math.ceil(this.upgrade.cost * Math.pow(this.upgrade.cost_multiplier || 1, this.level));
    // This implies `this.cost` is the cost for the *next* level.
    if (this.level < this.max_level) { // Cost for the next level
        if (this.upgrade.ecost) { // If base cost is EP
            this.ecost = Math.ceil((this.upgrade.ecost || 0) * Math.pow(this.upgrade.cost_multiplier || 1, this.level));
            this.display_cost = fmt(this.ecost); // No EP suffix here, handled in tooltip
        } else {
            this.cost = Math.ceil((this.upgrade.cost || 0) * Math.pow(this.upgrade.cost_multiplier || 1, this.level));
            this.display_cost = fmt(this.cost);
        }
    } else { // Max level reached
        this.cost = Infinity; // Effectively unaffordable
        this.ecost = Infinity;
        this.display_cost = 'MAX';
    }


    // Apply the effect of the upgrade
    if (typeof this.applyEffect === 'function') {
      this.applyEffect(this, this.gameInstance);
    }
    
    // Update UI related to this upgrade (e.g. its own display)
    if (this.$el) {
        const levelDisplay = this.$el.querySelector('.level'); // Assuming a .level element
        if (levelDisplay) levelDisplay.textContent = this.level;
        
        const costDisplay = this.$el.querySelector('.cost'); // Assuming a .cost element
        if (costDisplay) costDisplay.textContent = this.display_cost + (this.upgrade.ecost ? ' EP' : '');

        if (this.level >= this.max_level) {
            this.$el.classList.add('maxed');
            this.$el.classList.remove('unaffordable'); // Maxed implies affordable in a sense
        } else {
            this.$el.classList.remove('maxed');
        }
    }
    
    // Specific logic from original game.epart_onclick, now handled by updateExperimentalPartCosts in manager
    if (this.upgrade.type === 'experimental_parts' && this.gameInstance && typeof this.gameInstance.updateExperimentalPartCosts === 'function') {
        this.gameInstance.updateExperimentalPartCosts();
    }

    // Specific logic for cell_tick_upgrade etc. from original Upgrade.setLevel
    // This is now handled by the effect functions.
    // Example: if (this.upgrade.id === 'cell_tick_upgrade') game.update_cell_power();

    // After setting level, check affordability of all upgrades, as some might have changed.
    if (this.gameInstance && typeof this.gameInstance.checkAllUpgradesAffordability === 'function') {
        this.gameInstance.checkAllUpgradesAffordability();
    }
    
    // Notify that cell power might need recalculation if this upgrade affects it
    // This is better handled by specific effect functions calling gameInstance.updateAllCellPowers()
    // if (this.upgrade.id.includes('cell_power') || this.upgrade.id.includes('infused_cells') || this.upgrade.id.includes('unleashed_cells')) {
    //    if (this.gameInstance && typeof this.gameInstance.updateAllCellPowers === 'function') {
    //        this.gameInstance.updateAllCellPowers();
    //    }
    // }
  }

  showTooltipContent(domElementsMap) {
    // domElementsMap is not used here as upgradeTooltipLogic directly imports DOM elements.
    setupUpgradeTooltipContent(this, this.gameInstance);
  }

  updateTooltipContent() {
    // Called when the tooltip is already visible and needs its content refreshed.
    updateUpgradeTooltipContent(this, this.gameInstance);
  }
}

export default Upgrade;

console.log('Upgrade.js loaded');
