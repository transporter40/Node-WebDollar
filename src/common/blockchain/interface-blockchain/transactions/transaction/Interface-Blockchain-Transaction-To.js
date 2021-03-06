const BigNumber = require('bignumber.js');

import BufferExtended from "common/utils/BufferExtended"
import Serialization from "common/utils/Serialization"
import consts from "consts/const_global"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'

class InterfaceBlockchainTransactionTo{

    /*
        addresses: [ {
            address: Addr1,
            amount: amount
        }, ... ]
     */

    constructor (transaction, addresses){

        this.transaction = transaction;
        this.setTo(addresses);
    }

    setTo(addresses){

        if (typeof addresses === "object" && addresses.hasOwnProperty("addresses")) {
            addresses = addresses.addresses;
        }

        if (!Array.isArray(addresses))
            addresses = [addresses];

        for (let i = 0; i < addresses.length; i++) {

            if (typeof addresses[i].unencodedAddress === "object" && addresses[i].unencodedAddress.hasOwnProperty("unencodedAddress"))
                addresses[i].unencodedAddress = addresses[i].unencodedAddress.unencodedAddress;

            addresses[i].unencodedAddress = InterfaceBlockchainAddressHelper.validateAddressChecksum(addresses[i].unencodedAddress);

            if (typeof addresses[i].amount === "string" || typeof addresses[i].amount === "number")
                addresses[i].amount = new BigNumber(addresses[i].amount);
        }

        this.addresses = addresses;

    }

    toJSON(){
        return {
            addresses: this.addresses,
        }
    }

    /**
     * Validate To
     * @param to: object { addresses: [], fee: number, positive, currency: TokenObject ]
     * @returns  to
     */
    validateTo(){

        if (this.addresses.length === 0) throw 'To is empty Array';

        this.addresses.forEach ( (toObject, index) =>{

            if (!toObject.unencodedAddress || toObject.unencodedAddress === null || !Buffer.isBuffer(toObject.unencodedAddress))
                throw {message: 'To.Object Address is not specified', address: toObject, index:index} ;

            if (!toObject.amount ||  toObject.amount instanceof BigNumber === false )
                throw {message: 'To.Object Amount is not specified', address: toObject, index:index} ;

            if ( toObject.amount.isLessThanOrEqualTo(0) )
                throw {message: "To.Object Amount is an invalid number", address: toObject, index:index} ;

            let addressFound = false;
            for (let i=0; i<this.transaction.from.addresses.length; i++)
                if (this.transaction.from.addresses[i].unencodedAddress.equals( toObject.unencodedAddress )){
                    addressFound = true;
                    break;
                }

            if (addressFound)
                throw {message: "To.Object Address is included in the input and it should not be", address: toObject}

        });

        //Validate to.currency

        return true;
    }

    calculateOutputSum(){

        //validate amount
        let outputValues = [], outputSum = BigNumber(0);

        for (let i=0; i<this.addresses.length; i++ ){
            let value = this.transaction.blockchain.accountantTree.getBalance( this.addresses[i].unencodedAddress, this.transaction.from.currencyTokenId );
            outputValues.push( value );
            outputSum = outputSum.plus(value);
        }

        return outputSum;
    }


    serializeTo(){

        let addressesBuffer = [];

        Serialization.serializeNumber1Byte( this.addresses.length );

        for (let i = 0; i < this.addresses.length; i++){
            addressesBuffer.push( Serialization.serializeToFixedBuffer( consts.ADDRESSES.ADDRESS.WIF.LENGTH, this.addresses[i].unencodedAddress ));
            addressesBuffer.push( Serialization.serializeBigNumber( this.addresses[i].amount ));
        }

        return Buffer.concat (addressesBuffer);

    }

    deserializeTo(buffer, offset){

        let length = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 1) );
        offset += 1;

        for (let i = 0; i < length; i++){

            let address = {};

            address.unencodedAddress= BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.WIF.LENGTH);
            offset += consts.ADDRESSES.ADDRESS.WIF.LENGTH;

            let result = Serialization.deserializeBigNumber(buffer, offset);
            address.amount = result.number;

            offset = result.newOffset;
        }

        return offset;
    }

    updateAccountantTreeTo(multiplicationFactor=1){

        let lastPosition;

        try {

            for (let i = 0; i < this.addresses.length; i++) {

                if (this.addresses[i].amount instanceof BigNumber === false) throw {message: "amount is not BigNumber", address: this.addresses[i]};

                let result = this.transaction.blockchain.updateAccount(this.addresses[i].unencodedAddress, this.addresses[i].amount.multipliedBy(multiplicationFactor), this.transaction.from.currencyTokenId);

                if (result !== null) throw {message: "error Updating Account", address: this.addresses[i]}

                lastPosition = i;
            }

        } catch (exception){

            for (let i=lastPosition; i >= 0 ; i--) {
                let result = this.transaction.blockchain.updateAccount(this.addresses[i].unencodedAddress, this.addresses[i].amount.multipliedBy(multiplicationFactor).negated(), this.transaction.from.currencyTokenId);

                if (result !== null) throw {message: "error Updating Account", address: this.addresses[i]};
            }

        }

    }

}

export default InterfaceBlockchainTransactionTo;
