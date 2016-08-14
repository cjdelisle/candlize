const Candalizer = require('./index');

const typeForName = {
    poloniex: Candalizer.POLONIEX,
    polo: Candalizer.POLONIEX,
    POLONIEX: Candalizer.POLONIEX,
    bitcoincharts: Candalizer.BITCOINCHARTS,
    BITCOINCHARTS: Candalizer.BITCOINCHARTS
};

const usage = () => {
    console.log('candlize [--period <N>] [--intype <poloniex|bitcoincharts>] [--ema 8[,32[,...]]]');
    console.log('        candalize reads data from stdin and writes result to stdout');
    console.log('        --period the number of seconds per candle');
    console.log('        --intype the format of the data which is being passed to candalize');
    console.log('                 intype poloniex is result of returnChartData from poloniex api');
    console.log('        --ema a comma separated list of moving averages to add');
    console.log('example: candlize --period 300 --intype bitcoincharts --ema 8,32,41,51 < ' +
        './raw > ./candles');
};

const getConf = (argv) => {
    const conf = {
        period: 3600,
        type: Candalizer.BITCOINCHARTS,
        ema: []
    };

    if (argv.indexOf('--help') !== -1) {
        usage();
        process.exit(0);
    }

    const pi = argv.indexOf('--period');
    if (pi > -1) {
        conf.period = Number(argv[pi + 1]);
        if (isNaN(conf.period)) { throw new Error("period is not a number"); }
    }

    const intypei = argv.indexOf('--intype');
    if (intypei > -1) {
        conf.type = typeForName[argv[intypei + 1]];
        if (!conf.type) {
            throw new Error("invalid intype, must be one of " +
                JSON.stringify(Object.keys(typeForName)));
        }
    }

    const emai = argv.indexOf('--ema');
    if (emai > -1) {
        conf.ema = argv[emai + 1].split(',').filter((x)=>(x)).map(Number);
        conf.ema.forEach((x) => {
            if (isNaN(x)) { throw new Error("--ema must be comma separated numbers only"); }
        });
    }
    return conf;
};

const main = (argv) => {
    const conf = getConf(argv);
    const candalizer = Candalizer.create(conf, (out) => {
        console.log(JSON.stringify(out));
    });
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', candalizer.onData);
    process.stdin.on('end', candalizer.onEnd);
};
main(process.argv);
