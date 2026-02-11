import Phaser from "phaser";

export default class SplashScene1 extends Phaser.Scene {
  constructor() {
    super("splash1");
  }

  preload() {
    // Load logo for this splash scene
    this.load.image("logo-simi", "/assets/logo-simi.png");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Set background to white
    this.cameras.main.setBackgroundColor("#ffffff");

    // Add logo image in center
    this.add.image(centerX, centerY, "logo-simi")
      .setOrigin(0.5);

    // Wait 3 seconds then go to next splash scene
    this.time.delayedCall(3000, () => {
      this.scene.start("splash2");
    });
  }
}
