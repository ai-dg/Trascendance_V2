import fastify from 'fastify';
import view from '@fastify/view';
import ejs from 'ejs';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let base_url = "localhost:8080";
const is_prod = process.env.NODE_ENV === "PROD"




const app = fastify();

app.register(fastifyStatic, {
  root: join(__dirname, 'srcs/public'),
  prefix: '/public/',
});

app.register(view, {
  engine: { ejs },
  root: join(__dirname, 'srcs/views')
});


function loadTranslations(lang = 'en') {
  const filePath = join(__dirname, `srcs/locales/${lang}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath));
  } else {
    return JSON.parse(fs.readFileSync(join(__dirname, 'srcs/locales/en.json')));
  }
}

app.get('/', (req, reply) => {
  const lang = req.query.lang || 'en';
  const text = loadTranslations(lang);
  reply.view('index.ejs', { text, lang, base_url });
});

app.get('/api/translations', (req, reply) => {
  const lang = req.query.lang || 'en';
  const text = loadTranslations(lang);
  reply.send({ text, lang });
});



const start = async () => {
  try {
    await app.listen({ port: 3005, host: '0.0.0.0' });
    console.log('server-rendering service running');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
start();