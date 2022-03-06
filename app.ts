import 'dotenv/config'
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as Router from '@koa/router';
import clientPromise, { ObjectId } from './libs/db';
import logger from './utils/logger';

const app = new Koa();
const router = new Router();
app.use(bodyParser());

// error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      success: false,
      message: err.message,
      code: err.code,
    };

    logger.error(err);
  }
});

router.get('/api/links', async (ctx, next) => {
  const { id } = ctx.query;

  const client = await clientPromise;
  const document = await client
    .db()
    .collection('links')
    .findOne({ _id: new ObjectId(id as string) }, { projection: { _id: 0 } });

  if (!document) {
    // TODO: 에러 처리
    throw new Error('Not Found');
  }

  ctx.body = { success: true, data: { id, ...document } };
});

router.post('/api/links', async (ctx, next) => {
  const { url, contents, correct } = ctx.request.body;

  const client = await clientPromise;
  const { insertedId } = await client.db().collection('links').insertOne({
    url,
    contents,
    correct,
    createdAt: Date.now(),
  });

  if (!insertedId) {
    // TODO: 에러 처리
    throw new Error('Insert Fail');
  }

  ctx.body = { success: true, data: insertedId  };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
  console.log('listening to port', 3000);
});