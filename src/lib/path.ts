const base = import.meta.env.BASE_URL;

export function url(path = '/'): string {
  const left = base.endsWith('/') ? base.slice(0, -1) : base;
  const right = path.startsWith('/') ? path : `/${path}`;
  const joined = `${left}${right}`;
  return joined === '' ? '/' : joined;
}
