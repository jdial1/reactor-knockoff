// Global DOM element references, previously using $ shorthand

// Main and Reactor
export const main = document.getElementById('main');
export const reactor = document.getElementById('reactor');
export const reactor_background = document.getElementById('reactor_background');
export const reactor_section = document.getElementById('reactor_section');
export const parts = document.getElementById('parts'); // Parent for part categories
export const primary = document.getElementById('primary'); // Used for reactor size adjustment

// Header / Info displays
export const money = document.getElementById('money');
export const current_power = document.getElementById('current_power');
export const max_power = document.getElementById('max_power');
export const power_percentage = document.getElementById('power_percentage'); // The bar itself
export const current_heat = document.getElementById('current_heat');
export const max_heat = document.getElementById('max_heat');
export const heat_percentage = document.getElementById('heat_percentage'); // The bar itself
export const exotic_particles = document.getElementById('exotic_particles');
export const current_exotic_particles = document.getElementById('current_exotic_particles');
export const time_flux = document.getElementById('time_flux');


// Stats display elements
export const stats_power = document.getElementById('stats_power'); // total_power in var_objs
export const stats_heat = document.getElementById('stats_heat'); // total_heat in var_objs
export const stats_cash = document.getElementById('stats_cash');
export const stats_outlet = document.getElementById('stats_outlet');
export const stats_inlet = document.getElementById('stats_inlet');
export const stats_vent = document.getElementById('stats_vent');
// export const stats_heat is already defined above.

// Per tick displays
export const money_per_tick = document.getElementById('money_per_tick');
export const power_per_tick = document.getElementById('power_per_tick');
export const heat_per_tick = document.getElementById('heat_per_tick');

// Buttons and Toggles
export const refund_exotic_particles = document.getElementById('refund_exotic_particles');
export const reboot_exotic_particles = document.getElementById('reboot_exotic_particles');
export const manual_heat_reduce_display = document.getElementById('manual_heat_reduce'); // Text display for amount
export const auto_heat_reduce_display = document.getElementById('auto_heat_reduce'); // Text display for amount
export const reduce_heat_button = document.getElementById('reduce_heat'); // The button itself
export const pause_toggle_button = document.getElementById('pause_toggle');
export const auto_sell_toggle_button = document.getElementById('auto_sell_toggle');
export const auto_buy_toggle_button = document.getElementById('auto_buy_toggle');
export const heat_control_toggle_button = document.getElementById('heat_control_toggle');
export const time_flux_toggle_button = document.getElementById('time_flux_toggle');
export const speed_hack_button = document.getElementById('speed_hack'); // Assuming this is the ID
export const offline_tick_button = document.getElementById('offline_tick'); // Assuming this is the ID
export const sell_button = document.getElementById('sell');
export const trigger_save_button = document.getElementById('trigger_save');
export const download_save_button = document.getElementById('download_save');
export const export_save_button = document.getElementById('export_save');
export const import_save_button = document.getElementById('import_save'); // The one that opens dialog
export const import_button_confirm = document.getElementById('import_button'); // The one inside dialog
export const reset_game_button = document.getElementById('reset_game');
export const import_export_dialog = document.getElementById('Import_Export_dialog');
export const import_export_text_area = document.getElementById('txtImportExport');
export const import_export_close_button = document.getElementById('Import_Export_close_button');
export const more_stats_toggle_button = document.getElementById('more_stats_toggle');
export const reboot_button = document.getElementById('reboot');
export const refund_button = document.getElementById('refund');


// Part containers (for adding new parts)
export const cells_container = document.getElementById('cells');
export const reflectors_container = document.getElementById('reflectors');
export const capacitors_container = document.getElementById('capacitors');
export const vents_container = document.getElementById('vents');
export const heat_exchangers_container = document.getElementById('heat_exchangers');
export const heat_inlets_container = document.getElementById('heat_inlets');
export const heat_outlets_container = document.getElementById('heat_outlets');
export const coolant_cells_container = document.getElementById('coolant_cells');
export const reactor_platings_container = document.getElementById('reactor_platings');
export const particle_accelerators_container = document.getElementById('particle_accelerators');

