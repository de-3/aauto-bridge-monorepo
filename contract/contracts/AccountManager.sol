// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@account-abstraction/contracts/core/BaseAccount.sol";

import "./interfaces/IOptimismBridge.sol";

contract AccountManager is BaseAccount, Initializable, ReentrancyGuard {
    using ECDSA for bytes32;

    bytes4 private constant VALID_SIG = 0x1626ba7e;

    address immutable OPTIMISM_BRIDGE;
    IEntryPoint private immutable _entryPoint;

    mapping(address => uint256) depositBalances;
    mapping(address => address) userOpAddresses;
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
        return 0;
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
        // nonce key address check
        uint160 key = uint160(userOp.nonce >> 64);
        require(key == uint160(userOpAddresses[userOp.sender]));

        _validateCondition(userOp.callData);
        addDepositToEntryPoint(missingAccountFunds);
    }

    function _validateCondition(bytes calldata callData) internal {
        // decode params from calldata
        (address to, uint256 chainId, uint256 nonce, uint256 charge) = abi
            .decode(callData[4:], (address, uint256, uint256, uint256));
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

    function addDepositToEntryPoint(uint256 prefunds) public payable {
        _entryPoint.depositTo{value: msg.value + prefunds}(address(this));
        emit AddedFundsToEntrypoint(msg.value + prefunds);
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
