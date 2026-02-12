import Phaser from "phaser";

export default class SplashScene2 extends Phaser.Scene {
  constructor() {
    super("splash2");
  }

  preload() {
    // Load logo parts for animation
    this.load.image("simbolo1", "/assets/simbolo1.png");
    this.load.image("simbolo2", "/assets/simbolo2.png");
    this.load.image("imiwebs", "/assets/imiwebs.png");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Set background to white
    this.cameras.main.setBackgroundColor("#ffffff");

    // Add simbolo1 (left) with fade
    const simbolo1 = this.add.image(centerX - 2.5, centerY, "simbolo1")
      .setOrigin(1, 0.5)
      .setAlpha(0);

    // Add simbolo2 (right) with fade
    const simbolo2 = this.add.image(centerX + 2.5, centerY, "simbolo2")
      .setOrigin(0, 0.5)
      .setAlpha(0);

    // FadeIn animation for both symbols (150% slower: 500ms * 2.5 = 1250ms)
    this.tweens.add({
      targets: [simbolo1, simbolo2],
      alpha: 1,
      duration: 1250,
      ease: "Linear"
    });

    // Calculate 80% of simbolo1 height for the animation
    const simbolo1Height = simbolo1.height;
    const downAmount = simbolo1Height * 0.8;

    // After 500ms, animate simbolo2 down by 80% of simbolo1's height
    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: simbolo2,
        y: centerY + downAmount,
        duration: 300,
        ease: "Linear"
      });
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
        targets: [simbolo1, simbolo2],
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
