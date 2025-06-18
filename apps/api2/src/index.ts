import { Elysia } from "elysia";
import v1Router from "./routes/v1";

const app = new Elysia();

app.get('/', () => {
  return 'Hello World';
})
.use(v1Router)

app.listen(3500)
.onStart(() => {
  console.log('Server is running on port 3500');
});

app.onError(({ error, code }) => {
  console.error(error);
  return {
    success: false,
    code: code
  };
});