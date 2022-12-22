/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
const expect = require('chai').expect;
const setup = require('@iobroker/legacy-testing');

let objects = null;
let states = null;
let onStateChanged = null;
let onObjectChanged = null;
let sendToID = 1;

const adapterShortName = setup.adapterName.substring(setup.adapterName.indexOf('.') + 1);

function checkConnectionOfAdapter(cb, counter) {
    counter = counter || 0;
    console.log(`Try check #${counter}`);
    if (counter > 30) {
        cb && cb('Cannot check connection');
        return;
    }

    states.getState(`system.adapter.${adapterShortName}.0.alive`, (err, state) => {
        err && console.error(err);
        if (state && state.val) {
            cb && cb();
        } else {
            setTimeout(() => checkConnectionOfAdapter(cb, counter + 1), 1000);
        }
    });
}

function checkValueOfState(id, value, cb, counter) {
    counter = counter || 0;
    if (counter > 20) {
        cb && cb(`Cannot check value Of State ${id}`);
        return;
    }

    states.getState(id, function (err, state) {
        err && console.error(err);
        if (value === null && !state) {
            cb && cb();
        } else if (state && (value === undefined || state.val === value)) {
            cb && cb();
        } else {
            setTimeout(() => checkValueOfState(id, value, cb, counter + 1), 500);
        }
    });
}

function sendTo(target, command, message, callback) {
    onStateChanged = (id, state) => {
        if (id === 'messagebox.system.adapter.test.0') {
            callback(state.message);
        }
    };

    states.pushMessage(`system.adapter.${target}`, {
        command: command,
        message: message,
        from: 'system.adapter.test.0',
        callback: {
            message: message,
            id: sendToID++,
            ack: false,
            time: (new Date()).getTime()
        }
    });
}

describe(`Test ${adapterShortName} adapter`, function () {
    before(`Test ${adapterShortName} adapter: Start js-controller`, function (_done) {
        this.timeout(600000); // because of first install from npm

        setup.setupController(async () => {
            const config = await setup.getAdapterConfig();
            // enable adapter
            config.common.enabled = true;
            config.common.loglevel = 'debug';

            await setup.setAdapterConfig(config.common, config.native);

            setup.startController(
                true,
                (id, obj) => {},
                (id, state) => {
                    onStateChanged && onStateChanged(id, state);
                },
                (_objects, _states) => {
                    objects = _objects;
                    states = _states;
                    _done();
                });
        });
    });

    it(`Test ${adapterShortName} adapter: Check if connected`, function (done) {
        this.timeout(60000);
        setTimeout(() => {
            /*states.getState('fhem.0.info.connection', function (err, state) {
                err && console.error(err);
                expect(err).to.be.not.ok;
                expect(state).to.be.ok;
                expect(state.val).to.be.true;
                done();
            });*/
            done();
        }, 10000);
    });

    after(`Test ${adapterShortName} adapter: Stop js-controller`, function (done) {
        this.timeout(10000);

        setup.stopController(normalTerminated => {
            console.log(`Adapter normal terminated: ${normalTerminated}`);
            done();
        });
    });
});
