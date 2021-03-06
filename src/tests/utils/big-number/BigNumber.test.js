var assert = require('assert')
var BigNumber = require('bignumber.js');

import TestsHelper from 'tests/Tests.helper'

describe('BigNumber test', () => {

    it('creating big number', ()=>{

        let v = TestsHelper.makeRandomBigNumbersArray(5000, true, true);

        let sum1 = new BigNumber(0);
        let sum2 = new BigNumber(0);
        let prod1 = new BigNumber(1);
        let prod2 = new BigNumber(1);

        for (let i = 0; i < v.length; ++i) {
            sum1 = sum1.plus(v[i]);
            sum2 = sum2.minus(v[i]);
            prod1 = prod1.multipliedBy(v[i]);
            prod2 = prod2.multipliedBy(v[i]);
        }
        let diff1 = sum1.minus(sum2).minus(sum1.multipliedBy(new BigNumber(2)));
        let diff2 = sum1.plus(sum2);
        let diff3 = prod1.minus(prod2);

        assert(diff1.isEqualTo(new BigNumber(0)), diff1 + "!=" + 0);
        assert(diff2.isEqualTo(new BigNumber(0)), diff2 + "!=" + 0);
        assert(diff3.isEqualTo(new BigNumber(0)), diff3 + "!=" + 0);
    });

    it('Big Number 1/3+1/3+1/3 === 1', ()=>{

        let a = new BigNumber(1).dividedBy(3);
        let b = a.plus(a).plus( new BigNumber(1).dividedBy(3));

        //console.log("1/3+1/3+1/3", b);
        assert(b.isGreaterThan(new BigNumber("0.999999999999") ), "1/3+1/3+1/3 >= 0.999999999999");
        assert(b.isLessThan(new BigNumber("1.0") ), "1/3+1/3+1/3 < 1");

    });
});