import { describe, it, expect, beforeEach, vi } from "vitest";
import { Game } from "../../js/game.js";
import { UI } from "../../js/ui.js";
import { setupGame } from "../helpers/setup.js";

vi.mock("../../js/ui.js", () => {
  const mockState = new Map();
  const mockGetVar = vi.fn((key) => {
    if (["auto_buy", "auto_sell", "heat_control", "pause"].includes(key)) {
      return mockState.get(key) ?? false;
    }
    if (key === "time_flux") {
      return mockState.get(key) ?? true;
    }
    return mockState.get(key);
  });
  const mockSetVar = vi.fn((key, value) => {
    mockState.set(key, value);
  });

  const UI = vi.fn();
  UI.prototype.init = vi.fn(() => true);
  UI.prototype.resizeReactor = vi.fn();
  UI.prototype.stateManager = {
    handleTileAdded: vi.fn(),
    handlePartAdded: vi.fn(),
    handleUpgradeAdded: vi.fn(),
    getVar: mockGetVar,
    setVar: mockSetVar,
    setGame: vi.fn(),
    game_reset: vi.fn(),
  };

  return { UI };
});

describe("Core Game Mechanics", () => {
  let game;

  beforeEach(async () => {
    game = await setupGame();
  });

  it("should enter meltdown when heat exceeds 2x max_heat", async () => {
    expect(game.reactor.has_melted_down).toBe(false);
    game.reactor.current_heat = game.reactor.max_heat * 2 + 1;
    game.engine.tick();
    expect(game.reactor.has_melted_down).toBe(true);
    expect(game.ui.stateManager.setVar).toHaveBeenCalledWith(
      "melting_down",
      true,
      true
    );
  });

  it("should reset the game on reboot and add to total exotic particles", async () => {
    await game.tileset
      .getTile(0, 0)
      .setPart(game.partset.getPartById("uranium1"));
    game.exotic_particles = 50;
    game.total_exotic_particles = 10;
    game.current_money = 12345;
    game.reboot_action(true);
    expect(game.current_money).toBe(game.base_money);
    expect(game.tileset.getTile(0, 0).part).toBeNull();
    expect(game.exotic_particles).toBe(0);
    expect(game.total_exotic_particles).toBe(60);
    expect(game.current_exotic_particles).toBe(60);
  });

  it("should reset and not keep any exotic particles on full refund reboot", async () => {
    game.exotic_particles = 50;
    game.total_exotic_particles = 10;
    game.reboot_action(false);
    expect(game.exotic_particles).toBe(0);
    expect(game.total_exotic_particles).toBe(0);
    expect(game.current_exotic_particles).toBe(0);
  });

  it("should set default values correctly on set_defaults()", () => {
    game.current_money = 9999;
    game.rows = 20;
    game.cols = 20;
    game.exotic_particles = 100;
    game.set_defaults();
    expect(game.current_money).toBe(game.base_money);
    expect(game.rows).toBe(game.base_rows);
    expect(game.cols).toBe(game.base_cols);
    expect(game.exotic_particles).toBe(0);
    expect(game.reactor.current_heat).toBe(0);
    expect(game.reactor.current_power).toBe(0);
  });

  it("should toggle pause state and engine", () => {
    const stopSpy = vi.spyOn(game.engine, "stop");
    const startSpy = vi.spyOn(game.engine, "start");
    game.ui.stateManager.getVar.mockReturnValue(true);
    game.onToggleStateChange("pause", true);
    expect(game.paused).toBe(true);
    expect(stopSpy).toHaveBeenCalled();
    game.ui.stateManager.getVar.mockReturnValue(false);
    game.onToggleStateChange("pause", false);
    expect(game.paused).toBe(false);
    expect(startSpy).toHaveBeenCalled();
  });

  it("should add money correctly", () => {
    const initialMoney = game.current_money;
    game.addMoney(1000);
    expect(game.current_money).toBe(initialMoney + 1000);
    expect(game.ui.stateManager.setVar).toHaveBeenCalledWith(
      "current_money",
      game.current_money
    );
  });

  describe("Reboot Actions", () => {
    beforeEach(async () => {
      await game.tileset
        .getTile(0, 0)
        .setPart(game.partset.getPartById("uranium1"));
      game.exotic_particles = 50;
      game.total_exotic_particles = 10;
      game.current_money = 12345;
    });

    it("should reset the game on reboot but retain and add to total exotic particles", () => {
      game.reboot_action(true);
      expect(game.current_money).toBe(game.base_money);
      expect(game.tileset.getTile(0, 0).part).toBeNull();
      expect(game.exotic_particles).toBe(0);
      expect(game.total_exotic_particles).toBe(60);
      expect(game.current_exotic_particles).toBe(60);
    });

    it("should reset and not keep current exotic particles if rebooting without keep", () => {
      game.reboot_action(false);
      expect(game.current_money).toBe(game.base_money);
      expect(game.exotic_particles).toBe(0);
      expect(game.total_exotic_particles).toBe(0);
      expect(game.current_exotic_particles).toBe(0);
    });
  });
});