// Tooltip elements from js/app.js (not app.ui.js, but good to centralize)
export const tooltip = document.getElementById('tooltip');
export const tooltip_name = document.getElementById('tooltip_name');
export const tooltip_description = document.getElementById('tooltip_description');
export const tooltip_cost = document.getElementById('tooltip_cost');
export const tooltip_sells_wrapper = document.getElementById('tooltip_sells_wrapper');
export const tooltip_sells = document.getElementById('tooltip_sells');
export const tooltip_heat_per = document.getElementById('tooltip_heat_per');
export const tooltip_power_per = document.getElementById('tooltip_power_per');
export const tooltip_heat_per_wrapper = document.getElementById('tooltip_heat_per_wrapper');
export const tooltip_power_per_wrapper = document.getElementById('tooltip_power_per_wrapper');
export const tooltip_heat_wrapper = document.getElementById('tooltip_heat_wrapper');
export const tooltip_heat = document.getElementById('tooltip_heat'); // Heat contained in part
export const tooltip_max_heat = document.getElementById('tooltip_max_heat'); // Max heat part can contain
export const tooltip_ticks_wrapper = document.getElementById('tooltip_ticks_wrapper');
export const tooltip_ticks = document.getElementById('tooltip_ticks');
export const tooltip_max_ticks = document.getElementById('tooltip_max_ticks');
export const tooltip_chance_wrapper = document.getElementById('tooltip_chance_wrapper');
export const tooltip_chance = document.getElementById('tooltip_chance');
export const tooltip_chance_percent_of_total = document.getElementById('tooltip_chance_percent_of_total');

// Upgrade container from js/app.js
export const all_upgrades_container = document.getElementById('all_upgrades');

// Objectives section from js/app.ui.js
export const objectives_section = document.getElementById('objectives_section');
export const objective_title = document.getElementById('objective_title');
export const objective_reward = document.getElementById('objective_reward');

// Help section for spoilers
export const help_section = document.getElementById('help_section');

// All parts container from js/app.js (used for delegate)
export const all_parts = document.getElementById('all_parts');

// Patch notes page (referred by _show_page)
export const patch_section = document.getElementById('patch_section'); // Assuming this is the ID for "reactor_upgrades" section's page
export const upgrades_section_page = document.getElementById('upgrades_section'); // Main upgrades page
export const experimental_upgrades_section_page = document.getElementById('experimental_upgrades_section'); // Experimental upgrades page

// Generic elements used by _show_page
// Note: _show_page dynamically gets sections and pages. These are examples if specific top-level sections are known.
// This might require a different approach for _show_page refactoring.
// export const reactor_upgrades_section = document.getElementById('reactor_upgrades'); // Example section
// export const some_other_section = document.getElementById('some_other_section'); // Example section

// Save/Load specific buttons
export const enable_local_save_button = document.getElementById('enable_local_save');
export const enable_google_drive_save_button = document.getElementById('enable_google_drive_save');

// Upgrade Page Containers (from original upgrade_locations)
export const cell_tick_upgrades_container = document.getElementById('cell_tick_upgrades');
export const cell_power_upgrades_container = document.getElementById('cell_power_upgrades');
export const cell_perpetual_upgrades_container = document.getElementById('cell_perpetual_upgrades');
export const other_upgrades_container = document.getElementById('other_upgrades');
export const vent_upgrades_container = document.getElementById('vent_upgrades');
export const exchanger_upgrades_container = document.getElementById('exchanger_upgrades');
export const experimental_laboratory_container = document.getElementById('experimental_laboratory');
export const experimental_boost_container = document.getElementById('experimental_boost');
export const experimental_cells_container = document.getElementById('experimental_cells');
export const experimental_cells_boost_container = document.getElementById('experimental_cell_boost'); // Note: original key was experimental_cell_boost
export const experimental_parts_container = document.getElementById('experimental_parts');
export const experimental_particle_accelerators_container = document.getElementById('experimental_particle_accelerators');


// Utility function to replace original $
export function $(selector) {
  if (selector.startsWith('<') && selector.endsWith('>')) {
    return document.createElement(selector.slice(1, -1));
  }
  return document.getElementById(selector.substring(1)); // Assuming # for IDs
}
// Note: The original $ was more versatile. This is a simplified version.
// Query selector might be needed for more complex selections if they exist.
// For now, sticking to getElementById as it was the primary use.
// The delegate function from app.globals.js will need separate handling.

console.log('domElements.js loaded');
