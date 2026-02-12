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

    // Scale factor: 40% of current size
    const animationScale = 0.4;

    // Add simbolo1 (left) with fade and scale
    const simbolo1 = this.add.image(centerX - 2.5, centerY, "simbolo1")
      .setOrigin(1, 0.5)
      .setAlpha(0)
      .setScale(animationScale);

    // Add simbolo2 (right) with fade and scale
    const simbolo2 = this.add.image(centerX + 2.5, centerY, "simbolo2")
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

    // After 1550ms, start second phase: move symbols left, imiwebs appears and moves right
    this.time.delayedCall(1550, () => {
      // Distance to move symbols left
      const moveDistance = 80;

      // Vertical offset: 30% above center of the symbol group
      const verticalOffset = centerY * 0.3;

      // Horizontal overlap: 15% of imiwebs width
      const overlapAmount = imiwebs.displayWidth * 0.15;

      // Move both symbols to the left
      this.tweens.add({
        targets: [simbolo1, simbolo2],
        x: "-=" + moveDistance,
        duration: 700,
        ease: "Linear"
      });

      // FadeIn and move imiwebs to the right and up
      this.tweens.add({
        targets: imiwebs,
        alpha: 1,
        x: "+=" + (moveDistance - overlapAmount),
        y: "-=" + verticalOffset,
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

    // FadeOut after all animations complete (3250ms = 1550 + 700 + 1000)
    this.time.delayedCall(3250, () => {
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
