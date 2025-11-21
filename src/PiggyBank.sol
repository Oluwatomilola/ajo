// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PiggyBank
 * @notice A time-locked savings contract for disciplined ETH deposits
 * @dev Users can deposit ETH and withdraw only after a specified unlock time
 */
    address public owner;
    uint256 public unlockTime;

    event Deposited(address indexed depositor, uint256 amount);
    event Withdrawn(address indexed withdrawer, uint256 amount);

    constructor(uint256 _unlockTime) payable {
        owner = msg.sender;
        unlockTime = _unlockTime;
    }

    function deposit() external payable {
        require(msg.value > 0, "Must deposit something");
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw() external {
        require(block.timestamp >= unlockTime, "PiggyBank: Still locked");
        require(msg.sender == owner, "PiggyBank: Not owner");
        uint256 amount = address(this).balance;
        emit Withdrawn(msg.sender, amount);
        payable(owner).transfer(amount);
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