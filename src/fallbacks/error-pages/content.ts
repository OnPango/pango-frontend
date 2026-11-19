export const content = {
  notFound: {
    // The "404" is drawn in its picture (`NotFoundScene`).
    eyebrow: 'Error 404',
    title: 'Este camino no existe',
    description: 'Parece que Pango llegó hasta aquí, pero la página que buscas no está disponible.',
  },
  forbidden: {
    // The "403" is drawn in its picture (`ForbiddenScene`).
    eyebrow: 'Error 403',
    title: 'Esta zona está cercada',
    description:
      'Pango llegó hasta la cerca, pero tu rol no tiene permiso para entrar aquí. Si lo necesitas, pide acceso al administrador de tu organización.',
  },
  unexpected: {
    // The "500" is drawn in its picture (`UnexpectedScene`).
    eyebrow: 'Error 500',
    title: 'Algo se rompió en el camino',
    description:
      'Pango no pudo cruzar porque algo falló de nuestro lado. Reintenta en un momento o vuelve al inicio.',
  },
  outdated: {
    eyebrow: 'Nueva versión',
    title: 'Pango se actualizó',
    description:
      'No pudimos cargar esta sección porque la aplicación cambió desde que la abriste. Recarga la página para continuar.',
  },
  actions: {
    home: 'Volver al inicio',
    back: 'Volver',
    retry: 'Reintentar',
    reload: 'Recargar la página',
  },
};
