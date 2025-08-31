import Fastify from 'fastify';
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fastifyStatic from "@fastify/static";

const server = Fastify();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

server.register(fastifyStatic, {
  root: join(__dirname, "../public"),
  prefix: "/public/",
});

server.get("/api/hello", async () => {
  return { msg: "Hello from Fastify + TS + Tailwind!" };
});

server.listen({ port: 3006, host: "0.0.0.0" })
  .then(() => {
    console.log("Frontend app running on http://0.0.0.0:3006");
  })
  .catch(err => {
    server.log.error(err);
    process.exit(1);
});



