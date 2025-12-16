// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PiggyBank
 * @notice A time-locked savings contract for disciplined ETH deposits
 * @dev Users can deposit ETH and withdraw only after a specified unlock time
 * @dev Implements proper checks-effects-interactions pattern to prevent reentrancy
 */
contract PiggyBank {
    address public owner;
    uint256 public unlockTime;
    bool public paused;
    
    // Multi-user deposit tracking
    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;
    uint256 public totalWithdrawals;
    
    // Deposit limits
    uint256 public constant MAX_DEPOSIT_AMOUNT = 100 ether;
    uint256 public constant MIN_DEPOSIT_AMOUNT = 0.001 ether;
    
    // Custom errors for gas efficiency
    error PiggyBank__DepositTooHigh();
    error PiggyBank__DepositTooLow();
    error PiggyBank__TransferFailed();
    error PiggyBank__StillLocked();
    error PiggyBank__NotOwner();
    error PiggyBank__ZeroAddress();

    event Deposited(address indexed depositor, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed withdrawer, uint256 amount, uint256 timestamp);
    event Paused(address account);
    event Unpaused(address account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(uint256 _unlockTime) payable {
        require(_unlockTime > block.timestamp, "Unlock time must be in future");
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

    /**
     * @notice Deposit ETH into the piggy bank
     * @dev Implements checks-effects-interactions pattern to prevent reentrancy
     */
    function deposit() external payable whenNotPaused {
        // Checks
        if (msg.value < MIN_DEPOSIT_AMOUNT) revert PiggyBank__DepositTooLow();
        
        uint256 userDeposit = deposits[msg.sender];
        uint256 newTotalDeposit = userDeposit + msg.value;
        
        if (newTotalDeposit > MAX_DEPOSIT_AMOUNT) {
            revert PiggyBank__DepositTooHigh();
        }
        
        // Effects - Update state BEFORE external calls
        deposits[msg.sender] = newTotalDeposit;
        totalDeposits += msg.value;
        
        // Interactions - Emit event (no external calls here)
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Withdraw specific amount from the piggy bank
     * @param amount Amount to withdraw
     * @dev Implements checks-effects-interactions pattern to prevent reentrancy
     */
    function withdraw(uint256 amount) external whenNotPaused {
        // Checks
        if (block.timestamp < unlockTime) revert PiggyBank__StillLocked();
        
        uint256 userDeposit = deposits[msg.sender];
        if (amount == 0) revert PiggyBank__DepositTooLow();
        if (amount > userDeposit) revert PiggyBank__DepositTooHigh();
        
        // Effects - Update state BEFORE external calls
        deposits[msg.sender] = userDeposit - amount;
        totalWithdrawals += amount;
        
        // Interactions - Emit event first, then external call
        emit Withdrawn(msg.sender, amount, block.timestamp);
        
        // External call at the END to prevent reentrancy
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert PiggyBank__TransferFailed();
    }

    /**
     * @notice Withdraw all funds from the piggy bank
     * @dev Implements checks-effects-interactions pattern to prevent reentrancy
     */
    function withdrawAll() external whenNotPaused {
        // Checks
        if (block.timestamp < unlockTime) revert PiggyBank__StillLocked();
        
        uint256 userDeposit = deposits[msg.sender];
        if (userDeposit == 0) revert PiggyBank__DepositTooLow();
        
        // Effects - Update state BEFORE external calls
        deposits[msg.sender] = 0;
        totalWithdrawals += userDeposit;
        
        // Interactions - Emit event first, then external call
        emit Withdrawn(msg.sender, userDeposit, block.timestamp);
        
        // External call at the END to prevent reentrancy
        (bool success, ) = payable(msg.sender).call{value: userDeposit}("");
        if (!success) revert PiggyBank__TransferFailed();
    }

    // View functions
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUnlockTime() external view returns (uint256) {
        return unlockTime;
    }

    function isUnlocked() external view returns (bool) {
        return block.timestamp >= unlockTime;
    }

    /**
     * @notice Get user's deposit balance
     * @param user Address of the user
     * @return User's deposit amount
     */
    function getUserDeposit(address user) external view returns (uint256) {
        return deposits[user];
    }

    /**
     * @notice Get contract statistics
     * @return totalDeposits Total amount deposited
     * @return totalWithdrawals Total amount withdrawn
     * @return currentBalance Current contract balance
     */
    function getContractStats() external view returns (uint256, uint256, uint256) {
        return (totalDeposits, totalWithdrawals, address(this).balance);
    }
}
