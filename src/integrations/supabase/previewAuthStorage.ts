// On a Lovable preview surface, broker the auth session to the editor over
// postMessage so the project's preview surfaces share one login; else localStorage.

export function brokeredPreviewStorage() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const storage = window.localStorage;
  const host = window.location.hostname;

  // Site publicado oficial: usar localStorage diretamente.
  // Não precisa do broker do editor do Lovable.
  if (host === 'salaodefestaapp.lovable.app') {
    return storage;
  }

  const PREVIEW_ZONES = [
    'lovableproject.com',
    'lovableproject-dev.com',
    'lovable.app',
    'gpt-eng.com',
    'gptengineer.run',
  ];

  const onPreviewZone = PREVIEW_ZONES.some(
    (zone) => host === zone || host.endsWith(`.${zone}`),
  );

  const UUID =
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

  const projectId = onPreviewZone
    ? (
        host.match(
          new RegExp(
            `^(?:id-preview(?:-[a-z0-9]+)?|project)--(${UUID})(?:-dev)?(?=\\.|$)`,
            'i',
          ),
        )?.[1] ??
        host.match(
          new RegExp(`^(${UUID})(?=[.-])`, 'i'),
        )?.[1]
      )
    : undefined;

  const framed =
    window.parent && window.parent !== window;

  // Fora de uma preview embutida, usar localStorage normalmente.
  if (!projectId || !framed) {
    return storage;
  }

  const dev =
    host.endsWith('.lovableproject-dev.com') ||
    host.endsWith('.gpt-eng.com');

  const EDITOR = dev
    ? /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$|^http:\/\/localhost:3000$/
    : /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$/;

  let ancestor = '';

  try {
    ancestor =
      (window.location.ancestorOrigins &&
        window.location.ancestorOrigins[0]) ||
      (window.document.referrer
        ? new URL(window.document.referrer).origin
        : '');
  } catch {
    ancestor = '';
  }

  const editorOrigins =
    ancestor && EDITOR.test(ancestor)
      ? [ancestor]
      : dev
        ? [
            'https://lovable.dev',
            'http://localhost:3000',
          ]
        : ['https://lovable.dev'];

  const RESULT = 'lovable-preview-auth:result';
  const TIMEOUT = 2000;
  const RETRY_DELAY = 250;

  const newId = () =>
    Math.random().toString(36).slice(2) +
    Date.now().toString(36);

  const readLocal = (
    key: string,
  ): string | null => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };

  const writeLocal = (
    key: string,
    value: string,
  ) => {
    try {
      storage.setItem(key, value);
    } catch {
      // Ignorar erro de storage indisponível.
    }
  };

  const removeLocal = (key: string) => {
    try {
      storage.removeItem(key);
    } catch {
      // Ignorar erro de storage indisponível.
    }
  };

  const request = (
    type: string,
    key: string,
    value?: string,
  ): Promise<{
    ok: boolean;
    value?: string | null;
  } | null> =>
    new Promise((resolve) => {
      const requestId = newId();

      let done = false;

      let timer:
        | ReturnType<typeof setTimeout>
        | undefined;

      const finish = (
        result: {
          ok: boolean;
          value?: string | null;
        } | null,
      ) => {
        if (done) return;

        done = true;

        if (timer) {
          clearTimeout(timer);
        }

        window.removeEventListener(
          'message',
          onMessage,
        );

        resolve(result);
      };

      const onMessage = (
        event: MessageEvent,
      ) => {
        if (
          editorOrigins.indexOf(event.origin) < 0
        ) {
          return;
        }

        const data = event.data;

        if (
          data &&
          data.type === RESULT &&
          data.requestId === requestId
        ) {
          finish(data);
        }
      };

      window.addEventListener(
        'message',
        onMessage,
      );

      const message: Record<
        string,
        unknown
      > = {
        type,
        requestId,
        projectId,
        key,
      };

      if (value !== undefined) {
        message.value = value;
      }

      for (const origin of editorOrigins) {
        window.parent.postMessage(
          message,
          origin,
        );
      }

      timer = setTimeout(
        () => finish(null),
        TIMEOUT,
      );
    });

  let firstGet = true;

  return {
    getItem: async (
      key: string,
    ): Promise<string | null> => {
      const local = readLocal(key);

      let result = await request(
        'lovable-preview-auth:get',
        key,
        local ?? undefined,
      );

      if (!result && firstGet) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY),
        );

        result = await request(
          'lovable-preview-auth:get',
          key,
          local ?? undefined,
        );
      }

      firstGet = false;

      if (
        result &&
        result.ok &&
        typeof result.value === 'string'
      ) {
        // Tombstone de logout.
        if (result.value === '') {
          removeLocal(key);
          return null;
        }

        if (readLocal(key) !== result.value) {
          writeLocal(key, result.value);
        }

        return result.value;
      }

      return readLocal(key);
    },

    setItem: async (
      key: string,
      value: string,
    ): Promise<void> => {
      writeLocal(key, value);

      const result = await request(
        'lovable-preview-auth:set',
        key,
        value,
      );

      if (
        result &&
        result.ok &&
        typeof result.value === 'string'
      ) {
        if (result.value === '') {
          removeLocal(key);
        } else if (
          readLocal(key) !== result.value
        ) {
          writeLocal(
            key,
            result.value,
          );
        }
      }
    },

    removeItem: async (
      key: string,
    ): Promise<void> => {
      const local = readLocal(key);

      removeLocal(key);

      await request(
        'lovable-preview-auth:remove',
        key,
        local ?? undefined,
      );
    },
  };
}
