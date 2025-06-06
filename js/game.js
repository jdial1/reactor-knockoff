import { addProperty } from './util.js';
import { Tileset } from './tileset.js';
import { PartSet } from './partset.js';
import { UpgradeSet } from './upgradeset.js';
import { Reactor } from './reactor.js';

export class Game {
    constructor(ui_instance) {
        this.ui = ui_instance;
        this.version = '1.3.2';

        this.base_cols = 12;
        this.base_rows = 12;

        this.max_cols = 35;
        this.max_rows = 32;

        this._rows = this.base_rows;
        this._cols = this.base_cols;

        this.debug = false;
        this.offline_tick = true;
        this.base_loop_wait = 1000;
        this.base_power_multiplier = 1;
        this.base_heat_multiplier = 4;
        this.base_manual_heat_reduce = 1;
        this.upgrade_max_level = 32;

        this.base_money = 10;

        this.current_money = 0;
        this.protium_particles = 0;
        this.total_exotic_particles = 0;
        this.exotic_particles = 0;
        this.current_exotic_particles = 0;

        this.tileset    = new Tileset();
        this.partset    = new PartSet();
        this.upgradeset = new UpgradeSet();
        this.reactor    = new Reactor();

        this.loop_wait = this.base_loop_wait;
        this.paused = false;
        this.auto_sell_disabled = false;
        this.auto_buy_disabled = false;
        this.time_flux = true;

        this.upgrade_objects_array = [];
        this.upgrade_objects = {};

    }

    set_defaults() {
        this.current_money = this.base_money;
        this.rows = this.base_rows;
        this.cols = this.base_cols;
        this.protium_particles = 0;
        this.exotic_particles = 0;
        this.current_exotic_particles = 0;
        this.total_exotic_particles = 0;

        this.partset.check_affordability(this.game);
        this.upgradeset.check_affordability(this.game);
        this.upgradeset.reset();
        this.tileset.clearAllTiles();
        this.reactor.setDefaults();

        this.reactor.updateStats(this.tileset,this.ui.eventHandlers);
        this.ui.eventHandlers.game_reset();
    }

    initialize_new_game_state() {
        this.ui.eventHandlers.setVar('current_money', this.current_money);
        this.ui.eventHandlers.setVar('current_power', this.reactor.current_power);
        this.ui.eventHandlers.setVar('current_heat', this.reactor.current_heat);
        this.ui.eventHandlers.setVar('max_power', this.reactor.max_power);
        this.ui.eventHandlers.setVar('max_heat', this.reactor.max_heat);
        this.ui.eventHandlers.setVar('exotic_particles', this.exotic_particles);
        this.ui.eventHandlers.setVar('current_exotic_particles', this.current_exotic_particles);
        console.log('Init New Game Update Tiles')
        this.tileset.updateActiveTiles();
        this.reactor.updateStats(this.tileset,this.ui.eventHandlers);
    }

    update_cell_power() {
        if(!this.partset || !this.reactor) return;
        this.partset.updateCellPower(this);
        this.reactor.updateStats(this.tileset,this.ui.eventHandlers);
    }




    epart_onclick(purchased_upgrade) {
        if (!purchased_upgrade || !purchased_upgrade.upgrade || purchased_upgrade.level <= 0) return;
        console.log(`${purchased_upgrade.upgrade.title} purchased. Updating EP costs for other experimental parts.`);
        this.upgrade_objects_array.forEach(upg => {
            if (upg.upgrade.type === 'experimental_parts' && upg.upgrade.id !== purchased_upgrade.upgrade.id) {
                upg.updateDisplayCost();
                if (this.ui && typeof this.ui.check_upgrades_affordability === 'function') {
                    this.ui.check_upgrades_affordability();
                }
            }
        });
    }

    manual_reduce_heat_action() {
        this.reactor.manualReduceHeat();
    }

    sell_action() {
        this.reactor.sellPower();
    }

    reboot_action(refund_ep = false) {
        if (refund_ep) {
            this.current_exotic_particles = this.total_exotic_particles;
            this.upgrade_objects_array.forEach(upg => {
                if (upg.upgrade.ecost) upg.setLevel(this,0);
            });
        }
        this.total_exotic_particles += this.exotic_particles;
        this.current_exotic_particles = this.total_exotic_particles;
        this.exotic_particles = 0;
        this.set_defaults();
        this.initialize_new_game_state();
        if (this.objectives_manager) this.objectives_manager.set_objective(0, true);
        this.ui.eventHandlers.setVar('current_exotic_particles', this.current_exotic_particles);
        this.ui.eventHandlers.setVar('exotic_particles', this.exotic_particles);
        console.log(`Game rebooted. Refund EP: ${refund_ep}`);
    }
}

Game.prototype.addProperty = addProperty; 
