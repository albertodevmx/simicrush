import Phaser from "phaser";
import SplashScene1 from "./scenes/SplashScene1";
import SplashScene2 from "./scenes/SplashScene2";
import PreloadScene from "./scenes/PreloadScene";
import MenuScene from "./scenes/MenuScene";
import GameScene from "./scenes/GameScene";
import ScoresScene from "./scenes/ScoresScene";
import InstructionsScene from "./scenes/InstructionsScene";

// Detect viewport size and calculate dimensions maintaining 9:16 aspect ratio
function getGameDimensions() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Target aspect ratio 9:16 (mobile portrait)
  const targetRatio = 9 / 16;

  // Calculate dimensions based on available space while maintaining 9:16
  let width, height;

  // Try to maximize height first (portrait orientation)
  if (vh * targetRatio <= vw) {
    // Height is the limiting factor
    height = vh;
    width = height * targetRatio;
  } else {
    // Width is the limiting factor
    width = vw;
    height = width / targetRatio;
  }

  // Add some padding for smaller screens
  const padding = Math.min(vw, vh) < 500 ? 0 : 0;
  width = Math.floor(width - padding);
  height = Math.floor(height - padding);

  return {
    width,
    height,
    isPortrait: true // Always portrait for mobile aspect ratio
  };
}

// Detect if current dimensions are small screens (< 500px width)
function isMobileBreakpoint() {
  const dimensions = getGameDimensions();
  return dimensions.width < 500;
}

const dimensions = getGameDimensions();

const config = {
  type: Phaser.AUTO,
  width: dimensions.width,
  height: dimensions.height,
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    fullscreenTarget: 'parent',
  },
  scene: [SplashScene1, SplashScene2, PreloadScene, MenuScene, InstructionsScene, GameScene, ScoresScene],
};

const game = new Phaser.Game(config);

// Track the current breakpoint to detect changes
let currentBreakpoint = isMobileBreakpoint();

// Handle window resize for responsive design (maintains 9:16 aspect ratio)
window.addEventListener('resize', () => {
  const newDimensions = getGameDimensions();
  const newBreakpoint = newDimensions.width < 500;

  game.scale.resize(newDimensions.width, newDimensions.height);

  // If breakpoint changed, restart the game scene
  if (newBreakpoint !== currentBreakpoint) {
    currentBreakpoint = newBreakpoint;

    // Get current scene
    const activeScene = game.scene.getActive();
    if (activeScene && activeScene.scene.key === 'game') {
      activeScene.scene.restart();
    }
  }
});