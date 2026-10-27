type DashboardContentType = {
  id: string;
  message: string;
};

function getGreeting(hour: number): string {
  if (hour < 12) {
    return 'Buenos días';
  } else if (hour < 18) {
    return 'Buenas tardes';
  }
  return 'Buenas noches';
}

/** Greeting for the current time of day, personalized when the user's name is known. */
export function buildGreeting(userName?: string, now = new Date()): string {
  const base = getGreeting(now.getHours());
  return userName ? `¡${base}, ${userName}!` : `¡${base}!`;
}

export const DashboardContent: DashboardContentType = {
  id: '1',
  message: 'Lindo verte de nuevo, gestiona tu inventario de forma sencilla',
};
