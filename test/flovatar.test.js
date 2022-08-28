import * as flovatar from '../src/flovatar';

import request from 'retry-request';
import sharp from 'sharp';
import resolveFind from '../src/resolve-find';
import { getComponentTemplateID } from '../src/flovatar-cadence';

import FlovatarCreated from './assets/Flovatar.Created.54057850';
import FlovatarPurchased from './assets/FlovatarMarketplace.FlovatarPurchased.54386412';
import FlovatarComponentPurchased from './assets/FlovatarMarketplace.FlovatarComponentPurchased.54395614';

jest.mock('retry-request');
jest.mock('sharp');
jest.mock('../src/resolve-find');
jest.mock('../src/flovatar-cadence');

const mockSharp = {
    resize: function() {
        return {
            png: function() {
                return {
                    toBuffer: function() {
                        return 'media';
                    },
                };
            },
        };
    },
};

describe('flovatar', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('parse', () => {
        it('Events.CREATED', (done) => {
            request.mockImplementationOnce((url, options, callback) => {
                expect(url).toEqual('https://images.flovatar.com/flovatar/png/400.png');
                callback(null, { statusCode: 200 }, 'some-response');
            });
            resolveFind.mockImplementationOnce((address) => {
                expect(address).toEqual('0xe2ac87664d523884');
                return Promise.resolve('its-me');
            });
            flovatar.parse(JSON.parse(FlovatarCreated)[0])
                .then((response) => {
                    expect(sharp).not.toHaveBeenCalled();
                    expect(response).toEqual({
                        media: 'some-response',
                        body:
                            'A Flovatar is born! #400 minted by its-me [2 rare, 1 epic booster(s)].\n' +
                            'Flovatar: https://flovatar.com/flovatars/400/0xe2ac87664d523884\n' +
                            'Creator: https://find.xyz/its-me\n' +
                            'Transaction: https://flowscan.org/transaction/f0de372287d2125448d2e0114eb6f892d250c5a50fb12d96756baf29a3f9f4d7\n' +
                            '#Flovatar #FlovatarDroid #FlovatarCreated',
                    });
                    done();
                });
        });
        it('Events.FLOVATAR_PURCHASED', (done) => {
            request.mockImplementationOnce((url, options, callback) => {
                expect(url).toEqual('https://images.flovatar.com/flovatar/png/569.png');
                callback(null, { statusCode: 200 }, 'some-response');
            });
            resolveFind.mockImplementationOnce((address) => {
                expect(address).toEqual('0x50f56c66e76b9382');
                return Promise.resolve('its-me');
            });
            flovatar.parse(JSON.parse(FlovatarPurchased)[0])
                .then((response) => {
                    expect(sharp).not.toHaveBeenCalled();
                    expect(response).toEqual({
                        media: 'some-response',
                        body:
                            'Flovatar #569 purchased by its-me for 500 $FLOW.\n' +
                            'Flovatar: https://flovatar.com/flovatars/569/0x50f56c66e76b9382\n' +
                            'Buyer: https://find.xyz/its-me\n' +
                            'Transaction: https://flowscan.org/transaction/6a68b28e2b9a1b25cc4af9ced2613b22b1f2745d505b5fe4e7c483e3da144349\n' +
                            '#Flovatar #FlovatarDroid #FlovatarPurchased',
                    });
                    done();
                });
        });
        it('Events.FLOVATAR_COMPONENT_PURCHASED', (done) => {
            request.mockImplementationOnce((url, options, callback) => {
                expect(url).toEqual('https://flovatar.com/api/image/template/75');
                callback(null, { statusCode: 200 }, 'some-response');
            });
            sharp.mockImplementationOnce((buffer) => {
                expect(buffer).toEqual(new Buffer.from('some-response')); // eslint-disable-line
                return mockSharp;
            });
            resolveFind.mockImplementationOnce((address) => {
                expect(address).toEqual('0xcecf0384aaf3dcd7');
                return Promise.resolve(null);
            });
            getComponentTemplateID.mockImplementationOnce(
                (address, componentID) => {
                    expect(address).toEqual('0xcecf0384aaf3dcd7');
                    return Promise.resolve(75);
                });
            flovatar.parse(JSON.parse(FlovatarComponentPurchased)[0])
                .then((response) => {
                    expect(response).toEqual({
                        media: 'media',
                        body:
                            'Component #23296 purchased for 500 $FLOW.\n' +
                            'Component: https://flovatar.com/components/23296/0xcecf0384aaf3dcd7\n' +
                            'Buyer: https://flowscan.org/account/0xcecf0384aaf3dcd7\n' +
                            'Transaction: https://flowscan.org/transaction/1e261f27ea3c9fd4fb2b08a3c843cf5e09089394214c6003f373d327b6adc3c8\n' +
                            '#Flovatar #FlovatarDroid #ComponentPurchased',
                    });
                    done();
                });
        });
    });
});
