// Storage seguro para autenticação Supabase.
//
// No servidor (SSR), localStorage não existe.
// No navegador, utiliza o localStorage normalmente.

export function brokeredPreviewStorage() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.localStorage;
}
