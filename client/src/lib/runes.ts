export interface Rune {
  id: number;
  name: string;
  symbol: string;
  meaning: string;
  interpretation: string;
  guidance: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export interface RunePull {
  id: number;
  userId: number;
  runeId: number;
  pullDate: string;
  createdAt: string;
  rune: Rune;
}

// Client-side functions to interact with the API
export async function fetchAllRunes(): Promise<Rune[]> {
  try {
    const response = await fetch('/api/runes');
    if (!response.ok) {
      throw new Error(`Failed to fetch runes: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching runes:', error);
    throw new Error('Failed to fetch runes. Please try again later.');
  }
}

export async function fetchRuneById(id: number): Promise<Rune> {
  try {
    const response = await fetch(`/api/runes/${id}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch rune: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching rune id ${id}:`, error);
    throw new Error('Failed to fetch rune. Please try again later.');
  }
}

export async function pullDailyRune(userId: number): Promise<RunePull> {
  try {
    // Get all runes
    const runes = await fetchAllRunes();
    
    if (!runes || runes.length === 0) {
      throw new Error('No runes available. Please try again later.');
    }
    
    // Implement weighted selection based on rarity
    // Probabilities: common (60%), uncommon (25%), rare (10%), epic (4%), legendary (1%)
    const rarityWeights = {
      "common": 60,
      "uncommon": 25,
      "rare": 10,
      "epic": 4,
      "legendary": 1
    };
    
    // Group runes by rarity
    const runesByRarity: Record<string, Rune[]> = {
      "common": [],
      "uncommon": [],
      "rare": [],
      "epic": [],
      "legendary": []
    };
    
    runes.forEach(rune => {
      if (runesByRarity[rune.rarity]) {
        runesByRarity[rune.rarity].push(rune);
      } else {
        // Default to common if rarity is not recognized
        runesByRarity.common.push(rune);
      }
    });
    
    // Determine which rarity group to pull from
    const rarityRoll = Math.random() * 100;
    let cumulativeProbability = 0;
    let selectedRarity: string = "common"; // Default
    
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      cumulativeProbability += weight;
      if (rarityRoll <= cumulativeProbability) {
        selectedRarity = rarity;
        break;
      }
    }
    
    // If no runes in the selected rarity, fall back to common
    if (runesByRarity[selectedRarity].length === 0) {
      selectedRarity = "common";
      
      // If still no runes (unlikely), just use any rune
      if (runesByRarity.common.length === 0) {
        const selectedRune = runes[Math.floor(Math.random() * runes.length)];
        
        try {
          // Create a new rune pull
          const response = await fetch('/api/rune-pulls', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              runeId: selectedRune.id,
            }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to pull rune' }));
            throw new Error(errorData.message || 'Failed to pull rune');
          }
          
          return await response.json();
        } catch (error) {
          console.error('Error pulling rune:', error);
          throw new Error('Failed to pull rune. Please try again later.');
        }
      }
    }
    
    // Pick random rune from the selected rarity group
    const rarityGroup = runesByRarity[selectedRarity];
    const randomIndex = Math.floor(Math.random() * rarityGroup.length);
    const selectedRune = rarityGroup[randomIndex];
    
    try {
      // Create a new rune pull
      const response = await fetch('/api/rune-pulls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          runeId: selectedRune.id,
        }),
        credentials: 'include'
      });
      
      // Log response details without headers to avoid TypeScript issues
      console.log('Rune pull response:', { 
        status: response.status, 
        statusText: response.statusText, 
        ok: response.ok
      });
      
      if (!response.ok) {
        // Try to get the detailed error message from the response
        const errorText = await response.text();
        console.error('Raw server error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: 'Failed to parse error response' };
        }
        
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || 'Failed to pull rune');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error pulling rune:', error);
      // If it's an error with a message, preserve it for better user feedback
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to pull rune. Please try again later.');
      }
    }
  } catch (error) {
    console.error('Error in pullDailyRune:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred');
  }
}

export async function fetchUserRunePulls(userId: number): Promise<RunePull[]> {
  try {
    const response = await fetch(`/api/rune-pulls/user/${userId}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch user rune pulls: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user rune pulls:', error);
    throw new Error('Failed to fetch your rune history. Please try again later.');
  }
}

export async function fetchLatestUserRunePull(userId: number): Promise<RunePull | null> {
  try {
    const response = await fetch(`/api/rune-pulls/user/${userId}/latest`, {
      credentials: 'include'
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch latest rune pull: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching latest pull:', error);
    return null;
  }
}

export async function hasUserPulledToday(userId: number): Promise<boolean> {
  if (!userId) {
    console.warn('hasUserPulledToday called with no userId');
    return false;
  }
  
  console.log(`Checking if user ${userId} has pulled a rune today...`);
  
  try {
    const response = await fetch(`/api/rune-pulls/user/${userId}/check-today`, {
      credentials: 'include'
    });
    
    console.log(`Received response status: ${response.status}`);
    
    if (!response.ok) {
      // Log the full error response for debugging
      const errorText = await response.text();
      console.error(`Server response (${response.status}):`);
      console.error(errorText);
      
      throw new Error(`Failed to check if user has pulled today: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Has user ${userId} pulled today? ${data.hasPulledToday}`);
    
    return data.hasPulledToday;
  } catch (error) {
    console.error('Error checking if user has pulled today:', error);
    // Default to false on error to allow user to attempt a pull
    return false;
  }
}
