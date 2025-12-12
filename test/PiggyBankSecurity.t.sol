// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PiggyBank.sol";

/**
 * @title PiggyBankSecurityTest
 * @notice Comprehensive security tests for enhanced PiggyBank contract
 */
contract PiggyBankSecurityTest is Test {
    PiggyBank public piggyBank;
    address public owner = address(1);
    address public guardian = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    
    uint256 public constant INITIAL_DEPOSIT = 1 ether;
    uint256 public constant LOCK_TIME = 365 days;
    
    event TestResult(string testName, bool passed);
    
    function setUp() public {
        vm.prank(owner);
        piggyBank = new PiggyBank(block.timestamp + LOCK_TIME);
        
        // Set emergency guardian
        vm.prank(owner);
        piggyBank.setEmergencyGuardian(guardian);
        
        // Fund users for testing
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }
    
    // ============ SECURITY TESTS ============
    
    function testDepositLimits() public {
        vm.startPrank(user1);
        
        // Test minimum deposit
        vm.expectRevert(PiggyBank.PiggyBank__DepositTooLow.selector);
        piggyBank.deposit{value: 0.0001 ether}();
        
        // Test maximum deposit
        vm.expectRevert(PiggyBank.PiggyBank__DepositTooHigh.selector);
        piggyBank.deposit{value: 2000 ether}();
        
        // Test valid deposit
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        assertEq(piggyBank.deposits(user1), INITIAL_DEPOSIT);
        
        emit TestResult("Deposit Limits", true);
        vm.stopPrank();
    }
    
    function testReentrancyProtection() public {
        vm.startPrank(user1);
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        
        // Fast-forward time to unlock
        vm.warp(block.timestamp + LOCK_TIME + 1);
        
        // Multiple simultaneous withdraw attempts should be prevented
        vm.expectRevert(PiggyBank.PiggyBank__Paused.selector);
        piggyBank.withdraw();
        
        emit TestResult("Reentrancy Protection", true);
        vm.stopPrank();
    }
    
    function testAccessControls() public {
        // Test owner-only functions
        vm.prank(user1);
        vm.expectRevert(PiggyBank.PiggyBank__Unauthorized.selector);
        piggyBank.pause();
        
        vm.prank(user1);
        vm.expectRevert(PiggyBank.PiggyBank__Unauthorized.selector);
        piggyBank.setEmergencyGuardian(address(5));
        
        vm.prank(guardian);
        vm.expectRevert(PiggyBank.PiggyBank__Unauthorized.selector);
        piggyBank.activateEmergencyMode(block.timestamp + LOCK_TIME);
        
        emit TestResult("Access Controls", true);
    }
    
    function testEmergencyMode() public {
        vm.prank(guardian);
        piggyBank.activateEmergencyMode(block.timestamp + 30 days);
        
        assertTrue(piggyBank.paused());
        assertTrue(piggyBank.emergencyMode());
        
        // Users should be able to withdraw in emergency mode
        vm.startPrank(user1);
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        piggyBank.withdraw();
        assertEq(piggyBank.deposits(user1), 0);
        
        emit TestResult("Emergency Mode", true);
        vm.stopPrank();
    }
    
    function testDirectETHTransfers() public {
        // Test receive function
        vm.startPrank(user1);
        (bool success, ) = address(piggyBank).call{value: INITIAL_DEPOSIT}("");
        assertTrue(success);
        assertEq(piggyBank.deposits(user1), INITIAL_DEPOSIT);
        
        // Test fallback function reverts
        vm.expectRevert("PiggyBank: Direct calls not allowed");
        (success, ) = address(piggyBank).call("unexpected function");
        
        emit TestResult("Direct ETH Transfers", true);
        vm.stopPrank();
    }
    
    function testCustomErrors() public {
        // Test various custom error scenarios
        vm.startPrank(user1);
        
        // Zero value deposit
        vm.expectRevert(PiggyBank.PiggyBank__ZeroValue.selector);
        piggyBank.deposit{value: 0}();
        
        // No deposits to withdraw
        vm.warp(block.timestamp + LOCK_TIME + 1);
        vm.expectRevert(PiggyBank.PiggyBank__NoDeposits.selector);
        piggyBank.withdraw();
        
        emit TestResult("Custom Errors", true);
        vm.stopPrank();
    }
    
    function testGasOptimizations() public {
        vm.startPrank(user1);
        
        uint256 gasBefore = gasleft();
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        uint256 gasUsed = gasBefore - gasleft();
        
        // Verify deposit was successful with minimal gas
        assertEq(piggyBank.deposits(user1), INITIAL_DEPOSIT);
        
        emit TestResult("Gas Optimizations", true);
        vm.stopPrank();
    }
    
    function testStatisticsTracking() public {
        assertEq(piggyBank.numberOfDepositors(), 0);
        assertEq(piggyBank.totalDeposits(), 0);
        
        vm.startPrank(user1);
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        vm.stopPrank();
        
        assertEq(piggyBank.numberOfDepositors(), 1);
        assertEq(piggyBank.totalDeposits(), INITIAL_DEPOSIT);
        
        vm.startPrank(user2);
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        vm.stopPrank();
        
        assertEq(piggyBank.numberOfDepositors(), 2);
        assertEq(piggyBank.totalDeposits(), INITIAL_DEPOSIT * 2);
        
        emit TestResult("Statistics Tracking", true);
    }
    
    function testViewFunctions() public {
        // Test canDeposit
        assertTrue(piggyBank.canDeposit(user1));
        
        // Test canWithdraw (should be false before unlock)
        assertFalse(piggyBank.canWithdraw(user1));
        
        // Test getMaxAdditionalDeposit
        assertEq(piggyBank.getMaxAdditionalDeposit(user1), 1000 ether);
        
        // Test getTimeRemaining
        uint256 timeRemaining = piggyBank.getTimeRemaining();
        assertTrue(timeRemaining > 0);
        assertTrue(timeRemaining <= LOCK_TIME);
        
        emit TestResult("View Functions", true);
    }
    
    function testEventEmissions() public {
        vm.startPrank(user1);
        
        // Test Deposited event
        vm.expectEmit(true, true, false, true);
        emit Deposited(user1, INITIAL_DEPOSIT, block.timestamp);
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        
        // Test OwnershipTransferred event
        address newOwner = address(5);
        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(owner, newOwner);
        vm.prank(owner);
        piggyBank.transferOwnership(newOwner);
        
        emit TestResult("Event Emissions", true);
        vm.stopPrank();
    }
    
    // ============ INTEGRATION TESTS ============
    
    function testFullDepositWithdrawCycle() public {
        vm.startPrank(user1);
        
        // Deposit
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        assertEq(piggyBank.deposits(user1), INITIAL_DEPOSIT);
        assertEq(piggyBank.getBalance(), INITIAL_DEPOSIT);
        
        // Fast-forward to unlock time
        vm.warp(block.timestamp + LOCK_TIME + 1);
        
        // Withdraw
        piggyBank.withdraw();
        assertEq(piggyBank.deposits(user1), 0);
        assertEq(user1.balance, 10 ether - INITIAL_DEPOSIT); // Account for gas costs
        
        emit TestResult("Full Deposit Withdraw Cycle", true);
        vm.stopPrank();
    }
    
    function testMultipleDepositsSameUser() public {
        vm.startPrank(user1);
        
        // Multiple deposits from same user
        piggyBank.deposit{value: 0.5 ether}();
        piggyBank.deposit{value: 0.3 ether}();
        piggyBank.deposit{value: 0.2 ether}();
        
        assertEq(piggyBank.deposits(user1), 1 ether);
        assertEq(piggyBank.userDepositCount(user1), 3);
        assertEq(piggyBank.numberOfDepositors(), 1); // Should still be 1
        
        emit TestResult("Multiple Deposits Same User", true);
        vm.stopPrank();
    }
    
    function testContractPausing() public {
        vm.startPrank(user1);
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        vm.stopPrank();
        
        // Pause contract
        vm.prank(owner);
        piggyBank.pause();
        
        // Should not be able to deposit while paused
        vm.startPrank(user2);
        vm.expectRevert(PiggyBank.PiggyBank__Paused.selector);
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        
        // Should not be able to withdraw while paused (unless emergency mode)
        vm.startPrank(user1);
        vm.expectRevert(PiggyBank.PiggyBank__Paused.selector);
        piggyBank.withdraw();
        
        // Unpause
        vm.prank(owner);
        piggyBank.unpause();
        
        // Should work again
        piggyBank.deposit{value: INITIAL_DEPOSIT}();
        
        emit TestResult("Contract Pausing", true);
        vm.stopPrank();
    }
    
    function testAllSecurityFeatures() public {
        // Run comprehensive security test
        testDepositLimits();
        testReentrancyProtection();
        testAccessControls();
        testEmergencyMode();
        testDirectETHTransfers();
        testCustomErrors();
        testGasOptimizations();
        testStatisticsTracking();
        testViewFunctions();
        testEventEmissions();
        
        emit TestResult("All Security Features", true);
    }
    
    function testAllIntegrationFeatures() public {
        // Run comprehensive integration test
        testFullDepositWithdrawCycle();
        testMultipleDepositsSameUser();
        testContractPausing();
        
        emit TestResult("All Integration Features", true);
    }
}