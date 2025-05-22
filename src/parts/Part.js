// import { fmt } from '../utils/formatters.js'; // Placeholder
// import game from '../game/gameState.js'; // Avoid direct import if possible, pass gameInstance
import { setupPartTooltipContent, updatePartTooltipContent, getPartDescription } from './partTooltipLogic.js';

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

// Moved from global scope in js/app.js
const single_cell_description_template = 'Produces %power power and %heat heat per tick. Lasts for %ticks ticks.';
const multi_cell_description_template = 'Acts as %count %type cells. Produces %power power and %heat heat per tick.';


class Part {
  constructor(partData, gameInstance) { // partData is an item from rawPartData
    this.part = partData; // Store the raw definition
    this.gameInstance = gameInstance; // Store reference to game instance for later use

    this.id = partData.id;
    this.category = partData.category;
    this.heat = partData.heat; // This might be calculated/base_heat in createPart
    this.power = partData.power; // This might be calculated/base_power in createPart
    
    // These are often calculated in createPart based on level, store them on the instance
    this.base_heat = partData.base_heat;
    this.base_power = partData.base_power;
    this.heat_multiplier = partData.base_heat_multiplier; // Note: original used part.base_heat_multiplier
    this.power_multiplier = partData.base_power_multiplier; // Note: original used part.base_power_multiplier
    this.power_increase = partData.base_power_increase;
    this.heat_increase = partData.base_heat_increase;
    this.ticks = partData.base_ticks;
    this.containment = partData.base_containment;
    this.vent = partData.base_vent;
    this.reactor_power = partData.base_reactor_power;
    this.reactor_heat = partData.base_reactor_heat;
    this.transfer = partData.base_transfer;
    this.range = partData.base_range;
    this.ep_heat = partData.base_ep_heat;
    
    this.erequires = partData.erequires || null;
    this.cost = partData.base_cost; // May be modified by createPart based on level
    this.perpetual = partData.perpetual || false; // Ensure default
    
    this.cell_count = partData.cell_count || 0;
    this.cell_multiplier = partData.cell_multiplier || 0;
    this.pulse_multiplier = partData.pulse_multiplier || 0;
    this.pulses = partData.pulses || (partData.cell_count * partData.pulse_multiplier); // Calculated in createPart

    // Properties for UI state, similar to addProperty from original
    this._affordable = false;
    this.affordableUpdated = true; // Flag to indicate UI needs update

    // Description is dynamically generated
    this.description = ''; // Will be set by updateDescription

    // UI element reference
    this.$el = null; // Will be set by UI rendering logic
  }

  get affordable() {
    return this._affordable;
  }

  setAffordable(value) { // Renamed from set affordable from original addProperty
    const changed = this._affordable !== value;
    this._affordable = value;
    if (changed) {
      this.affordableUpdated = true;
      // In original, addProperty also called ui.updateProperty(name, value);
      // This could be: if (this.gameInstance && this.gameInstance.ui) this.gameInstance.ui.uiSay('var', `part_${this.id}_affordable`, value);
      // However, direct UI update for this is usually handled by iterating parts in the main UI loop.
    }
  }
  
  // This method is called by createPart, after level-specific adjustments are made
  updateDynamicProperties(calculatedProps) {
    // Update properties that were calculated in createPart based on level
    this.id = calculatedProps.id || this.id; // ID can change with level for some parts
    this.title = calculatedProps.title || this.part.title; // Title can change with level
    this.cost = calculatedProps.cost || this.cost;
    this.ticks = calculatedProps.ticks || this.ticks;
    this.containment = calculatedProps.containment || this.containment;
    this.reactor_power = calculatedProps.reactor_power || this.reactor_power;
    this.reactor_heat = calculatedProps.reactor_heat || this.reactor_heat;
    this.transfer = calculatedProps.transfer || this.transfer;
    this.vent = calculatedProps.vent || this.vent;
    this.ep_heat = calculatedProps.ep_heat || this.ep_heat;
    this.power_increase = calculatedProps.power_increase || this.power_increase;
    // For cells:
    this.power = calculatedProps.power || this.power;
    this.heat = calculatedProps.heat || this.heat;
    this.cell_count = calculatedProps.cell_count || this.cell_count;
    this.cell_multiplier = calculatedProps.cell_multiplier || this.cell_multiplier;
    this.pulses = calculatedProps.pulses || this.pulses;
    this.base_description = calculatedProps.base_description || this.part.base_description;

    this.updateDescription(); // Update description after all properties are set
  }


  updateDescription(tileInstance = null) {
    // Uses getPartDescription from partTooltipLogic.js
    // gameInstance is needed for %type resolution and potentially global multipliers
    this.description = getPartDescription(this, tileInstance, this.gameInstance);
    return this.description;
  }

  /**
   * This method will be called by tooltipManager.showTooltip
   * It's responsible for calling the appropriate functions from partTooltipLogic.js
   * to populate the tooltip DOM elements.
   * @param {object} tileInstance - The tile instance if the part is on a tile.
   * @param {object} domElementsMap - A map of DOM elements for the tooltip, passed by tooltipManager.
   */
  showTooltipContent(tileInstance, domElementsMap) {
    // domElementsMap is not used here because partTooltipLogic directly imports DOM elements.
    // This is a slight deviation but simpler for now. If domElementsMap was used,
    // setupPartTooltipContent would take it as an argument.
    setupPartTooltipContent(this, tileInstance, this.gameInstance);
  }

  /**
   * This method will be called by tooltipManager.updateTooltipContentIfVisible
   * (or directly if needed after an action that changes part state while tooltip is open).
   * @param {object} tileInstance - The tile instance if the part is on a tile.
   */
  updateTooltipContent(tileInstance) {
    updatePartTooltipContent(this, tileInstance, this.gameInstance);
  }
}

export default Part;

console.log('Part.js loaded');
