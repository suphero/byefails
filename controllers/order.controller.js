const Category = require('../models/category.model');
const Currency = require('../models/currency.model');
const Extra = require('../models/extra.model');
const Spacing = require('../models/spacing.model');
const Urgency = require('../models/urgency.model');

// Params
var maxWordsPerHour = 200;
var maxHoursForSingleOrder = 24;
var maxWordsPerSingleOrder = maxHoursForSingleOrder * maxWordsPerHour;

exports.calculate = async (req, res) => {
  var context = await getContext(req.body);
  var calculationResult = calculateWithContext(context);

  res.send(calculationResult);
};

async function getContext(body) {
  var categoryPromise = getCategory(body.category);
  var currencyPromise = getCurrency(body.currency);
  var extrasPromise = getExtras(body.extras);
  var spacingPromise = getSpacing(body.spacing);
  var urgencyPromise = getUrgency(body.urgency);

  var results = await Promise.all([categoryPromise, currencyPromise, extrasPromise, spacingPromise, urgencyPromise]);

  return {
    body: body,
    category: results[0],
    currency: results[1],
    extras: results[2],
    spacing: results[3],
    urgency: results[4]
  }
}

function calculateWithContext(context) {
  context.output = {};
  
  getLocalCurrencyPrice(context);
  getSelectedCurrencyPrice(context);
  getPriceText(context);
  getNumberOfWords(context);
  getMaxPages(context);

  return context.output;
}

function getPriceText(context) {
  var price = context.output.selectedCurrencyPrice;
  var currency = context.body.currency;

  context.output.price = price + " " + currency;
}

function getSelectedCurrencyPrice(context) {
  var currencyMultiplier = context.currency.multiplier;
  var priceInLocalCurrency = context.output.localCurrencyPrice;
  var price = priceInLocalCurrency * currencyMultiplier;

  context.output.selectedCurrencyPrice = Math.round(price * 100) / 100;
}

function getLocalCurrencyPrice(context) {
  var categoryPrice = context.category.price;
  var urgencyCost = context.urgency.price;
  var spacingMultiplier = context.spacing.priceMultiplier;
  var numberOfPages = context.body.numberOfPages;
  var extrasPrice = getExtrasPrice(context);

  var price = (categoryPrice + urgencyCost) * spacingMultiplier * numberOfPages + extrasPrice;

  context.output.localCurrencyPrice = Math.round(price * 100) / 100;
}

function getNumberOfWords(context) {
  var wordsPerPage = context.spacing.words;
  var numberOfPages = context.body.numberOfPages;
  context.output.numberOfWords = wordsPerPage * numberOfPages;
}

function getExtrasPrice(context) {
  var value = 0;
  Array.prototype.forEach.call(context.extras, extra => {
    var extraPrice = extra.perPage ? extra.price * context.body.numberOfPages : extra.price;
    value += extraPrice;
  });
  return value;
}

function getMaxPages(context) {
  var urgency = context.urgency;
  var spacing = context.spacing;

  var remainingHours = urgency.hours;
  var wordsPerPage = spacing.words;
  var notMinifiedMaxWords = remainingHours * maxWordsPerHour;
  var maxWords = Math.min(notMinifiedMaxWords, maxWordsPerSingleOrder);

  context.output.maxPages = Math.round(maxWords / wordsPerPage);
}

async function getCategory(category) {
  return await Category.findById(category);
}

async function getCurrency(currency) {
  return await Currency.findById(currency)
}

async function getSpacing(spacing) {
  return await Spacing.findById(spacing);
}

async function getUrgency(urgency) {
  return await Urgency.findById(urgency);
}

async function getExtras(extras) {
  return await Extra.find({_id : {$in : extras}});
}