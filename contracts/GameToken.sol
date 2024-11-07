// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GameToken {
    string public name = "GameToken";
    string public symbol = "GTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() {
        totalSupply = 0;
    }

    function mint(address _to, uint256 _amount) external {
        totalSupply += _amount;
        balanceOf[_to] += _amount;
        emit Transfer(address(0), _to, _amount);
    }
}
