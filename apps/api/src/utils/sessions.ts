export function generateSessionName(sessionId: string): string {
  if (!sessionId) return 'Unknown Session';
  
  const shortId = sessionId.substring(0, 6);
  const animals = [
    'Elephant', 'Tiger', 'Dolphin', 'Eagle', 'Penguin', 
    'Wolf', 'Lion', 'Bear', 'Panda', 'Fox', 
    'Owl', 'Koala', 'Whale', 'Hawk', 'Jaguar', 'Glimp'
  ];
  
  const hashValue = sessionId.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0) | 0;
  }, 0);
  
  const animal = animals[Math.abs(hashValue) % animals.length];
  return `${animal}-${shortId}`;
}