import Phaser from "phaser";

export default class SplashScene1 extends Phaser.Scene {
  constructor() {
    super("splash1");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Add background
    this.cameras.main.setBackgroundColor("#120018");

    // Add text
    this.add
      .text(centerX, centerY, "Farmacias Similares", {
        fontFamily: "Arial",
        fontSize: "48px",
        fontStyle: "bold",
        color: "#ff5aa5",
        align: "center",
      })
      .setOrigin(0.5);

    // Wait 3 seconds then go to next splash scene
    this.time.delayedCall(3000, () => {
      this.scene.start("splash2");
    });
  }
}
