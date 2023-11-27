import _ from 'lodash';
import moment from 'moment';
import logger from '#utils/logger.js';
import db, { nextSeq } from '#utils/dbutil.js';
import replyModel from '#models/user/reply.model.js';

const product = {
  // 상품 등록
  async create(newProduct){
    logger.trace(arguments);
    newProduct._id = await nextSeq('product');
    newProduct.active = true;
    newProduct.updatedAt = newProduct.createdAt = moment().format('YYYY.MM.DD HH:mm:ss');
    if(!newProduct.dryRun){
      await db.product.insertOne(newProduct);
    }
    return newProduct;
  },

  // 상품 검색
  async findBy({ sellerId, search, sortBy }){
    logger.trace(arguments);
    const query = { active: true, ...search };
    if(sellerId){
      query['seller_id'] = sellerId;
    }else{
      query['show'] = true;
    }
    logger.debug(query);
    const list = await db.product.find(query).project({ content: 0 }).sort(sortBy).toArray();
    logger.debug(list.length, list);
    return list;
  },

  // 상품 상세 조회
  async findById(_id){
    logger.trace(arguments);
    const item = await db.product.findOne({ _id, active: true, show: true });
    if(item){
      item.replies = await replyModel.findByProductId(_id);
    }
    logger.debug(item);
    return item;
  },

  // 상품 상세 조회(단일 속성)
  async findAttrById(_id, attr){
    logger.trace(arguments);
    const item = await db.product.findOne({ _id, active: true, show: true }, { projection: { [attr]: 1, _id: 0 }});
    logger.debug(item);
    return item;
  },
  
  // 상품 수정
  async update(_id, updateProduct){
    logger.trace(arguments);
    updateProduct.updatedAt = moment().format('YYYY.MM.DD HH:mm:ss');
    const result = await db.product.updateOne({ _id, active: true }, { $set: updateProduct });
    logger.debug(result);
    if(result.modifiedCount){
      return updateProduct;
    }else{
      return null;
    }
  },

  // 상품 삭제
  async delete(_id){
    logger.trace(arguments);
    const updatedAt = moment().format('YYYY.MM.DD HH:mm:ss');
    const result = await db.product.findOneAndUpdate({ _id }, { $set: { active: false, updatedAt } });
    logger.debug(result);
    result.active = false;
    return result;
  },
  
};
  

export default product;