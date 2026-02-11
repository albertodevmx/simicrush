import Phaser from "phaser";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    // Menu Assets
    this.load.image("menu-bg", "/assets/menu/fondo-menu.png");
    this.load.image("menu-title", "/assets/menu/titulo.png");
    this.load.image("btn-enter", "/assets/menu/btn-entrar.png");
    this.load.image("btn-scores", "/assets/menu/btn-puntajes.png");
    this.load.image("btn-instructions", "/assets/menu/btn-instrucciones.png");
    this.load.image("btn-back-menu", "/assets/menu/btn-volver-menu.png");
    this.load.image("instructions-bg", "/assets/menu/fondoinstrucciones.png");

    // Game Assets
    this.load.image("game-bg", "/assets/game/fondo-juego.png");

    // Tiles (6)
    this.load.image("tile_heart_s", "/assets/tiles/heart_s.png");
    this.load.image("tile_syringe", "/assets/tiles/syringe.png");
    this.load.image("tile_dog", "/assets/tiles/dog_face.png");
    this.load.image("tile_coffee", "/assets/tiles/coffee_cup.png");
    this.load.image("tile_plush", "/assets/tiles/plush_doctor.png");
    this.load.image("tile_rocket", "/assets/tiles/rocket.png");

    // --- AUDIO ---
    this.load.audio("bgm_fondo", "assets/audio/fondo.mp3");
    this.load.audio("sfx_slack", "assets/audio/slack.mp3");
    this.load.audio("sfx_swipe", "assets/audio/swipe.mp3");
    this.load.audio("sfx_pop", "assets/audio/popbubble.mp3");

    // FX (opcional)
    this.load.image("fx_heart", "/assets/fx/particle_heart.png");
  }

  create() {
    this.scene.start("menu");
  }
}