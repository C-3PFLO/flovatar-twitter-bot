import * as fcl from '@onflow/fcl';

/**
* @public
* @param {String} address
* @param {String} componentId
* @return {Promise}
*/
function getComponentTemplateID(address, componentId) {
    const cadence = `
        import FlovatarComponent from 0x921ea449dffec68a

        pub fun main(address: Address, componentId: UInt64) : UInt64 {
            if let component = FlovatarComponent.getComponent(
                address: address,
                componentId: componentId
            ) {
                return component.templateId
            }
            return 0
        }
    `;
    const args = (arg, t) => [
        arg(address, t.Address),
        arg(componentId, t.UInt64),
    ];
    return fcl.query({ cadence, args }).then((response) => {
        // handle nil response
        return Promise.resolve(response === 0 ? null : response);
    });
}

export {
    getComponentTemplateID,
};
