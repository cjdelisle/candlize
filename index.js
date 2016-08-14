'use strict';
const Ema = require('boxema');

const POLONIEX = module.exports.POLONIEX = {};
const BITCOINCHARTS = module.exports.BITCOINCHARTS = {};

const poloParser = (handler) => {
    let data = [];
    const onData = (d) => {
        data.push(d);
    };
    const onEnd = () => {
        JSON.parse(data.join('')).filter((x) => (x)).forEach((x) => {
            if (x.globalTradeID || typeof(x.date) !== 'number') {
                throw new Error("Wrong type of data, need returnChartData format");
            }
            handler({
                date: x.date,
                open: x.open,
                high: x.high,
                low: x.low,
                close: x.close
            });
        });
    };
    return {
        onData: onData,
        onEnd: onEnd
    };
};

const bitcoinChartsParser = (handler) => {
    let lingeringLine = '';
    const onData = (data) => {
        const lines = data.split("\n");
        lines[0] = lingeringLine + lines[0];
        lingeringLine = lines.pop();
        lines.filter((x) => (x)).forEach((line) => {
            const trade = line.split(',').map(Number);
            const timestamp = trade[0];
            const price = trade[1];
            const volume = trade[2];
            handler({
                date: timestamp,
                open: price,
                high: price,
                low: price,
                close: price
            });
        });
    };
    const onEnd = () => {
        return onData('\n\n\n');
    };
    return {
        onData: onData,
        onEnd: onEnd
    };
};

const mkReducer = (period, handler) => {
    let candleStartTime = -1;
    let candleEndTime = -1;
    let candleOpen = -1;
    let candleClose = -1;
    let candleHigh = -1;
    let candleLow = -1;
    return (candle) => {
        if (candle.date >= candleEndTime) {
            if (candleStartTime !== -1) {
                handler({
                    date: candleStartTime,
                    open: candleOpen,
                    high: candleHigh,
                    low: candleLow,
                    close: candleClose
                });
            }
            candleStartTime = candle.date - candle.date % period;
            candleEndTime = candleStartTime + period;
            candleOpen = candle.open;
            candleHigh = candle.high;
            candleLow = candle.low;
            candleClose = candle.close;
            return;
        } else if (candle.high > candleHigh) {
            candleHigh = candle.high;
        } else if (candle.low < candleLow) {
            candleLow = candle.low;
        }
        candleClose = candle.close;
    };
};

const getParser = (type) => {
    if (type === BITCOINCHARTS) { return bitcoinChartsParser; }
    if (type === POLONIEX) { return poloParser; }
    throw new Error("invalid parser type");
};

module.exports.create = (conf, handler) => {
    const emas = (conf.ema || []).map((num) => {
        const ema = Ema.create(num);
        ema.name = 'ema' + num;
        return ema;
    });
    const reducer = mkReducer(conf.period || 3600, (candle) => {
        emas.forEach((ema) => {
            candle[ema.name] = ema.update(candle.close);
        });
        handler(candle);
    });
    const parser = getParser(conf.type || BITCOINCHARTS)(reducer);
    return {
        onData: parser.onData,
        onEnd: parser.onEnd
    };
};
