import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, update, get, query, orderByChild, limitToFirst } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjnUglhasMWnlcioVpsK83IVthId84D-Y",
  authDomain: "simicrush.firebaseapp.com",
  databaseURL: "https://simicrush-default-rtdb.firebaseio.com",
  projectId: "simicrush",
  storageBucket: "simicrush.firebasestorage.app",
  messagingSenderId: "414992425253",
  appId: "1:414992425253:web:6d41bede217ef57fa93acc",
  measurementId: "G-GZ6PE2PK7W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Get device information
function getDeviceInfo() {
  const ua = navigator.userAgent;
  return {
    userAgent: ua,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    timestamp: new Date().toISOString(),
  };
}

// Get player's game records count
export async function getPlayerRecordsCount(employeeNumber) {
  try {
    const playerRef = ref(database, `players/${employeeNumber}`);
    const snapshot = await get(playerRef);

    if (!snapshot.exists()) {
      return 0;
    }

    const data = snapshot.val();
    return data.records ? Object.keys(data.records).length : 0;
  } catch (error) {
    console.error("Error getting records count:", error);
    return 0;
  }
}

// Get player's records
export async function getPlayerRecords(employeeNumber) {
  try {
    const playerRef = ref(database, `players/${employeeNumber}/records`);
    const snapshot = await get(playerRef);

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();
    return Object.values(data).sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Error getting player records:", error);
    return [];
  }
}

// Start a new game (create record with score 0)
export async function startGame(employeeNumber, playerName) {
  try {
    const gameData = {
      employeeNumber,
      playerName,
      score: 0,
      startTime: new Date().toISOString(),
      status: "playing",
      deviceInfo: getDeviceInfo(),
    };

    const playerRef = ref(database, `players/${employeeNumber}`);
    const gameRef = push(ref(database, `players/${employeeNumber}/records`));

    // Update player info
    await update(playerRef, {
      playerName: playerName,
      lastUpdated: new Date().toISOString(),
    });

    // Create game record
    await update(gameRef, gameData);

    return gameRef.key; // Return game ID for later update
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;
  }
}

// End game and update score
export async function endGame(employeeNumber, gameId, finalScore) {
  try {
    const gameRef = ref(database, `players/${employeeNumber}/records/${gameId}`);

    await update(gameRef, {
      score: finalScore,
      endTime: new Date().toISOString(),
      status: "completed",
      deviceInfo: getDeviceInfo(),
    });

    return true;
  } catch (error) {
    console.error("Error ending game:", error);
    throw error;
  }
}

// Get top scores globally
export async function getTopScores(limit = 50) {
  try {
    const allScores = [];
    const playersRef = ref(database, "players");
    const snapshot = await get(playersRef);

    if (!snapshot.exists()) {
      return [];
    }

    const playersData = snapshot.val();

    // Flatten all records from all players
    Object.entries(playersData).forEach(([employeeNumber, playerData]) => {
      if (playerData.records) {
        Object.entries(playerData.records).forEach(([recordId, record]) => {
          if (record.score > 0) { // Only completed games
            allScores.push({
              ...record,
              recordId,
              employeeNumber,
            });
          }
        });
      }
    });

    // Sort by score descending and return top scores
    return allScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting top scores:", error);
    return [];
  }
}

// Check if player is new (no records)
export async function isNewPlayer(employeeNumber) {
  const count = await getPlayerRecordsCount(employeeNumber);
  return count === 0;
}
