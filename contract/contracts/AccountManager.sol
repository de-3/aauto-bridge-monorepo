// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import "@account-abstraction/contracts/core/BaseAccount.sol";

import "./interfaces/IOptimismBridge.sol";

contract AccountManager is BaseAccount, Initializable {
    using ECDSA for bytes32;

    bytes4 private constant VALID_SIG = 0x1626ba7e;

    address immutable OPTIMISM_BRIDGE;
    IEntryPoint private immutable _entryPoint;

    address public owner;

    mapping(address => uint256) depositBalances;
    mapping(address => address) userOpAddresses;
    mapping(address => mapping(uint256 => uint256)) chainIdAndNonceByUser;
    mapping(address => uint) lastTransactionsByUser;

    modifier onlyEntryPointOrOwner() {
        require(
            msg.sender == address(entryPoint()) || msg.sender == owner,
            "not entrypoint or owner"
        );
        _;
    }

    constructor(IEntryPoint anEntryPoint, address optimismBridge) {
        _entryPoint = anEntryPoint;
        OPTIMISM_BRIDGE = optimismBridge;
        owner = msg.sender;
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

        _validateCondition(to, chainId, nonce, charge);
        _bridgeToOptimism(to);
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
        chainIdAndNonceByUser[to][chainId] = nonce;

        // timestamp check
        require(block.timestamp > lastTransactionsByUser[to] + 10 minutes);

        // enough deposit check
        require(depositBalances[to] >= charge, "not enough deposit to bridge");
    }

    function _bridgeToOptimism(address _to) internal {
        IOptimismBridge(OPTIMISM_BRIDGE).bridgeETHTo(_to, 0, "0x");
    }

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external virtual override returns (uint256 validationData) {
        _requireFromEntryPoint();

        validationData = _validateSignature(userOp, userOpHash);
        addDepositToEntryPoint();
    }

    function addDepositToEntryPoint() public payable {
        _entryPoint.depositTo{value: msg.value}(address(this));
    }

    function deposit() public payable {
        depositBalances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(
            depositBalances[msg.sender] >= amount,
            "withdraw amount exceeds deposit"
        );
        depositBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    function initialize(address userOpAddr) external payable {
        userOpAddresses[msg.sender] = userOpAddr;
        deposit();
    }
}
