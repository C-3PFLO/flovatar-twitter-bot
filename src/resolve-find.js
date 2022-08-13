import * as fcl from '@onflow/fcl';

/**
* Execute the FIND.reverseLookup function
* @public
* @param {String} address
* @return {Promise}
*/
function resolve(address) {
    const cadence = `
        import FIND from 0x097bafa4e0b48eef

        pub fun main(address: Address) : String? {
            return FIND.reverseLookup(address)
        }
    `;
    const args = (arg, t) => [arg(address, t.Address)];
    return fcl.query({ cadence, args }).then((response) => {
        // handle nil response
        return Promise.resolve(response === 'nil' ? null : response);
    });
}

export default resolve;
