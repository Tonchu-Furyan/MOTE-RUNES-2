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
  const response = await fetch('/api/runes');
  if (!response.ok) {
    throw new Error('Failed to fetch runes');
  }
  return response.json();
}

export async function fetchRuneById(id: number): Promise<Rune> {
  const response = await fetch(`/api/runes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch rune');
  }
  return response.json();
}

export async function pullDailyRune(userId: number): Promise<RunePull> {
  // Get all runes
  const runes = await fetchAllRunes();
  
  // Randomly select a rune
  const randomIndex = Math.floor(Math.random() * runes.length);
  const selectedRune = runes[randomIndex];
  
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
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to pull rune');
  }
  
  return response.json();
}

export async function fetchUserRunePulls(userId: number): Promise<RunePull[]> {
  const response = await fetch(`/api/rune-pulls/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user rune pulls');
  }
  return response.json();
}

export async function fetchLatestUserRunePull(userId: number): Promise<RunePull | null> {
  try {
    const response = await fetch(`/api/rune-pulls/user/${userId}/latest`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('Failed to fetch latest user rune pull');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching latest pull:', error);
    return null;
  }
}

export async function hasUserPulledToday(userId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/rune-pulls/user/${userId}/check-today`);
    if (!response.ok) {
      throw new Error('Failed to check if user has pulled today');
    }
    const data = await response.json();
    return data.hasPulledToday;
  } catch (error) {
    console.error('Error checking if user has pulled today:', error);
    return false;
  }
}
