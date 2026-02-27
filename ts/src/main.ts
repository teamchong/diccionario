import { createServer } from './server.js';

const port = Number(process.env.PORT ?? 5001);

const app = createServer();

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
