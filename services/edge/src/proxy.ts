type ProxyOptions = {
  rewritePath?: (pathname: string) => string;
  extraHeaders?: Record<string, string>;
};

export const proxyRequest = async (
  request: Request,
  targetBaseUrl: string,
  options: ProxyOptions = {}
) => {
  const { pathname, search } = new URL(request.url);
  const nextPath = options.rewritePath ? options.rewritePath(pathname) : pathname;
  const targetUrl = new URL(`${nextPath}${search}`, targetBaseUrl);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  if (options.extraHeaders) {
    for (const [key, value] of Object.entries(options.extraHeaders)) {
      headers.set(key, value);
    }
  }

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD"
    ? undefined
    : await request.clone().arrayBuffer();

  const response = await fetch(targetUrl, {
    method,
    headers,
    body
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers
  });
};
