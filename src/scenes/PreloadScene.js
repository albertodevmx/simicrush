import Phaser from "phaser";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    // Get dimensions
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const isMobile = this.cameras.main.width < 500;

    // Background
    this.cameras.main.setBackgroundColor("#ffffff");

    // Progress bar background
    const barWidth = isMobile ? 250 : 350;
    const barHeight = 20;
    const barX = centerX - barWidth / 2;
    const barY = centerY + 80;

    // Draw background rectangle for progress bar
    const barBg = this.add.rectangle(centerX, barY, barWidth, barHeight, 0xdddddd);
    barBg.setDepth(0);

    // Create fill rectangle (will be updated with progress)
    const barFill = this.add.rectangle(barX + barWidth / 2, barY, 0, barHeight, 0xff5aa5);
    barFill.setOrigin(0, 0.5);
    barFill.setDepth(1);

    // Progress text
    const progressText = this.add.text(centerX, barY - 40, "Cargando...", {
      fontFamily: "Arial",
      fontSize: isMobile ? "18px" : "24px",
      color: "#000000",
      align: "center"
    });
    progressText.setOrigin(0.5);
    progressText.setDepth(1);

    // Update progress bar on file load
    this.load.on("progress", (progress) => {
      barFill.setDisplaySize(barWidth * progress, barHeight);
    });

    // Menu Assets
    this.load.image("menu-bg", "/assets/menu/fondo-menu.png");
    this.load.image("menu-title", "/assets/menu/titulo.png");
    this.load.image("btn-enter", "/assets/menu/btn-entrar.png");
    this.load.image("btn-scores", "/assets/menu/btn-puntajes.png");
    this.load.image("btn-instructions", "/assets/menu/btn-instrucciones.png");
    this.load.image("btn-back-menu", "/assets/menu/btn-volver-menu.png");
    this.load.image("instructions-bg", "/assets/fondoinstrucciones.png");
    this.load.image("top-scores-title", "/assets/top-puntajes-letrero.png");

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