module.exports = (app) => {
  const order = require('../controllers/order.controller.js');

  app.post('/order/calculate', order.calculate);
}