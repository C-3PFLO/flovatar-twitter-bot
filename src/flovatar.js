import request from 'retry-request';
import sharp from 'sharp';

import resolveFind from './resolve-find';
import { getComponentTemplateID } from './flovatar-cadence';

const debug = require('debug')('flovatar');

const FLOVATAR_IMAGE_BASE_URL = 'https://images.flovatar.com/flovatar/png/';
const COMPONENT_IMAGE_BASE_URL = 'https://flovatar.com/api/image/';

const Events = {
    CREATED: 'A.921ea449dffec68a.Flovatar.Created',
    FLOVATAR_PURCHASED: 'A.921ea449dffec68a.FlovatarMarketplace.FlovatarPurchased',
    FLOVATAR_COMPONENT_PURCHASED: 'A.921ea449dffec68a.FlovatarMarketplace.FlovatarComponentPurchased',
};

/**
* Get rarity/booster string
* @private
* @param {Object} metadata
* @return {String} rarity string
*/
function _getRarity(metadata) {
    const boosters = [];
    if (metadata.rareCount > 0) {
        boosters.push(metadata.rareCount + ' rare');
    }
    if (metadata.epicCount > 0) {
        boosters.push(metadata.epicCount + ' epic');
    }
    if (metadata.legendaryCount > 0) {
        boosters.push(metadata.legendaryCount + ' legendary');
    }
    return boosters.length > 0 ?
        ' [' + boosters.join(', ') + ' booster(s)]' : '';
}

/**
* TO DO
* @private
* @param {Object} options
* @return {String}
*/
function _getAddressURL(options) {
    return options.resolvedAddress ?
        'https://find.xyz/' + options.resolvedAddress :
        'https://flowscan.org/account/' + options.address;
}

/**
* TO DO
* @private
* @param {String} mint
* @param {String} creatorAddress
* @return {String}
*/
function _getFlovatarUrl(mint, creatorAddress) {
    return [
        'https://flovatar.com/flovatars',
        mint,
        creatorAddress,
    ].join('/');
}

/**
* TO DO
* @private
* @param {String} mint
* @param {String} creatorAddress
* @return {String}
*/
function _getComponentUrl(mint, creatorAddress) {
    return [
        'https://flovatar.com/components',
        mint,
        creatorAddress,
    ].join('/');
}

/**
* TO DO
* @private
* @param {String} transactionId
* @return {String}
*/
function _getTransactionURL(transactionId) {
    return [
        'https://flowscan.org/transaction',
        transactionId,
    ].join('/');
}

/**
* TO DO
* @private
* @param {Float} price
* @return {Float}
*/
function _getPriceString(price) {
    return Math.round(price * 100) / 100;
}

/**
 * Builds a message (intended for use in a tweet body) from a Created event
 * @private
 * @param {Object} event
 * @return {String} message
 */
function _buildFlovatarCreatedMessage(event) {
    return 'A Flovatar is born! #' + event.data.metadata.mint +
        ' minted' +
        (event.resolvedAddress ? ' by ' + event.resolvedAddress : '') +
        _getRarity(event.data.metadata) + '.' +
        '\nFlovatar: ' +
        _getFlovatarUrl(
            event.data.metadata.mint,
            event.data.metadata.creatorAddress,
        ) +
        '\nCreator: ' + _getAddressURL(event) +
        '\nTransaction: ' + _getTransactionURL(event.transactionId) +
        '\n#Flovatar #FlovatarDroid #FlovatarCreated';
}

/**
 * Builds a message (intended for use in a tweet body) from a FlovatarPurchased event
 * @private
 * @param {Object} event
 * @return {String} message
 */
