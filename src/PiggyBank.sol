 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PiggyBank
 * @notice A time-locked savings contract for disciplined ETH deposits
 * @dev Users can deposit ETH and withdraw only after a specified unlock time
 */
contract PiggyBank {
    address public owner;
    uint256 public unlockTime;
    bool public paused;

    event Deposited(address indexed depositor, uint256 amount);
    event Withdrawn(address indexed withdrawer, uint256 amount);
    event Paused(address account);
    event Unpaused(address account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(uint256 _unlockTime) payable {
        owner = msg.sender;
        unlockTime = _unlockTime;
        paused = false;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Must deposit something");
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw() external whenNotPaused {
        require(block.timestamp >= unlockTime, "PiggyBank: Still locked");
        require(msg.sender == owner, "PiggyBank: Not owner");
        uint256 amount = address(this).balance;
        emit Withdrawn(msg.sender, amount);
        // Use safe withdrawal pattern to prevent reentrancy
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Transfer failed");
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUnlockTime() external view returns (uint256) {
        return unlockTime;
    }

    function isUnlocked() external view returns (bool) {
        return block.timestamp >= unlockTime;
    }
}
