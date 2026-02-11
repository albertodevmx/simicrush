import Phaser from "phaser";

export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super("instructions");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const isMobile = this.cameras.main.width < 500;

    // Add instructions background image
    if (this.textures.exists("instructions-bg")) {
      this.add.image(centerX, centerY, "instructions-bg").setDisplaySize(
        this.cameras.main.width,
        this.cameras.main.height
      );
    } else {
      // Fallback to menu background if instructions bg doesn't exist
      if (this.textures.exists("menu-bg")) {
        this.add.image(centerX, centerY, "menu-bg").setDisplaySize(
          this.cameras.main.width,
          this.cameras.main.height
        );
      }
    }

    // Botón volver con imagen
    const backBtn = this.add
      .image(15, 40, "btn-back-menu")
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    // Scale button to fit (80% del tamaño anterior)
    const btnTargetWidth = isMobile ? 160 : 224;
    const btnScale = btnTargetWidth / backBtn.width;
    backBtn.setScale(btnScale);

    backBtn.on("pointerdown", () => {
      this.scene.start("menu");
    });
  }
}