function _buildFlovatarPurchasedMessage(event) {
    return 'Flovatar #' + event.data.id +
        ' purchased' +
        (event.resolvedAddress ? ' by ' + event.resolvedAddress : '') +
        ' for ' + _getPriceString(event.data.price) + ' $FLOW.' +
        '\nFlovatar: ' +
        _getFlovatarUrl(
            event.data.id,
            event.data.to,
        ) +
        '\nBuyer: ' + _getAddressURL(event) +
        '\nTransaction: ' + _getTransactionURL(event.transactionId) +
        '\n#Flovatar #FlovatarDroid #FlovatarPurchased';
}

/**
 * Builds a message (intended for use in a tweet body) from a FlovatarComponentPurchased event
 * @private
 * @param {Object} event
 * @return {String} message
 */
function _buildFlovatarComponentPurchasedMessage(event) {
    return 'Component #' + event.data.id +
        ' purchased' +
        (event.resolvedAddress ? ' by ' + event.resolvedAddress : '') +
        ' for ' + _getPriceString(event.data.price) + ' $FLOW.' +
        '\nComponent: ' +
        _getComponentUrl(
            event.data.id,
            event.data.to,
        ) +
        '\nBuyer: ' + _getAddressURL(event) +
        '\nTransaction: ' + _getTransactionURL(event.transactionId) +
        '\n#Flovatar #FlovatarDroid #ComponentPurchased';
}

/**
 * @private
 * @param {String} url
 * @return {Promise}
 */
function _requestMedia(url) {
    const retryOptions = {
        // will not retry 404 errors by default, but our most common error is
        // the requested resource isn't ready yet so it is a 404 response
        shouldRetryFn: function(response) {
            return response.statusMessage !== 'OK' ||
                response.statusCode !== 200;
        },
    };
    return new Promise(function(resolve, reject) {
        debug('requesting %s', url);
        request(url, retryOptions, (error, response, html) => {
            if (!error && response.statusCode == 200) {
                resolve(html);
            } else {
                reject(error);
            }
        });
    });
}

/**
 * Convert SVG to PNG
 * @private
 * @param {String} svg data
 * @return {Promise}
 */
function _svgToPng(svg) {
    return Promise.resolve(
        sharp(new Buffer.from( // eslint-disable-line
            svg,
        ))
            .resize(800)
            .png()
            .toBuffer(),
    );
}

/**
 * @public
 * @param {Object} event
 * @return {Promise}
 */
function parse(event) {
    const options = Object.assign({}, event);
    switch (event.type) {
    case Events.CREATED:
        options.address = event.data.metadata.creatorAddress;
        options.mediaURL = FLOVATAR_IMAGE_BASE_URL + event.data.metadata.mint + '.png';
        options.bodyFunction = _buildFlovatarCreatedMessage;
        break;
    case Events.FLOVATAR_PURCHASED:
        options.address = event.data.to;
        options.mediaURL = FLOVATAR_IMAGE_BASE_URL + event.data.id + '.png';
        options.bodyFunction = _buildFlovatarPurchasedMessage;
        break;
    case Events.FLOVATAR_COMPONENT_PURCHASED:
        options.address = event.data.to;
        options.componentID = event.data.id;
        options.svgToPng = true;
        options.bodyFunction = _buildFlovatarComponentPurchasedMessage;
        break;
    default:
        break;
    }

    return resolveFind(options.address)
        .then((response) => {
            if (response) {
                options.resolvedAddress = response;
            }
        }).then(() => {
            if (options.componentID) {
                return getComponentTemplateID(
                    options.address,
                    options.componentID,
                ).then((templateID) => {
                    if (templateID) {
                        options.mediaURL = COMPONENT_IMAGE_BASE_URL +
                            'template/' + templateID;
                    }
                });
            }
        }).then(() => {
            if (options.mediaURL) {
                return _requestMedia(options.mediaURL)
                    .then((media) => {
                        if (options.svgToPng) {
                            return _svgToPng(media);
                        }
                        return Promise.resolve(media);
                    });
            }
            return Promise.resolve(null);
        })
        .then((response) => {
            return Promise.resolve({
                media: response,
                body: options.bodyFunction(options),
            });
        });
}

export {
    Events,
    parse,
};
