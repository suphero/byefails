const {
  MongoClient
} = require('mongodb')
const {
  MONGODB_URI
} = process.env

// Params
var maxWordsPerHour = 200;
var maxHoursForSingleOrder = 24;
var maxWordsPerSingleOrder = maxHoursForSingleOrder * maxWordsPerHour;

let cachedDb = null

function connectToDatabase(uri) {
  if (cachedDb) {
    console.log('using cached database instance')
    return Promise.resolve(cachedDb)
  }

  console.log('connecting to database')
  return MongoClient.connect(uri).then((db) => {
    console.log('connected')
    cachedDb = db
    return cachedDb
  })
}

exports.handler = async (event, _context, _callback) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === "POST") {
    const params = JSON.parse(event.body);
    setDefaultVariables(params);
    var context = await getContext(params);
    calculateWithContext(context);
    var calculationResult = prepareResult(context);

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(calculationResult)
    };
  } else {
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({Hello: "World"})
    }
  }
};

async function getContext(body) {
  const db = await connectToDatabase(MONGODB_URI);

  var documentTypePromise = db.collection('documenttypes').findOne({
    _id: body.documentType
  });
  var categoryPromise = db.collection('categories').findOne({
    _id: body.category
  });
  var currencyPromise = db.collection('currencies').findOne({
    _id: body.currency
  });
  var extrasPromise = db.collection('extras').find({
    _id: {
      $in: body.extras
    }
  }).toArray();
  var spacingPromise = db.collection('spacings').findOne({
    _id: body.spacing
  });
  var urgencyPromise = db.collection('urgencies').findOne({
    _id: body.urgency
  });

  var results = await Promise.all([documentTypePromise, categoryPromise, currencyPromise, extrasPromise, spacingPromise, urgencyPromise]);

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
  if (!body.documentType) {
    body.documentType = 1;
  }
  if (!body.category) {
    body.category = 1;
  }
  if (!body.currency) {
    body.currency = 'TRY';
  }
  if (!body.extras) {
    body.extras = [];
  }
  if (!body.spacing) {
    body.spacing = 1;
  }
  if (!body.urgency) {
    body.urgency = 1;
  }
  if (!body.numberOfPages) {
    body.numberOfPages = 1;
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

function prepareResult(context) {
  var result = {
    output: context.output
  };
  if (context.input.returnData) {
    result.data = context.data;
  }
  return result;
}

function getPriceText(context) {
  var price = context.output.selectedCurrencyPrice;
  var currency = context.data.currency.icon;

  context.output.price = price + " " + currency;
}

function getSelectedCurrencyPrice(context) {
  var currencyMultiplier = context.data.currency.multiplier;
  var priceInLocalCurrency = context.output.localCurrencyPrice;
  var price = priceInLocalCurrency * currencyMultiplier;
  var precision = context.data.currency.precision;
  var precisionMultiplier = Math.pow(10, precision);

  context.output.selectedCurrencyPrice = Math.round(price * precisionMultiplier) / precisionMultiplier;
}

function getLocalCurrencyPrice(context) {
  var documentTypeMultiplier = context.data.documentType.multiplier;
  var categoryPrice = context.data.category.price;
  var urgencyMultiplier = context.data.urgency.multiplier;
  var spacingMultiplier = context.data.spacing.priceMultiplier;
  var numberOfPages = context.input.numberOfPages;
  var extrasPrice = getExtrasPrice(context);

  var price = categoryPrice * urgencyMultiplier * spacingMultiplier * numberOfPages * documentTypeMultiplier + extrasPrice;

  context.output.localCurrencyPrice = Math.round(price * 100) / 100;
}

function getNumberOfWords(context) {
  var wordsPerPage = context.data.spacing.words;
  var numberOfPages = context.input.numberOfPages;
  var documentTypeMultiplier = context.data.documentType.multiplier;
  context.output.numberOfWords = wordsPerPage * numberOfPages * documentTypeMultiplier;
}

function getExtrasPrice(context) {
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