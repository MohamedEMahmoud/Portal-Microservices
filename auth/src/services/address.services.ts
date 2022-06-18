import { BadRequestError } from '@portal-microservices/common';
import address from 'address';

const getNetworkAddress = () => {
    return {
        MAC: address.mac((err, addr) => {
            if (err) {
                throw new BadRequestError('Can not reach to MAC Address');
            }
            return addr;
        }),
    };
};

export default getNetworkAddress;
