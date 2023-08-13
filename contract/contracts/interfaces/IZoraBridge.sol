// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

interface IZoraBridge {
    function depositTransaction(
        address _to,
        uint256 _value,
        uint64 _gasLimit,
        bool _isCreation,
        bytes memory _data
    ) external payable;
}
