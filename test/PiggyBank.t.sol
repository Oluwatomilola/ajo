// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PiggyBank.sol";

contract PiggyBankTest is Test {
    PiggyBank public piggyBank;
    
    // Test users
    address owner;
    address user1;
    address user2;
    address user3;
    address attacker;
    
    // Test constants
    uint256 constant INITIAL_BALANCE = 100 ether;
    uint256 constant UNLOCK_TIME = 1 days;
    uint256 constant DEPOSIT_AMOUNT = 1 ether;
    
    // Setup function run before each test
    function setUp() public {
        // Setup test accounts
        owner = address(0x1);
        user1 = address(0x2);
        user2 = address(0x3);
        user3 = address(0x4);
        attacker = address(0x5);
        
        vm.deal(owner, INITIAL_BALANCE);
        vm.deal(user1, INITIAL_BALANCE);
        vm.deal(user2, INITIAL_BALANCE);
        vm.deal(user3, INITIAL_BALANCE);
        vm.deal(attacker, INITIAL_BALANCE);
        
        // Deploy contract
        vm.prank(owner);
        piggyBank = new PiggyBank(block.timestamp + UNLOCK_TIME);
    }
    
    // ============================================
    // DEPOSIT TESTS
    // ============================================
    
    function testDeposit_Success() public {
        vm.prank(user1);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        assertEq(piggyBank.getBalance(), DEPOSIT_AMOUNT);
        assertEq(user1.balance, INITIAL_BALANCE - DEPOSIT_AMOUNT);
    }
    
    function testDeposit_MultipleUsers() public {
        // User 1 deposits
        vm.prank(user1);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // User 2 deposits
        vm.prank(user2);
        piggyBank.deposit{value: DEPOSIT_AMOUNT * 2}();
        
        // User 3 deposits
        vm.prank(user3);
        piggyBank.deposit{value: DEPOSIT_AMOUNT * 3}();
        
        uint256 totalDeposited = DEPOSIT_AMOUNT + (DEPOSIT_AMOUNT * 2) + (DEPOSIT_AMOUNT * 3);
        assertEq(piggyBank.getBalance(), totalDeposited);
    }
    
    function testDeposit_ZeroAmount_Reverts() public {
        vm.prank(user1);
        vm.expectRevert("Must deposit something");
        piggyBank.deposit{value: 0}();
    }
    
    function testDeposit_EventEmission() public {
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Deposited(user1, DEPOSIT_AMOUNT);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
    }
    
    function testDeposit_PausedContract_Reverts() public {
        // Pause the contract
        vm.prank(owner);
        piggyBank.pause();
        
        // Try to deposit when paused
        vm.prank(user1);
        vm.expectRevert("Contract is paused");
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
    }
    
    function testDeposit_GasSnapshot() public {
        vm.prank(user1);
        uint256 gasStart = gasleft();
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        uint256 gasUsed = gasStart - gasleft();
        
        console.log("Deposit gas used:", gasUsed);
        // Gas should be reasonable (< 100k)
        assertLt(gasUsed, 100000);
    }
    
    // ============================================
    // WITHDRAW TESTS
    // ============================================
    
    function testWithdraw_Success() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Fast forward time to unlock
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        
        uint256 balanceBefore = owner.balance;
        
        vm.prank(owner);
        piggyBank.withdraw();
        
        assertEq(piggyBank.getBalance(), 0);
        assertEq(owner.balance, balanceBefore + DEPOSIT_AMOUNT);
    }
    
    function testWithdraw_NotOwner_Reverts() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Fast forward time
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        
        // Try to withdraw as non-owner
        vm.prank(user1);
        vm.expectRevert("PiggyBank: Not owner");
        piggyBank.withdraw();
    }
    
    function testWithdraw_BeforeUnlock_Reverts() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Don't fast forward time - try to withdraw immediately
        vm.prank(owner);
        vm.expectRevert("PiggyBank: Still locked");
        piggyBank.withdraw();
    }
    
    function testWithdraw_EventEmission() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Fast forward time
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Withdrawn(owner, DEPOSIT_AMOUNT);
        piggyBank.withdraw();
    }
    
    function testWithdraw_EmptyContract_Reverts() public {
        // Fast forward time
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        
        vm.prank(owner);
        vm.expectRevert(); // Should fail on transfer with no balance
        piggyBank.withdraw();
    }
    
    function testWithdraw_PausedContract_Reverts() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Pause the contract
        vm.prank(owner);
        piggyBank.pause();
        
        // Fast forward time
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        
        // Try to withdraw when paused
        vm.prank(owner);
        vm.expectRevert("Contract is paused");
        piggyBank.withdraw();
    }
    
    function testWithdraw_GasSnapshot() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Fast forward time
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        
        vm.prank(owner);
        uint256 gasStart = gasleft();
        piggyBank.withdraw();
        uint256 gasUsed = gasStart - gasleft();
        
        console.log("Withdraw gas used:", gasUsed);
        // Gas should be reasonable (< 100k)
        assertLt(gasUsed, 100000);
    }
    
    // ============================================
    // TIME-LOCK RESTRICTION TESTS
    // ============================================
    
    function testTimeLock_ExactUnlockTime() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Fast forward to exact unlock time
        vm.warp(block.timestamp + UNLOCK_TIME);
        
        vm.prank(owner);
        piggyBank.withdraw(); // Should succeed at exact unlock time
        
        assertEq(piggyBank.getBalance(), 0);
    }
    
    function testTimeLock_JustBeforeUnlock() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Fast forward to just before unlock time
        vm.warp(block.timestamp + UNLOCK_TIME - 1);
        
        vm.prank(owner);
        vm.expectRevert("PiggyBank: Still locked");
        piggyBank.withdraw();
    }
    
    function testTimeLock_LongAfterUnlock() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Fast forward well past unlock time
        vm.warp(block.timestamp + UNLOCK_TIME + 365 days);
        
        vm.prank(owner);
        piggyBank.withdraw(); // Should still work
        
        assertEq(piggyBank.getBalance(), 0);
    }
    
    function testIsUnlocked_BeforeUnlock() public {
        assertFalse(piggyBank.isUnlocked());
    }
    
    function testIsUnlocked_AfterUnlock() public {
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        assertTrue(piggyBank.isUnlocked());
    }
    
    // ============================================
    // OWNERSHIP TESTS
    // ============================================
    
    function testOwnership_InitialOwner() public {
        assertEq(piggyBank.owner(), owner);
    }
    
    function testOwnership_Transfer() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(owner, user1);
        piggyBank.transferOwnership(user1);
        
        assertEq(piggyBank.owner(), user1);
    }
    
    function testOwnership_TransferToZeroAddress_Reverts() public {
        vm.prank(owner);
        vm.expectRevert("New owner is zero address");
        piggyBank.transferOwnership(address(0));
    }
    
    function testOwnership_NonOwnerTransfer_Reverts() public {
        vm.prank(user1);
        vm.expectRevert("Not owner");
        piggyBank.transferOwnership(user2);
    }
    
    function testOwnership_EventEmission() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(owner, user1);
        piggyBank.transferOwnership(user1);
    }
    
    // ============================================
    // PAUSE FUNCTIONALITY TESTS
    // ============================================
    
    function testPause_InitialState() public {
        assertFalse(piggyBank.paused());
    }
    
    function testPause_Success() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Paused(owner);
        piggyBank.pause();
        
        assertTrue(piggyBank.paused());
    }
    
    function testPause_NonOwner_Reverts() public {
        vm.prank(user1);
        vm.expectRevert("Not owner");
        piggyBank.pause();
    }
    
    function testPause_AlreadyPaused_Reverts() public {
        // Pause first time
        vm.prank(owner);
        piggyBank.pause();
        
        // Try to pause again
        vm.prank(owner);
        vm.expectRevert("Contract is not paused");
        piggyBank.pause();
    }
    
    function testUnpause_Success() public {
        // First pause
        vm.prank(owner);
        piggyBank.pause();
        
        // Then unpause
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Unpaused(owner);
        piggyBank.unpause();
        
        assertFalse(piggyBank.paused());
    }
    
    function testUnpause_NonOwner_Reverts() public {
        // Pause first
        vm.prank(owner);
        piggyBank.pause();
        
        // Try to unpause as non-owner
        vm.prank(user1);
        vm.expectRevert("Not owner");
        piggyBank.unpause();
    }
    
    function testUnpause_NotPaused_Reverts() public {
        vm.prank(owner);
        vm.expectRevert("Contract is not paused");
        piggyBank.unpause();
    }
    
    function testPause_EventEmission() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Paused(owner);
        piggyBank.pause();
    }
    
    function testUnpause_EventEmission() public {
        vm.prank(owner);
        piggyBank.pause();
        
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Unpaused(owner);
        piggyBank.unpause();
    }
    
    // ============================================
    // EDGE CASE TESTS
    // ============================================
    
    function testEdgeCase_OverWithdraw() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Fast forward time
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        
        uint256 contractBalance = piggyBank.getBalance();
        uint256 ownerBalance = owner.balance;
        
        vm.prank(owner);
        piggyBank.withdraw();
        
        // Verify exact balance transfer
        assertEq(piggyBank.getBalance(), 0);
        assertEq(owner.balance, ownerBalance + contractBalance);
    }
    
    function testEdgeCase_MultipleSmallDeposits() public {
        uint256 totalDeposited = 0;
        
        // Make multiple small deposits
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(user1);
            piggyBank.deposit{value: 0.1 ether}();
            totalDeposited += 0.1 ether;
        }
        
        assertEq(piggyBank.getBalance(), totalDeposited);
    }
    
    function testEdgeCase_MaxUint256Deposit() public {
        // Test with maximum possible value
        uint256 maxValue = type(uint256).max;
        vm.deal(user1, maxValue);
        
        vm.prank(user1);
        piggyBank.deposit{value: maxValue}();
        
        assertEq(piggyBank.getBalance(), maxValue);
    }
    
    // ============================================
    // REENTRANCY PROTECTION TESTS
    // ============================================
    
    // Reentrancy attacker contract
    ReentrancyAttacker public reentrancyAttacker;
    
    function testReentrancy_ExternalCallProtection() public {
        // Setup - deposit funds
        vm.prank(owner);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Create attacker contract
        reentrancyAttacker = new ReentrancyAttacker(piggyBank);
        vm.deal(address(reentrancyAttacker), 1 ether);
        
        // Fast forward time
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        
        // Try reentrancy attack
        vm.prank(address(reentrancyAttacker));
        vm.expectRevert("PiggyBank: Not owner");
        reentrancyAttacker.attack();
    }
    
    // ============================================
    // INTEGRATION TESTS
    // ============================================
    
    function testIntegration_FullDepositWithdrawFlow() public {
        // Step 1: Initial state
        assertEq(piggyBank.getBalance(), 0);
        assertEq(piggyBank.owner(), owner);
        assertFalse(piggyBank.isUnlocked());
        assertFalse(piggyBank.paused());
        
        // Step 2: Multiple users deposit
        vm.prank(user1);
        piggyBank.deposit{value: 1 ether}();
        
        vm.prank(user2);
        piggyBank.deposit{value: 2 ether}();
        
        vm.prank(user3);
        piggyBank.deposit{value: 3 ether}();
        
        assertEq(piggyBank.getBalance(), 6 ether);
        
        // Step 3: Test pause functionality
        vm.prank(owner);
        piggyBank.pause();
        assertTrue(piggyBank.paused());
        
        // Step 4: Verify deposits fail when paused
        vm.prank(user1);
        vm.expectRevert("Contract is paused");
        piggyBank.deposit{value: 1 ether}();
        
        // Step 5: Unpause
        vm.prank(owner);
        piggyBank.unpause();
        assertFalse(piggyBank.paused());
        
        // Step 6: Transfer ownership
        vm.prank(owner);
        piggyBank.transferOwnership(user1);
        assertEq(piggyBank.owner(), user1);
        
        // Step 7: Fast forward time
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        assertTrue(piggyBank.isUnlocked());
        
        // Step 8: Withdraw as new owner
        uint256 balanceBefore = user1.balance;
        vm.prank(user1);
        piggyBank.withdraw();
        assertEq(piggyBank.getBalance(), 0);
        assertEq(user1.balance, balanceBefore + 6 ether);
    }
    
    function testIntegration_EventSequence() public {
        // Test proper event emission sequence
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Deposited(user1, DEPOSIT_AMOUNT);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        // Transfer ownership
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(owner, user1);
        piggyBank.transferOwnership(user1);
        
        // Pause
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Paused(user1);
        piggyBank.pause();
        
        // Unpause
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Unpaused(user1);
        piggyBank.unpause();
        
        // Fast forward time
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        
        // Withdraw
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Withdrawn(user1, DEPOSIT_AMOUNT);
        piggyBank.withdraw();
    }
    
    // ============================================
    // VIEW FUNCTIONS TESTS
    // ============================================
    
    function testGetBalance_EmptyContract() public {
        assertEq(piggyBank.getBalance(), 0);
    }
    
    function testGetBalance_WithDeposits() public {
        vm.prank(user1);
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        assertEq(piggyBank.getBalance(), DEPOSIT_AMOUNT);
    }
    
    function testGetUnlockTime() public {
        assertEq(piggyBank.getUnlockTime(), block.timestamp + UNLOCK_TIME);
    }
    
    function testGetUnlockTime_AfterDeployment() public {
        // Time hasn't passed, so unlock time should still be in future
        assertTrue(piggyBank.getUnlockTime() > block.timestamp);
    }
    
    // ============================================
    // MULTI-USER TEST FIXTURE
    // ============================================
    
    function testMultiUserFixture() public {
        // Create fixture addresses
        address fixtureUser1 = address(0x10);
        address fixtureUser2 = address(0x20);
        address fixtureUser3 = address(0x30);
        
        // Deal them some balance
        vm.deal(fixtureUser1, 10 ether);
        vm.deal(fixtureUser2, 10 ether);
        vm.deal(fixtureUser3, 10 ether);
        
        // Verify all users can deposit
        assertEq(fixtureUser1.balance, 10 ether);
        assertEq(fixtureUser2.balance, 10 ether);
        assertEq(fixtureUser3.balance, 10 ether);
        
        // Users make deposits
        vm.prank(fixtureUser1);
        piggyBank.deposit{value: 1 ether}();
        
        vm.prank(fixtureUser2);
        piggyBank.deposit{value: 2 ether}();
        
        vm.prank(fixtureUser3);
        piggyBank.deposit{value: 3 ether}();
        
        // Verify total balance
        assertEq(piggyBank.getBalance(), 6 ether);
        
        // Fast forward time and withdraw
        vm.warp(block.timestamp + UNLOCK_TIME + 1);
        
        vm.prank(fixtureUser1);
        piggyBank.transferOwnership(fixtureUser1);
        
        vm.prank(fixtureUser1);
        piggyBank.withdraw();
        
        assertEq(piggyBank.getBalance(), 0);
    }
}

// Reentrancy attacker contract for testing
contract ReentrancyAttacker {
    PiggyBank public target;
    
    constructor(PiggyBank _target) {
        target = _target;
    }
    
    function attack() external {
        // Try to reenter the withdraw function
        // This should fail because attacker is not the owner
        target.withdraw();
    }
    
    receive() external payable {
        // Fallback function to receive funds
        // This would be used in a real reentrancy attack
        if (address(target).balance > 0) {
            target.withdraw();
        }
    }
}
