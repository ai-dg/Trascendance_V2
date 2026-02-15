import Fastify from 'fastify';
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import ejs from "ejs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = Fastify();


console.log(join(process.cwd(), "locales"));
server.register(fastifyStatic, {
  root: join(process.cwd(), "locales"),
  prefix: "/locales/",
  decorateReply: false
});

server.register(fastifyStatic, {
  root: join(__dirname, "../public"),
  prefix: "/public/",
});

server.register(fastifyView, {
  engine: {
    ejs: ejs,
  },
  root: join(__dirname, "../views"),
});


server.get("/", async (request, reply) => {
  // Optional: set APP_CANONICAL_ORIGIN (e.g. https://localhost) to redirect all entry URLs to one origin so session (localStorage + cookies) persists
  const canonicalOrigin = process.env.APP_CANONICAL_ORIGIN;
  if (canonicalOrigin) {
    const proto = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers['x-forwarded-host'] || request.headers.host || '';
    const currentOrigin = `${proto}://${host}`;
    if (currentOrigin !== canonicalOrigin) {
      const target = canonicalOrigin + (request.url === '/' ? '' : request.url);
      return reply.redirect(302, target);
    }
  }
  const host = process.env.BASE_URL || (canonicalOrigin ? new URL(canonicalOrigin).host : null) || request.headers['x-forwarded-host'] || request.headers.host || "localhost";
  return reply.view("index.ejs", { base_url: host });
});

server.get("/api/hello", async () => {
  return { msg: "Hello from Fastify + TS + Tailwind!" };
});

server.get("/api/debug/host", async (request, reply) => {
  const host = request.headers['x-forwarded-host'] || request.headers.host || process.env.BASE_URL || "localhost";
  return {
    host: host,
    'x-forwarded-host': request.headers['x-forwarded-host'],
    'host-header': request.headers.host,
    'BASE_URL': process.env.BASE_URL
  };
});

server.listen({ port: 3006, host: "0.0.0.0" })
  .then(() => {
    console.log("Frontend app running on http://0.0.0.0:3006");
  })
  .catch(err => {
    server.log.error(err);
    process.exit(1);
});



