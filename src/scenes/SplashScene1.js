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

    // Add logo image in center with fadeIn
    const logo = this.add.image(centerX, centerY, "logo-simi")
      .setOrigin(0.5)
      .setAlpha(0);

    // FadeIn animation
    this.tweens.add({
      targets: logo,
      alpha: 1,
      duration: 500,
      ease: "Linear"
    });

    // Wait 1.5 seconds then fadeOut and go to next splash scene
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: logo,
        alpha: 0,
        duration: 300,
        ease: "Linear",
        onComplete: () => {
          this.scene.start("splash2");
        }
      });
    });
  }
}
