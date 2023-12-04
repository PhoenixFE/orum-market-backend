import logger from './logger.js';
import { db as DBConfig } from '../config/index.js';
import { MongoClient } from 'mongodb';
import _ from 'lodash';
import codeutil from '#utils/codeutil.js';

var db;

var url;
if (process.env.NODE_ENV === 'production') {
  url = process.env.CLOUD_DB;
} else {
  url =
    'mongodb+srv://lion:lion@cluster0.vzsl9if.mongodb.net/?retryWrites=true&w=majority';
}

logger.log(`DB 접속: ${url}`);
const client = new MongoClient(url);

try {
  await client.connect();
  logger.info(`DB 접속 성공: ${url}`);
  db = client.db(DBConfig.database);
  db.user = db.collection('user');
  db.product = db.collection('product');
  db.cart = db.collection('cart');
  db.order = db.collection('order');
  db.reply = db.collection('reply');
  db.seq = db.collection('seq');
  db.code = db.collection('code');
  db.bookmark = db.collection('bookmark');
  db.config = db.collection('config');

  await codeutil.initCode(db);

  await codeutil.initConfig(db);
} catch (err) {
  logger.error(err);
}

export const getDB = () => db;

export const getClient = () => client;

export const nextSeq = async (_id) => {
  let result = await db.seq.findOneAndUpdate({ _id }, { $inc: { no: 1 } });
  logger.debug(_id, result.no);
  return result.no;
};

export default db;
