import Phaser from "phaser";

export default class SplashScene2 extends Phaser.Scene {
  constructor() {
    super("splash2");
  }

  preload() {
    // Load logo for this splash scene
    this.load.image("simiwebs-logo", "/assets/simiwebs-logo.png");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Set background to white
    this.cameras.main.setBackgroundColor("#ffffff");

    // Add logo image in center, scaled to 40% of screen width
    const logo = this.add.image(centerX, centerY, "simiwebs-logo")
      .setOrigin(0.5)
      .setAlpha(0);

    // Scale logo to 40% of screen width while maintaining aspect ratio
    const targetWidth = this.cameras.main.width * 0.4;
    const scale = targetWidth / logo.width;
    logo.setScale(scale);

    // FadeIn animation (150% slower: 500ms * 2.5 = 1250ms)
    this.tweens.add({
      targets: logo,
      alpha: 1,
      duration: 1250,
      ease: "Linear"
    });

    // Flag to track if transition already started
    let hasTransitioned = false;

    // Function to transition to next scene
    const goToNextScene = () => {
      if (!hasTransitioned) {
        hasTransitioned = true;
        this.scene.start("preload");
      }
    };

    // Wait and fadeOut (150% slower: 300ms * 2.5 = 750ms)
    // Total time: 2 seconds
    this.time.delayedCall(2000 - 750, () => {
      this.tweens.add({
        targets: logo,
        alpha: 0,
        duration: 750,
        ease: "Linear",
        onComplete: () => {
          goToNextScene();
        }
      });
    });

    // Add invisible clickable area covering entire screen
    const clickArea = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height)
      .setInteractive({ useHandCursor: true });

    clickArea.on("pointerdown", () => {
      goToNextScene();
    });
  }
}
