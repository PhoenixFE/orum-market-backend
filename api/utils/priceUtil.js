import _ from 'lodash';
import moment from 'moment';
import createError from 'http-errors';

import logger from '#utils/logger.js';
import db, { nextSeq } from '#utils/dbUtil.js';
import productModel from '#models/user/product.model.js';
import replyModel from '#models/user/reply.model.js';
import userModel from '#models/user/user.model.js';
import cartModel from '#models/user/cart.model.js';
import codeUtil from '#utils/codeUtil.js';

const priceUtil = {
  async getCost(user_id, products, clientDiscount = { products: 0, shippingFees: 0 }){

    const sellerBaseShippingFees = {};
    const productArray = _.map(products, '_id');
    const dbProducts = await db.product.find({ _id: { $in: productArray } }).toArray();

    dbProducts.forEach((product) => {
      const beforeShippingFees = sellerBaseShippingFees[product.seller_id];
      product.price = product.price * _.find(products, {_id: product._id}).quantity;
      if(beforeShippingFees === undefined){
        sellerBaseShippingFees[product.seller_id] = product.shippingFees === undefined ? global.config.shippingFees.value : product.shippingFees;
      }else{
        sellerBaseShippingFees[product.seller_id] = Math.max(beforeShippingFees, product.shippingFees === undefined ? global.config.shippingFees.value : product.shippingFees);
      }
    });

    // 할인 전 금액
    const cost = {
      products: _.sumBy(dbProducts, 'price'),
      shippingFees: _.sum(Object.values(sellerBaseShippingFees)),
    };

    // 상품 할인 쿠폰, 배송비 쿠폰 처럼 주문 정보에 포함된 할인 금액


    // 회원 등급별 할인율
    const membershipClass = await userModel.findAttrById(user_id, 'extra.membershipClass');
    const discountRate = codeUtil.getCodeAttr(membershipClass?.extra.membershipClass, 'discountRate');

    const totalDiscount = {
      products: clientDiscount.products + Math.ceil((cost.products - clientDiscount.products) * (discountRate/100) /10) * 10,
      shippingFees: clientDiscount.shippingFees
    };

    const result = {
      ...cost,
      discount: totalDiscount,
      total: cost.products - totalDiscount.products
    };

    // 무료 배송 확인
    if(global.config.freeShippingFees?.value && (result.total >= global.config.freeShippingFees.value)){
      result.discount.shippingFees = cost.shippingFees;
    }

    result.total += cost.shippingFees - result.discount.shippingFees;
    logger.debug(result);
    return result;
  }
};

export default priceUtil;