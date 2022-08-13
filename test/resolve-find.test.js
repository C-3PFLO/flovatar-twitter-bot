import * as fcl from '@onflow/fcl';
import resolveFind from '../src/resolve-find';

describe('resolve-find', () => {
    beforeEach(() => {
        fcl.config({
            'accessNode.api': 'https://mainnet.onflow.org',
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('nominal', (done) => {
        resolveFind('0x16ae8f1cbfceaa9e').then((response) => {
            expect(response).toEqual('c-3pflo');
        }).then(done).catch(done);
    });
    it('no address', (done) => {
        resolveFind('0x571ceb2395dfe1e4').then((response) => {
            expect(response).toEqual(null);
        }).then(done).catch(done);
    });
});
