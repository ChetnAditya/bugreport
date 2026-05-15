import { createApp } from './app';
import { env } from './env';

const app = createApp();
app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`server listening on 0.0.0.0:${env.PORT}`);
});
