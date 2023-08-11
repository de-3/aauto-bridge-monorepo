// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@account-abstraction/contracts/core/BaseAccount.sol";

import "./interfaces/IOptimismBridge.sol";

contract AccountManager is BaseAccount, Initializable, ReentrancyGuard {
    using ECDSA for bytes32;

    uint256 internal constant SIG_VALIDATION_SUCCEDED = 0;

    address immutable OPTIMISM_BRIDGE;
    IEntryPoint private immutable _entryPoint;

    mapping(address => uint256) public depositBalances;
    mapping(address => address) public userOpAddresses;
    mapping(address => mapping(uint256 => uint256)) chainIdAndNonceByUser;
    mapping(address => uint) lastTransactionTimestampsByUser;

    event BridgeExecuted(address to, uint256 amount);
    event Deposited(address sender, uint256 amount);
    event Withdrawn(address to, uint256 amount);
    event AddedFundsToEntrypoint(uint256 amount);

    constructor(IEntryPoint anEntryPoint, address optimismBridge) {
        _entryPoint = anEntryPoint;
        OPTIMISM_BRIDGE = optimismBridge;
        _disableInitializers();
    }

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes32 opHash = userOpHash.toEthSignedMessageHash();
        // check if L2 transaction sender is valid
        if (
            userOpAddresses[userOp.sender] != opHash.recover(userOp.signature)
        ) {
            return SIG_VALIDATION_FAILED;
        }
        return SIG_VALIDATION_SUCCEDED;
    }

    function execute(
        address to,
        uint256 chainId,
        uint256 nonce,
        uint256 charge
    ) external {
        _requireFromEntryPoint();

        _bridgeToOptimism(to, charge);
    }

    function _bridgeToOptimism(address to, uint256 amount) internal {
        IOptimismBridge(OPTIMISM_BRIDGE).bridgeETHTo{value: amount}(
            to,
            0,
            "0x"
        );
        emit BridgeExecuted(to, amount);
    }

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external virtual override returns (uint256 validationData) {
        _requireFromEntryPoint();

        validationData = _validateSignature(userOp, userOpHash);

        (address to, uint256 chainId, uint256 nonce, uint256 charge) = abi
            .decode(userOp.callData[4:], (address, uint256, uint256, uint256));
        // nonce key address check
        _validateNonceKeyAddress(userOp.nonce, to);

        _validateCondition(to, chainId, nonce, charge);
        _addDepositToEntryPoint(missingAccountFunds);
    }

    function _validateNonceKeyAddress(uint256 nonce, address to) internal view {
        uint160 key = uint160(nonce >> 64);
        require(
            key == uint160(userOpAddresses[to]),
            "nonce key should be sender's userOpAddress"
        );
    }

    function _validateCondition(
        address to,
        uint256 chainId,
        uint256 nonce,
        uint256 charge
    ) internal {
        // nonce + chainID check
        if (nonce != 0) {
            uint256 previousNonce = chainIdAndNonceByUser[to][chainId];
            require(nonce > previousNonce, "already executed transaction");
        }
        // set latest nonce
        chainIdAndNonceByUser[to][chainId] = nonce;

        // timestamp check
        require(
            block.timestamp > lastTransactionTimestampsByUser[to] + 10 minutes
        );

        // enough deposit check
        require(depositBalances[to] >= charge, "not enough deposit to bridge");
    }

    function _addDepositToEntryPoint(uint256 _prefund) internal {
        _entryPoint.depositTo{value: _prefund}(address(this));
        emit AddedFundsToEntrypoint(_prefund);
    }

    function deposit() public payable {
        depositBalances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(
            depositBalances[msg.sender] >= amount,
            "withdraw amount exceeds deposit"
        );
        depositBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function initialize(address userOpAddr) external payable {
        userOpAddresses[msg.sender] = userOpAddr;
        deposit();
    }
}
