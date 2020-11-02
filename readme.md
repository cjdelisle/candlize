# Candlize

Status: stable+unmaintained - open an issue if you would like to take over

Parse different types of trading data into candle format with optional Exponential Moving Average added.
This script handles inputs in the format from bitcoincharts and in the format from poloniex.
More formats might be added in the future.

To use with BitcoinCharts, collect hourly candles and add exponential moving averages on 8, 32 and
41 hour periods:

```bash
wget http://api.bitcoincharts.com/v1/csv/okcoinCNY.csv.gz
cat ./okcoinCNY.csv.gz | gzip -d | candlizer --period 3600 --ema 8,32,41 > ./okcoinCNY-hourly-ema8-32-41.candles
```

For handling poloniex format, you must pass `--intype poloniex` and the content must be from the
returnChartData API request.

```bash
curl 'https://poloniex.com/public?command=returnChartData&currencyPair=BTC_ETC&start=0&end=9999999999&period=14400' > poloniex_etc.json
cat poloniex_etc.json | candlizer --period 3600 --ema 8,32,41 > ./poloniex_etc-hourly-ema8-32-41.candles
```

The format of the candles is as follows:
```json
{
    "date":1469332800,
    "open":0.00995001,
    "high":0.01,
    "low":0.00010098,
    "close":0.00194901,
    "ema8":0.00014014030141377024,
    "ema32":0.000035352665436410106,
    "ema41":0.000027608722724691292
}
```

## API Usage

```javascript
const Candlize = require('candlize');
const conf = {
    period: 3600,
    intype: Candlize.BITCOINCHARTS,
    ema: [8, 32, 41]
};
const candalizer = Candlize.create(conf, (out) => {
    console.log(JSON.stringify(out));
});
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', candalizer.onData);
process.stdin.on('end', candalizer.onEnd);
```
