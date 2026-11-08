/** Full-screen placeholder shown while the session is being restored on app load. */
export function SessionCheck() {
  return (
    <div role="status" className="flex h-dvh w-full items-center justify-center text-sm text-muted">
      Verificando sesión…
    </div>
  );
}
