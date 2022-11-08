// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

import "./IUniswapOracleV3.sol";
import '@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol';
import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol';
import 'hardhat/console.sol';

contract UniswapOracleV3 is IUniswapOracleV3 {

    uint256 public constant override PERIOD = 60 * 60; // 1 day in sec
    address public immutable override factory;
    uint24 FEE = 500;

    event PairAdded(address token1, address token2);

    error MISSING_POOL(
        address token1,
        address token2
    );

    constructor(address _factory) {
        factory = _factory;
    }

    function consult(
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut
    ) public view returns (uint256 quoteAmount) {
        address pool = IUniswapV3Factory(factory).getPool(_tokenIn, _tokenOut, FEE);
        if(pool == address(0)){
            revert MISSING_POOL(_tokenIn, _tokenOut);
        }
        (int24 timeWeightedAverageTick,) = OracleLibrary.consult(pool, uint32(PERIOD));
        quoteAmount = OracleLibrary.getQuoteAtTick(timeWeightedAverageTick, uint128(_amountIn), _tokenIn, _tokenOut);
    }

    // deprec
    function update(address _tokenIn, address _tokenOut) external {
        address pool = IUniswapV3Factory(factory).getPool(_tokenIn, _tokenOut, FEE);
        if(pool == address(0)){
            revert MISSING_POOL(_tokenIn, _tokenOut);
        }
        emit PairAdded(_tokenIn, _tokenOut);
    }

    // deprec
    function updateAndConsult(
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut
    ) external view returns (uint256 _amountOut) {
        _amountOut = consult(_tokenIn, _amountIn, _tokenOut);
    }
}