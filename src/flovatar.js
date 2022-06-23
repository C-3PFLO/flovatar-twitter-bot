import request from 'retry-request';
import sharp from 'sharp';

const debug = require('debug')('flovatar');

// HACK: this is a 1MB asset used to map from a flowID to the corresponding templateID.  This is a tactical solution until the contract is updated to include the templateID directly in the blockchain event.
import FlowIDToTemplateID from './assets/FlovatarComponentTemplate';

let templateIDMap = null;

const IMAGE_BASE_URL = 'https://flovatar.com/api/image/';

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
* @param {String} creatorAddress
* @return {String}
*/
function _getCreatorURL(creatorAddress) {
    return [
        'https://flowscan.org/account',
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
        ' minted' + _getRarity(event.data.metadata) + '.' +
        '\nFlovatar: ' +
        _getFlovatarUrl(
            event.data.metadata.mint,
            event.data.metadata.creatorAddress,
        ) +
        '\nCreator: ' + _getCreatorURL(event.data.metadata.creatorAddress) +
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
        ' purchased for ' + _getPriceString(event.data.price) + ' $FLOW.' +
        '\nFlovatar: ' +
        _getFlovatarUrl(
            event.data.id,
            event.data.to,
        ) +
        '\nBuyer: ' + _getCreatorURL(event.data.to) +
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
        ' purchased for ' + _getPriceString(event.data.price) + ' $FLOW.' +
        '\nComponent: ' +
        _getComponentUrl(
            event.data.id,
            event.data.to,
        ) +
        '\nBuyer: ' + _getCreatorURL(event.data.to) +
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
* Given a flowID from an event blockEventData.id, resolve the corresponding templateID.
* @private
* @param {Integer} flowID
* @return {Integer} templateID
*/
function _resolveTemplateID(flowID) {
    templateIDMap = templateIDMap || JSON.parse(FlowIDToTemplateID);
    const templateID = templateIDMap[flowID];
    return templateID ? parseInt(templateID) : null;
}

/**
 * @public
 * @param {Object} event
 * @return {Promise}
 */
function parseEvent(event) {
    let options;
    switch (event.type) {
    case Events.CREATED:
        options = {
            mediaURL: 'http://images.flovatar.com/flovatar/gif/' + event.data.metadata.mint + '.gif',
            // mediaURL: IMAGE_BASE_URL + event.data.metadata.mint,
            mimeType: 'gif',
            body: '[THIS IS A TEST]' + _buildFlovatarCreatedMessage(event),
        };
        break;
    case Events.FLOVATAR_PURCHASED:
        options = {
            mediaURL: IMAGE_BASE_URL + event.data.id,
            mimeType: 'png',
            body: _buildFlovatarPurchasedMessage(event),
        };
        break;
    case Events.FLOVATAR_COMPONENT_PURCHASED:
        event.data.templateID = _resolveTemplateID(event.data.id);
        options = {
            mediaURL: IMAGE_BASE_URL + 'template/' + event.data.templateID,
            mimeType: 'png',
            body: _buildFlovatarComponentPurchasedMessage(event),
        };
        break;
    default:
        break;
    }
    return _requestMedia(options.mediaURL)
        .then(_svgToPng)
        .then((response) => {
            return Promise.resolve({
                media: response,
                body: options.body,
            });
        });
}

export {
    Events,
    parseEvent,
};
