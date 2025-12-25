import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./auth";
import { config } from "./config";
import { proxyRequest } from "./proxy";

const authBasePath = config.betterAuthBasePath.replace(/\/$/, "");
const authWildcardPath = `${authBasePath}/*`;

const app = new Elysia().use(
  swagger({
    path: "/swagger",
    documentation: {
      info: {
        title: "RJChronos Edge API",
        version: process.env.EDGE_DOCS_VERSION ?? "dev",
        description:
          "Documentacao do Edge Gateway. Inclui rotas publicas do Edge, " +
          "autenticacao (Better Auth), proxy para o Core e o UI do GenieACS."
      },
      tags: [
        { name: "Auth", description: "Rotas publicas de autenticacao." },
        { name: "Core", description: "Proxy publico para o Core FastAPI." },
        { name: "GenieACS", description: "Proxy do UI do GenieACS." },
        { name: "Legacy", description: "Compatibilidade temporaria de auth." }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    }
  })
);

app.all(
  authBasePath,
  ({ request }) => auth.handler(request),
  {
    detail: {
      tags: ["Auth"],
      summary: "Better Auth (base)",
      description:
        "Endpoint base do Better Auth. " +
        "As rotas reais ficam sob o mesmo prefixo."
    }
  }
);

app.all(
  authWildcardPath,
  ({ request }) => auth.handler(request),
  {
    detail: {
      tags: ["Auth"],
      summary: "Better Auth",
      description:
        "Rotas de autenticacao do Better Auth (login, sessao, callback)."
    }
  }
);

if (config.legacyAuthProxyEnabled) {
  app.all(
    "/_legacy/auth/*",
    async ({ request, set }) => {
      if (config.legacyAuthProxyToken) {
        const headerValue = request.headers.get(config.legacyAuthProxyHeader);
        if (headerValue !== config.legacyAuthProxyToken) {
          set.status = 403;
          return { error: "forbidden" };
        }
      }

      return proxyRequest(request, config.backendInternalUrl, {
        rewritePath: (pathname) =>
          pathname.replace(/^\/\_legacy\/auth/, "/api/auth")
      });
    },
    {
      detail: {
        tags: ["Legacy"],
        summary: "Proxy legado de auth",
        description:
          "Compatibilidade temporaria para rotas legadas de autenticacao."
      }
    }
  );
}

app.all(
  "/api/*",
  ({ request }) => proxyRequest(request, config.backendInternalUrl),
  {
    detail: {
      tags: ["Core"],
      summary: "Proxy para o Core",
      description:
        "Encaminha todas as chamadas do Edge para o Core FastAPI."
    }
  }
);

const rewriteGenieacsUiPath = (pathname: string) => {
  const rewritten = pathname.replace(/^\/ui/, "");
  return rewritten.length ? rewritten : "/";
};

app.all(
  "/ui",
  ({ request }) =>
    proxyRequest(request, config.genieacsUiInternalUrl, {
      rewritePath: rewriteGenieacsUiPath
    }),
  {
    detail: {
      tags: ["GenieACS"],
      summary: "UI do GenieACS",
      description: "Proxy publico para a UI do GenieACS."
    }
  }
);

app.all(
  "/ui/*",
  ({ request }) =>
    proxyRequest(request, config.genieacsUiInternalUrl, {
      rewritePath: rewriteGenieacsUiPath
    }),
  {
    detail: {
      tags: ["GenieACS"],
      summary: "UI do GenieACS",
      description: "Proxy publico para a UI do GenieACS."
    }
  }
);

if (config.frontendDevUrl) {
  app.all(
    "/*",
    ({ request }) => proxyRequest(request, config.frontendDevUrl),
    {
      detail: {
        hide: true
      }
    }
  );
} else {
  app.use(
    staticPlugin({
      assets: config.frontendDistDir,
      prefix: "/",
      indexHTML: true
    })
  );
}

app.listen({
  port: config.port,
  hostname: config.host
});

console.log(`Edge running on http://${config.host}:${config.port}`);
