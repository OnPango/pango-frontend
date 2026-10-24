type DashboardContentType = {
  id: string;
  greeting: string;
  message: string;
};

function getUserName(): string | undefined {
  try {
    const raw = localStorage.getItem('pango-auth');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed?.state?.user?.name ?? parsed?.user?.name;
  } catch {
    return undefined;
  }
}

function getGreeting(hour: number): string {
  if (hour < 12) {
    return 'Buenos días';
  } else if (hour < 18) {
    return 'Buenas tardes';
  }
  return 'Buenas noches';
}

function buildGreeting(): string {
  const userName = getUserName();
  const base = getGreeting(new Date().getHours());
  return userName ? `¡${base}, ${userName}!` : `¡${base}!`;
}

export const DashboardContent: DashboardContentType = {
  id: '1',
  greeting: buildGreeting(),
  message: 'Bienvenido al sistema de gestión de inventario Pango',
};
