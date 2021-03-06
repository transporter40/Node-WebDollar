/**
 * Known as π
 */

class PPowBlockchainProofs{

    constructor(blocks){

        this.blocks = blocks;

    }

    /**
     * Returns ths upchain of current chain(C ↑ µ).
     */
    blocksGreaterLevel(miu){

        let list = [];

        for (let i = 0; i < this.blocks.length; ++i)
            if (miu <= this.blocks[i].level)
                list.push(this.blocks[i]);

        return list;
    }

    /**
     * Returns ths downchain of current chain(C ↓ µ).
     */
    blocksLessLevel(miu){

        let list = [];

        for (let i = 0; i < this.blocks.length; ++i)
            if (this.blocks[i].level <= miu)
                list.push(this.blocks[i]);

        return list;
    }

}

export default PPowBlockchainProofs;