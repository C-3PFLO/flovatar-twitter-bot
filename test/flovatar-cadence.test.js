import * as fcl from '@onflow/fcl';
import { getComponentTemplateID } from '../src/flovatar-cadence';

describe('flovatar-component', () => {
    beforeEach(() => {
        fcl.config({
            'accessNode.api': 'https://mainnet.onflow.org',
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    // HACK: These tests will fail if '0x16ae8f1cbfceaa9e' no longer holds
    // any of these components
    it('spark', (done) => {
        getComponentTemplateID('0x16ae8f1cbfceaa9e', 61721).then((response) => {
            expect(response).toEqual(458);
        }).then(done).catch(done);
    });
    xit('booster', (done) => {
        getComponentTemplateID('0x16ae8f1cbfceaa9e', 13534).then((response) => {
            expect(response).toEqual(73);
        }).then(done).catch(done);
    });
    xit('flobit', (done) => {
        getComponentTemplateID('0x16ae8f1cbfceaa9e', 79254).then((response) => {
            expect(response).toEqual(509);
        }).then(done).catch(done);
    });
    it('address not found', (done) => {
        getComponentTemplateID('0x0000000000000000', 61721).then((response) => {
            expect(response).toEqual(null);
        }).then(done).catch(done);
    });
    it('componentId not found', (done) => {
        getComponentTemplateID('0x16ae8f1cbfceaa9e', 1).then((response) => {
            expect(response).toEqual(null);
        }).then(done).catch(done);
    });
});
