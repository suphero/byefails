const DocumentType = require('../models/documentType.model');
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
  setDefaultVariables(req.body);
  var context = await getContext(req.body);
  calculateWithContext(context);
  var calculationResult = prepareResult(context);

  res.send(calculationResult);
};

async function getContext(body) {
  var documentTypePromise = getDocumentType(body.documentType);
  var categoryPromise = getCategory(body.category);
  var currencyPromise = getCurrency(body.currency);
  var extrasPromise = getExtras(body.extras);
  var spacingPromise = getSpacing(body.spacing);
  var urgencyPromise = getUrgency(body.urgency);

  var results = await Promise.all([documentTypePromise, categoryPromise, currencyPromise, extrasPromise, spacingPromise, urgencyPromise]);
  console.log(results);

  var data = {
    documentType: results[0],
    category: results[1],
    currency: results[2],
    extras: results[3],
    spacing: results[4],
    urgency: results[5],
  };

  return {
    input: body,
    data
  }
}

function setDefaultVariables(body) {
  if (!body.documentType) { body.documentType = 1; }
  if (!body.category) { body.category = 1; }
  if (!body.currency) { body.currency = 'USD'; }
  if (!body.extras) { body.extras = []; }
  if (!body.spacing) { body.spacing = 1; }
  if (!body.urgency) { body.urgency = 1; }
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

function prepareResult(context) {
  var result = { output: context.output };
  if (context.input.returnData) {
    result.data = context.data;
  }
  return result;
}

function getPriceText(context) {
  var price = context.output.selectedCurrencyPrice;
  var currency = context.input.currency;

  context.output.price = price + " " + currency;
}

function getSelectedCurrencyPrice(context) {
  var currencyMultiplier = context.data.currency.multiplier;
  var priceInLocalCurrency = context.output.localCurrencyPrice;
  var price = priceInLocalCurrency * currencyMultiplier;

  context.output.selectedCurrencyPrice = Math.round(price * 100) / 100;
}

function getLocalCurrencyPrice(context) {
  var documentTypeMultiplier = context.data.documentType.multiplier;
  var categoryPrice = context.data.category.price;
  var urgencyCost = context.data.urgency.price;
  var spacingMultiplier = context.data.spacing.priceMultiplier;
  var numberOfPages = context.input.numberOfPages;
  var extrasPrice = getExtrasPrice(context);

  var price = (categoryPrice + urgencyCost) * spacingMultiplier * numberOfPages * documentTypeMultiplier + extrasPrice;

  context.output.localCurrencyPrice = Math.round(price * 100) / 100;
}

function getNumberOfWords(context) {
  var wordsPerPage = context.data.spacing.words;
  var numberOfPages = context.input.numberOfPages;
  var documentTypeMultiplier = context.data.documentType.multiplier;
  context.output.numberOfWords = wordsPerPage * numberOfPages * documentTypeMultiplier;
}

function getExtrasPrice(context) {
  var value = 0;
  Array.prototype.forEach.call(context.data.extras, extra => {
    var extraPrice = extra.perPage ? extra.price * context.input.numberOfPages : extra.price;
    value += extraPrice;
  });
  return value;
}

function getMaxPages(context) {
  var remainingHours = context.data.urgency.hours;
  var wordsPerPage = context.data.spacing.words;
  var documentTypeMultiplier = context.data.documentType.multiplier;
  var notMinifiedMaxWords = remainingHours * maxWordsPerHour;
  var maxWords = Math.min(notMinifiedMaxWords, maxWordsPerSingleOrder);

  context.output.maxPages = Math.round(maxWords / (wordsPerPage * documentTypeMultiplier));
}

async function getDocumentType(documentType){
  return await DocumentType.findById(documentType);
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