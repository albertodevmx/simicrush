import Phaser from "phaser";

export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super("instructions");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const isMobile = this.cameras.main.width < 500;

    // Add menu background as base layer
    if (this.textures.exists("menu-bg")) {
      this.add.image(centerX, centerY, "menu-bg")
        .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
        .setDepth(0);
    }

    // Add instructions image overlay on top (80% scale, offset up 55px)
    if (this.textures.exists("instructions-bg")) {
      const instructionsImg = this.add.image(centerX, centerY - 55, "instructions-bg")
        .setOrigin(0.5)
        .setDisplaySize(this.cameras.main.width * 0.8, this.cameras.main.height * 0.8)
        .setDepth(1)
        .setScale(0.1);

      // BounceIn animation for instructions image (500ms)
      this.tweens.add({
        targets: instructionsImg,
        scaleX: this.cameras.main.width * 0.8 / instructionsImg.width,
        scaleY: this.cameras.main.height * 0.8 / instructionsImg.height,
        duration: 500,
        ease: "Bounce.out"
      });
    }

    // Botón volver con imagen (90px from bottom, centered horizontally)
    const backBtn = this.add
      .image(centerX, this.cameras.main.height + 100, "btn-back-menu")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(10)
      .setAlpha(0);

    // Scale button to fit (80% del tamaño anterior)
    const btnTargetWidth = isMobile ? 160 : 224;
    const btnScale = btnTargetWidth / backBtn.width;
    backBtn.setScale(btnScale);

    // BounceIn animation for back button from bottom (500ms)
    this.tweens.add({
      targets: backBtn,
      y: this.cameras.main.height - 90,
      alpha: 1,
      duration: 500,
      ease: "Bounce.out"
    });

    backBtn.on("pointerdown", () => {
      this.scene.start("menu");
    });
  }
}
