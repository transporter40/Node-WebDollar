import consts from 'consts/const_global'
import MiniBlockchainFork from "./../Mini-Blockchain-Fork"
import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"

class MiniBlockchainLightFork extends MiniBlockchainFork {

    constructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header) {

        super(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header)

        this.forkPrevAccountantTree = null;
        this.forkPrevDifficultyTarget = null;
        this.forkPrevTimeStamp = null;
        this.forkPrevHashPrev = null;

        this.forkDifficultyCalculation = {
            difficultyAdditionalBlocks: [],
            difficultyCalculationStarts: 0,
        };

        this._blocksStartingPointClone = null;
        this._lightPrevDifficultyTargetClone = null;
        this._lightPrevTimeStampClone = null;
        this._lightPrevHashPrevClone = null;
        this._lightAccountantTreeSerializationsHeightClone = null;
    }

    // return the difficultly target for ForkBlock
    getForkDifficultyTarget(height){

        let forkHeight = height - this.forkStartingHeight;

        if (this.forkChainStartingPoint === this.forkStartingHeight && height !== 0 && height === this.forkStartingHeight){
            if (this.forkPrevDifficultyTarget === null || this.forkPrevDifficultyTarget === undefined) throw "forkPrevDifficultyTarget was not specified";
            return this.forkPrevDifficultyTarget;
        }

        return MiniBlockchainFork.prototype.getForkDifficultyTarget.call(this, height);

    }

    getForkTimeStamp(height){

        let forkHeight = height - this.forkStartingHeight;

        if (this.forkChainStartingPoint === this.forkStartingHeight && height !== 0 && height === this.forkStartingHeight){
            if (this.forkPrevTimeStamp === null || this.forkPrevTimeStamp === undefined)
                throw "forkPrevTimeStamp was not specified";
            return this.forkPrevTimeStamp;
        }

        return MiniBlockchainFork.prototype.getForkTimeStamp.call(this, height);

    }

    getForkPrevHash(height){

        let forkHeight = height - this.forkStartingHeight;

        if (this.forkChainStartingPoint === this.forkStartingHeight && height !== 0 && height === this.forkStartingHeight){
            if (this.forkPrevHashPrev === null || this.forkPrevHashPrev === undefined)
                throw "forkPrevHashPrev was not specified";
            return this.forkPrevHashPrev;
        }

        return MiniBlockchainFork.prototype.getForkPrevHash.call(this, height);
    }

    _createBlockValidation_ForkValidation(height, forkHeight){

        let validationType = {"skip-accountant-tree-validation": true,};

        if ( height < this.forkDifficultyCalculation.difficultyCalculationStarts)
            validationType["skip-difficulty-recalculation"] = true;

        if (height === this.forkChainLength-1)
            validationType["validation-timestamp-adjusted-time"] = true;

        //it's a new light fork && i have less than forkHeight
        if (this.forkChainStartingPoint === this.forkStartingHeight && forkHeight < consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS )
            validationType["skip-validation-timestamp"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), validationType );
    }

    _createBlockValidation_BlockchainValidation(height, forkHeight){
        let validationType = {};

        if ( height < this.forkDifficultyCalculation.difficultyCalculationStarts)
            validationType["skip-difficulty-recalculation"] = true;

        if (height === this.forkChainLength-1)
            validationType["validation-timestamp-adjusted-time"] = true;

        //it's a new light fork && i have less than forkHeight
        if (this.forkChainStartingPoint === this.forkStartingHeight && forkHeight < consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS )
            validationType["skip-validation-timestamp"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), validationType );
    }

    preFork() {

        // I have a new accountant Tree, so it is a new [:-m] light proof
        if (this.forkChainStartingPoint === this.forkStartingHeight &&
            this.forkPrevAccountantTree !== null && Buffer.isBuffer(this.forkPrevAccountantTree)){

            console.log("preFork!!!!!!!!!!!!!!!!!! 2222222");
            let diffIndex = this.forkDifficultyCalculation.difficultyAdditionalBlocks[0];
            console.log("this.forkDiff", diffIndex);

            this._accountantTreeClone = this.blockchain.lightAccountantTreeSerializations[diffIndex];
            if (this._accountantTreeClone === undefined || this._accountantTreeClone === null)
                this._accountantTreeClone = new Buffer(0);

            console.log("preFork1 accountantTree sum all", this.blockchain.accountantTree.calculateNodeCoins() );
            //console.log("preFork hashAccountantTree", this.forkPrevAccountantTree.toString("hex"));

            this.blockchain.accountantTree.deserializeMiniAccountant( this.forkPrevAccountantTree );

            //console.log("preFork hashAccountantTree", this.blockchain.accountantTree.root.hash.sha256.toString("hex"));
            console.log("preFork2 accountantTree sum all", this.blockchain.accountantTree.calculateNodeCoins() );

            console.log("this.forkPrevDifficultyTarget", this.forkPrevDifficultyTarget.toString("hex"));
            console.log("this.forkPrevTimeStamp", this.forkPrevTimeStamp);
            console.log("this.forkPrevHashPrev", this.forkPrevHashPrev.toString("hex"));

            this._lightAccountantTreeSerializationsHeightClone = new Buffer(this.blockchain.lightAccountantTreeSerializations[diffIndex] !== undefined ? this.blockchain.lightAccountantTreeSerializations[diffIndex] : 0);
            this._blocksStartingPointClone = this.blockchain.blocks.blocksStartingPoint;
            this._lightPrevDifficultyTargetClone = new Buffer(this.blockchain.lightPrevDifficultyTargets[diffIndex] !== undefined ? this.blockchain.lightPrevDifficultyTargets[diffIndex] : 0);
            this._lightPrevTimeStampClone = this.blockchain.lightPrevTimeStamps[diffIndex];
            this._lightPrevHashPrevClone = new Buffer(this.blockchain.lightPrevHashPrevs[diffIndex] !== undefined ? this.blockchain.lightPrevHashPrevs[diffIndex] : 0);

            this.blockchain.blocks.blocksStartingPoint = this.forkChainStartingPoint;
            this.blockchain.lightPrevDifficultyTargets[diffIndex] = this.forkPrevDifficultyTarget;
            this.blockchain.lightPrevTimeStamps[diffIndex] = this.forkPrevTimeStamp;
            this.blockchain.lightPrevHashPrevs[diffIndex] = this.forkPrevHashPrev;

            this.blockchain.lightAccountantTreeSerializations[diffIndex] = this.forkPrevAccountantTree;

            //add dummy blocks between [beginning to where it starts]
            // while (this.blockchain.blocks.length < this.forkStartingHeight)
            //     this.blockchain.addBlock(undefined);

        } else
            //it is just a simple fork
            return MiniBlockchainFork.prototype.preFork.call(this);
    }

    postForkBefore(forkedSuccessfully){

        if (forkedSuccessfully)
            return true;

        //recover to the original Accountant Tree & state
        if (this.forkPrevAccountantTree !== null && Buffer.isBuffer(this.forkPrevAccountantTree)){

            //recover to the original Accountant Tree
            console.log("postForkBefore1 accountantTree sum all", this.blockchain.accountantTree.calculateNodeCoins() );
            this.blockchain.accountantTree.deserializeMiniAccountant(this._accountantTreeClone);
            console.log("postForkBefore2 accountantTree sum all", this.blockchain.accountantTree.calculateNodeCoins() );

            this.blockchain.blocks.blocksStartingPoint = this._blocksStartingPointClone;

            let diffIndex = this.forkStartingHeight ;

            this.blockchain.lightPrevDifficultyTargets[diffIndex] = this._lightPrevDifficultyTargetClone;
            this.blockchain.lightPrevTimeStamps[diffIndex] = this._lightPrevTimeStampClone;
            this.blockchain.lightPrevHashPrevs[diffIndex] = this._lightPrevHashPrevClone;
            this.blockchain.lightAccountantTreeSerializations[diffIndex] = this._lightAccountantTreeSerializationsHeightClone;

            //if (! (await this.blockchain._recalculateLightPrevs( this.blockchain.blocks.length - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS - 1))) throw "_recalculateLightPrevs failed";
        } else
            return MiniBlockchainFork.prototype.postForkBefore.call(this, forkedSuccessfully);
    }

    async postFork(forkedSuccessfully){

        if (forkedSuccessfully) {

            //saving the Light Settings

            return true;
        }


        return MiniBlockchainFork.prototype.postFork.call(this, forkedSuccessfully);
    }

    async saveIncludeBlock(index){

        let answer = await MiniBlockchainFork.prototype.saveIncludeBlock.call(this, index);

        if (answer){

            if (this.forkChainStartingPoint === this.forkStartingHeight && index === 0 && this.forkBlocks[index].height >= consts.BLOCKCHAIN.HARD_FORKS.TEST_NET_3)
                this.forkBlocks[index].difficultyTarget = this.forkDifficultyCalculation.difficultyAdditionalBlockFirstDifficulty
        }

        return answer;
    }


}

export default MiniBlockchainLightFork