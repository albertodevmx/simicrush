import Phaser from "phaser";
import PreloadScene from "./scenes/PreloadScene";
import MenuScene from "./scenes/MenuScene";
import GameScene from "./scenes/GameScene";

// Detect viewport size and orientation
function getGameDimensions() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isPortrait = vh > vw;

  let width, height;

  if (isPortrait) {
    // Mobile vertical: use full viewport
    width = Math.min(vw, vh * 0.75);
    height = Math.min(vh, vw * 1.33);
  } else {
    // Desktop horizontal
    width = Math.min(vw * 0.9, 800);
    height = Math.min(vh * 0.9, 600);
  }

  return {
    width: Math.floor(width),
    height: Math.floor(height),
    isPortrait
  };
}

const dimensions = getGameDimensions();

const config = {
  type: Phaser.AUTO,
  width: dimensions.width,
  height: dimensions.height,
  backgroundColor: "#1a0022",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    fullscreenTarget: 'parent',
  },
  scene: [PreloadScene, MenuScene, GameScene],
};

const game = new Phaser.Game(config);

// Handle window resize for responsive design
window.addEventListener('resize', () => {
  const newDimensions = getGameDimensions();
  game.scale.resize(newDimensions.width, newDimensions.height);
});