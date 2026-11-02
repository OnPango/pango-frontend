export const content = {
  notFound: {
    code: '404',
    eyebrow: 'Error 404',
    title: 'No encontramos esa página',
    description: 'La dirección que buscas no existe o fue movida.',
  },
  forbidden: {
    code: '403',
    eyebrow: 'Error 403',
    title: 'No tienes acceso a esta sección',
    description:
      'Tu rol no incluye el permiso necesario. Si crees que es un error, contacta al administrador de tu organización.',
  },
  unexpected: {
    code: '500',
    eyebrow: 'Error inesperado',
    title: 'Algo salió mal',
    description:
      'Ocurrió un problema al mostrar esta página. Puedes reintentar o volver al inicio.',
  },
  outdated: {
    eyebrow: 'Nueva versión',
    title: 'Pango se actualizó',
    description:
      'No pudimos cargar esta sección porque la aplicación cambió desde que la abriste. Recarga la página para continuar.',
  },
  actions: {
    home: 'Ir al inicio',
    back: 'Volver',
    retry: 'Reintentar',
    reload: 'Recargar la página',
  },
};
