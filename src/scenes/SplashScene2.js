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

    // Scale factor: 20% of original size (50% of 0.4)
    const animationScale = 0.2;

    // Add simbolo1 (left) with fade and scale
    const simbolo1 = this.add.image(centerX - 1.25, centerY, "simbolo1")
      .setOrigin(1, 0.5)
      .setAlpha(0)
      .setScale(animationScale);

    // Add simbolo2 (right) with fade and scale
    const simbolo2 = this.add.image(centerX + 1.25, centerY, "simbolo2")
      .setOrigin(0, 0.5)
      .setAlpha(0)
      .setScale(animationScale);

    // Add imiwebs (will appear in second phase)
    const imiwebs = this.add.image(centerX, centerY, "imiwebs")
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(animationScale);

    // FadeIn animation for both symbols (150% slower: 500ms * 2.5 = 1250ms)
    this.tweens.add({
      targets: [simbolo1, simbolo2],
      alpha: 1,
      duration: 1250,
      ease: "Linear"
    });

    // Calculate position: 44px below the top of simbolo1 (50% reduction: 88 → 44)
    const simbolo1DisplayHeight = simbolo1.displayHeight;
    const topOfSimbolo1 = centerY - (simbolo1DisplayHeight / 2);
    const targetYSimbolo2 = topOfSimbolo1 + 44;

    // After 500ms, animate simbolo2 down (200% slower: 300ms * 3 = 900ms)
    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: simbolo2,
        y: targetYSimbolo2,
        duration: 900,
        ease: "Linear"
      });
    });

    // After simbolo2 finishes descending (500 + 900 + 300ms delay), start imiwebs animation
    // Also move symbols left immediately at 1450ms
    this.time.delayedCall(1450, () => {
      // Distance to move symbols left (50% reduction: 80 → 40)
      const moveDistance = 40;

      // Horizontal overlap: 15% of imiwebs width
      const overlapAmount = imiwebs.displayWidth * 0.15;

      // Move both symbols to the left
      this.tweens.add({
        targets: [simbolo1, simbolo2],
        x: "-=" + moveDistance,
        duration: 700,
        ease: "Linear"
      });
    });

    // Start imiwebs animation 300ms after simbolo2 finishes (at 1700ms)
    this.time.delayedCall(1700, () => {
      // Distance to move symbols left (50% reduction: 80 → 40)
      const moveDistance = 40;

      // Horizontal overlap: 15% of imiwebs width
      const overlapAmount = imiwebs.displayWidth * 0.15;

      // Final position: 50% reduction (20px → 10px left, 15px → 7.5px up)
      const finalXMovement = moveDistance - overlapAmount - 10;
      const finalYMovement = -7.5;

      // FadeIn and move imiwebs
      this.tweens.add({
        targets: imiwebs,
        alpha: 1,
        x: "+=" + finalXMovement,
        y: "+=" + finalYMovement,
        duration: 700,
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

    // FadeOut after all animations complete (3400ms = 1700 + 700 + 1000)
    this.time.delayedCall(3400, () => {
      this.tweens.add({
        targets: [simbolo1, simbolo2, imiwebs],
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
