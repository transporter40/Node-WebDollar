import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import InterfaceAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/Interface-Accountant-Radix-Tree'
import InterfaceMerkleTree from 'common/trees/merkle-tree/Interface-Merkle-Tree'

class InterfaceRadixMerkleTree extends InterfaceAccountantRadixTree {

    constructor(){
        super();

        this.autoMerklify = true;
    }

    _changedNode(node){

        // recalculate the balances
        this.refreshAccount(node, true);

        InterfaceMerkleTree.prototype._changedNode.call(this, node); //computing hash

        InterfaceRadixTree.prototype._changedNode.call(this, node); //verifying hash and propagating it
    }

    validateTree(node, callback){

        if (!InterfaceAccountantRadixTree.prototype.validateTree.call(this, node, callback)) //verifying hash and propagating it
            return false;

        if (!InterfaceMerkleTree.prototype.validateTree.call(this, node)) //computing hash
            return false;

        return true;
    }

    _checkInvalidNode(node){

        if (!InterfaceAccountantRadixTree.prototype._checkInvalidNode.call(this, node))
            return false;

        return InterfaceMerkleTree.prototype._checkInvalidNode.call(this, node);
    }

    _validateHash(node){
        return InterfaceMerkleTree.prototype._validateHash.call(this, node);
    }


    /*
        inherited
     */
    _computeHash(node) {
        return InterfaceMerkleTree.prototype._computeHash.call(this, node);
    }

    _refreshHash(node, forced){
        return InterfaceMerkleTree.prototype._refreshHash.call(this, node,forced);
    }

    _getValueToHash(node){
        //return Buffer.concat ( [InterfaceMerkleTree.prototype._getValueToHash.call(this, node),  node.sum.buffer ]);
        return node.serializeNode() ;
    }


}

export default InterfaceRadixMerkleTree;