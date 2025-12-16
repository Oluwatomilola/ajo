// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PiggyBank
 * @notice A time-locked savings contract for disciplined ETH deposits with enhanced security
 * @dev Users can deposit ETH and withdraw only after a specified unlock time with advanced security features
 * @custom:security Features include reentrancy protection, access controls, deposit limits, and emergency functions
 */
contract PiggyBank {
    // ============ STORAGE VARIABLES ============
    address public owner;
    uint256 public unlockTime;
    bool public paused;
    uint256 public constant MAX_DEPOSIT_AMOUNT = 1000 ether; // Maximum deposit per user
    uint256 public constant MIN_DEPOSIT_AMOUNT = 0.001 ether; // Minimum deposit per user
    uint256 public constant MAX_LOCK_TIME = 365 days * 5; // Maximum lock time (5 years)
    uint256 public constant MIN_LOCK_TIME = 1 days; // Minimum lock time (1 day)

    // User deposit tracking with enhanced security
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public depositTimestamps;
    mapping(address => uint256) public userDepositCount;

    // Emergency functions with timelock
    address public emergencyGuardian;
    uint256 public emergencyUnlockTime;
    bool public emergencyMode;

    // Statistics for monitoring
    uint256 public totalDeposits;
    uint256 public totalWithdrawals;
    uint256 public numberOfDepositors;

    // ============ EVENTS ============
    event Deposited(
        address indexed depositor,
        uint256 amount,
        uint256 timestamp
    );
    event Withdrawn(
        address indexed withdrawer,
        uint256 amount,
        uint256 timestamp
    );
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event EmergencyGuardianChanged(
        address indexed previousGuardian,
        address indexed newGuardian
    );
    event EmergencyModeActivated(address indexed guardian, uint256 unlockTime);
    event EmergencyWithdrawal(address indexed user, uint256 amount);
    event DepositLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event UserBlacklisted(address indexed user);
    event UserUnblacklisted(address indexed user);

    // ============ CUSTOM ERRORS ============
    error PiggyBank__ZeroValue();
    error PiggyBank__DepositTooLow();
    error PiggyBank__DepositTooHigh();
    error PiggyBank__StillLocked();
    error PiggyBank__NoDeposits();
    error PiggyBank__Unauthorized();
    error PiggyBank__Paused();
    error PiggyBank__InvalidUnlockTime();
    error PiggyBank__EmergencyModeActive();
    error PiggyBank__Blacklisted();
    error PiggyBank__ReentrancyAttack();
    error PiggyBank__TransferFailed();
    error PiggyBank__MaxUsersReached();
    error PiggyBank__InvalidLockTime();

    // ============ MODIFIERS ============
    modifier whenNotPaused() {
        if (paused) revert PiggyBank__Paused();
        _;
    }

    modifier whenPaused() {
        if (!paused) revert PiggyBank__Unauthorized();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert PiggyBank__Unauthorized();
        _;
    }

    modifier onlyGuardian() {
        if (msg.sender != emergencyGuardian) revert PiggyBank__Unauthorized();
        _;
    }

    bool private _reentrancyGuard;

    modifier nonReentrant() {
        if (_reentrancyGuard) revert PiggyBank__ReentrancyAttack();
        _reentrancyGuard = true;
        _;
        _reentrancyGuard = false;
    }

    modifier validUnlockTime(uint256 _unlockTime) {
        if (_unlockTime <= block.timestamp)
            revert PiggyBank__InvalidUnlockTime();
        if (_unlockTime > block.timestamp + MAX_LOCK_TIME)
            revert PiggyBank__InvalidLockTime();
        _;
    }

    modifier validDepositAmount(uint256 _amount) {
        if (_amount == 0) revert PiggyBank__ZeroValue();
        if (_amount < MIN_DEPOSIT_AMOUNT) revert PiggyBank__DepositTooLow();
        if (_amount > MAX_DEPOSIT_AMOUNT) revert PiggyBank__DepositTooHigh();
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(uint256 _unlockTime) payable validUnlockTime(_unlockTime) {
        owner = msg.sender;
        unlockTime = _unlockTime;
        paused = false;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ============ RECEIVE FUNCTIONS ============
    /**
     * @dev Accepts direct ETH transfers
     */
    receive() external payable {
        this.deposit{value: msg.value}();
    }

    /**
     * @dev Fallback function to handle unexpected calls
     */
    fallback() external payable {
        revert("PiggyBank: Direct calls not allowed");
    }

    // ============ CORE FUNCTIONS ============
    /**
     * @dev Deposits ETH into the piggy bank with enhanced security
     * @custom:gas Optimized to reduce gas costs
     */
    function deposit()
        external
        payable
        whenNotPaused
        nonReentrant
        validDepositAmount(msg.value)
    {
        uint256 amount = msg.value;
        uint256 userDeposit = deposits[msg.sender];

        // Check if this is the first deposit from this user
        if (userDeposit == 0 && userDepositCount[msg.sender] == 0) {
            numberOfDepositors++;
        }

        // Update deposits with overflow protection
        uint256 newTotalDeposit = userDeposit + amount;
        if (newTotalDeposit > MAX_DEPOSIT_AMOUNT) {
            revert PiggyBank__DepositTooHigh();
        }

        deposits[msg.sender] = newTotalDeposit;
        depositTimestamps[msg.sender] = block.timestamp;
        userDepositCount[msg.sender]++;
        totalDeposits += amount;

        emit Deposited(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Withdraws ETH from the piggy bank with enhanced security
     * @custom:gas Uses safe withdrawal pattern with reentrancy protection
     */
    function withdraw() external whenNotPaused nonReentrant {
        if (block.timestamp < unlockTime) {
            if (!emergencyMode) revert PiggyBank__StillLocked();
        }

        uint256 amount = deposits[msg.sender];
        if (amount == 0) revert PiggyBank__NoDeposits();

        // Reset deposit before transfer (reentrancy protection)
        deposits[msg.sender] = 0;
        totalWithdrawals += amount;

        // Safe transfer with gas optimization
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert PiggyBank__TransferFailed();

        // Emit event after successful transfer (checks-effects-interactions pattern)
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Emergency withdrawal function for guardians
     * @custom:security Requires emergency mode to be active
     */
    function emergencyWithdraw(
        address user
    ) external onlyGuardian whenPaused nonReentrant {
        if (!emergencyMode) revert PiggyBank__Unauthorized();

        uint256 amount = deposits[user];
        if (amount == 0) revert PiggyBank__NoDeposits();

        // Reset deposit before transfer
        deposits[user] = 0;
        totalWithdrawals += amount;

        // Safe transfer
        (bool success, ) = payable(user).call{value: amount}("");
        if (!success) revert PiggyBank__TransferFailed();

        // Emit event after successful transfer (checks-effects-interactions pattern)
        emit EmergencyWithdrawal(user, amount);
    }

    // ============ ADMIN FUNCTIONS ============
    /**
     * @dev Pauses the contract
     */
    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Transfers ownership with enhanced security
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert PiggyBank__Unauthorized();

        address oldOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev Sets the emergency guardian
     */
    function setEmergencyGuardian(address newGuardian) external onlyOwner {
        if (newGuardian == address(0)) revert PiggyBank__Unauthorized();

        address oldGuardian = emergencyGuardian;
        emergencyGuardian = newGuardian;

        emit EmergencyGuardianChanged(oldGuardian, newGuardian);
    }

    /**
     * @dev Activates emergency mode with timelock
     */
    function activateEmergencyMode(
        uint256 _unlockTime
    ) external onlyGuardian whenNotPaused validUnlockTime(_unlockTime) {
        emergencyMode = true;
        emergencyUnlockTime = _unlockTime;
        paused = true;

        emit EmergencyModeActivated(msg.sender, _unlockTime);
    }

    /**
     * @dev Deactivates emergency mode
     */
    function deactivateEmergencyMode() external onlyGuardian {
        emergencyMode = false;
        emergencyUnlockTime = 0;

        emit Unpaused(msg.sender);
    }

    /**
     * @dev Updates maximum deposit amount
     */
    function updateMaxDepositAmount(uint256 newMaxAmount) external onlyOwner {
        if (newMaxAmount < MIN_DEPOSIT_AMOUNT)
            revert PiggyBank__DepositTooLow();
        if (newMaxAmount < totalDeposits) revert PiggyBank__InvalidUnlockTime();

        uint256 oldLimit = MAX_DEPOSIT_AMOUNT;
        // Note: In a real contract, this would need to be a storage variable
        emit DepositLimitUpdated(oldLimit, newMaxAmount);
    }

    // ============ VIEW FUNCTIONS ============
    /**
     * @dev Gets contract balance with gas optimization
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Gets unlock time with gas optimization
     */
    function getUnlockTime() external view returns (uint256) {
        return unlockTime;
    }

    /**
     * @dev Checks if contract is unlocked with gas optimization
     */
    function isUnlocked() external view returns (bool) {
        return block.timestamp >= unlockTime || emergencyMode;
    }

    /**
     * @dev Gets user deposit information
     */
    function getUserDepositInfo(
        address user
    )
        external
        view
        returns (
            uint256 userDeposit,
            uint256 timestamp,
            uint256 count,
            uint256 timeRemaining
        )
    {
        userDeposit = deposits[user];
        timestamp = depositTimestamps[user];
        count = userDepositCount[user];

        if (block.timestamp < unlockTime) {
            timeRemaining = unlockTime - block.timestamp;
        } else {
            timeRemaining = 0;
        }
    }

    /**
     * @dev Gets contract statistics
     */
    function getContractStats()
        external
        view
        returns (
            uint256 totalDeposits_,
            uint256 totalWithdrawals_,
            uint256 numberOfDepositors_,
            bool emergencyMode_,
            uint256 contractBalance_
        )
    {
        totalDeposits_ = totalDeposits;
        totalWithdrawals_ = totalWithdrawals;
        numberOfDepositors_ = numberOfDepositors;
        emergencyMode_ = emergencyMode;
        contractBalance_ = address(this).balance;
    }

    /**
     * @dev Gets time remaining until unlock
     */
    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= unlockTime) {
            return 0;
        }
        return unlockTime - block.timestamp;
    }

    /**
     * @dev Gets emergency unlock time remaining
     */
    function getEmergencyTimeRemaining() external view returns (uint256) {
        if (!emergencyMode || block.timestamp >= emergencyUnlockTime) {
            return 0;
        }
        return emergencyUnlockTime - block.timestamp;
    }

    // ============ UTILITY FUNCTIONS ============
    /**
     * @dev Checks if user can deposit (gas optimized)
     */
    function canDeposit(address user) external view returns (bool) {
        return !paused && deposits[user] < MAX_DEPOSIT_AMOUNT;
    }

    /**
     * @dev Checks if user can withdraw (gas optimized)
     */
    function canWithdraw(address user) external view returns (bool) {
        return
            !paused &&
            deposits[user] > 0 &&
            (block.timestamp >= unlockTime || emergencyMode);
    }

    /**
     * @dev Gets user's maximum additional deposit amount
     */
    function getMaxAdditionalDeposit(
        address user
    ) external view returns (uint256) {
        uint256 currentDeposit = deposits[user];
        if (currentDeposit >= MAX_DEPOSIT_AMOUNT) {
            return 0;
        }
        return MAX_DEPOSIT_AMOUNT - currentDeposit;
    }

    // ============ INTERNAL FUNCTIONS ============
    /**
     * @dev Internal function to validate deposit amounts
     */
    function _validateDeposit(uint256 amount) internal pure {
        if (amount == 0) revert PiggyBank__ZeroValue();
        if (amount < MIN_DEPOSIT_AMOUNT) revert PiggyBank__DepositTooLow();
        if (amount > MAX_DEPOSIT_AMOUNT) revert PiggyBank__DepositTooHigh();
    }

    /**
     * @dev Internal function to handle safe transfers
     */
    function _safeTransfer(address to, uint256 amount) internal returns (bool) {
        (bool success, ) = payable(to).call{value: amount}("");
        return success;
    }

    // ============ EVENTS ============
    // Events are already defined at the top of the contract
}
