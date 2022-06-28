/* global process */

import * as fcl from '@onflow/fcl';
import { subscribeToEvents } from 'fcl-subscribe';
import * as flovatar from './flovatar';

// https://github.com/plhery/node-twitter-api-v2/blob/HEAD/doc/basics.md
import { TwitterApi } from 'twitter-api-v2';

const debug = require('debug')('flovatar-twitter-bot');

const client = new TwitterApi({
    appKey: process.env.API_KEY,
    appSecret: process.env.APP_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_SECRET,
});

/**
 * Parse command-line arguments
 * @private
 * @param {Object} argv
 * @return {Object} options
 */
function _parseArgs(argv) {
    const options = {};
    let arg = null;
    // first two arguments are path to node and the script
    for (let i=2; i < argv.length; i++) {
        arg = argv[i].split('=');
        if (arg && arg.length === 2) {
            options[arg[0]] =
                // parse String numbers to be integers
                (isNaN(arg[1]) ? arg[1] : parseInt(arg[1]));
        }
    }
    return options;
}

/**
 * @private
 * @param {Object} options
 * @return {Promise}
 */
function _uploadMedia(options) {
    if (options.media) {
        debug('uploading media');
        return client.v1.uploadMedia(
            options.media,
            { type: 'png' },
        ).then((mediaID) => {
            options.mediaID = mediaID;
            return Promise.resolve(options);
        });
    }
    return Promise.resolve(options);
}

/**
 * @private
 * @param {Object} options
 * @return {Promise}
 */
function _tweet(options) {
    debug('%O', options);
    return client.v2.tweet(
        options.body,
        options.mediaID ? {
            media: {
                media_ids: [options.mediaID],
            },
        } : {},
    );
}

/**
* Run program
* @public
*/
function main() {
    // parse command line arguments
    const options = _parseArgs(process.argv);
    debug('initializing for options: %O', options);

    fcl.config({
        'accessNode.api': 'https://mainnet.onflow.org',
    });

    options.fcl = fcl;
    options.events = [
        flovatar.Events.CREATED,
        flovatar.Events.FLOVATAR_PURCHASED,
        flovatar.Events.FLOVATAR_COMPONENT_PURCHASED,
    ];
    options.onEvent = function(event) {
        debug('onEvent %s', event.type);
        // HACK: need to move this
        if (event.type !== flovatar.Events.FLOVATAR_COMPONENT_PURCHASED ||
            event.data.price >= 50) {
            return flovatar.parse(event)
                .then(_uploadMedia)
                .then(_tweet);
        } else {
            debug(
                'skipping %s, price = %d',
                event.type,
                event.data.price,
            );
            return Promise.resolve();
        }
    };
    options.onError = function(error) {
        debug('%O', error);
    };

    subscribeToEvents(options);
}

main();
