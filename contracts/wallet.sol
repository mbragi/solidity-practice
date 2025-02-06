// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.7.0 <0.9.0;

contract Wallet {
    address public owner;
    uint256 public depositCount;

    event Deposit(address indexed sender, uint256 amount, uint256 count);
    event Withdrawal(address indexed receiver, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ContractDestroyed(address indexed owner, uint256 balanceReturned);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    fallback() external payable {
        depositCount++;
        emit Deposit(msg.sender, msg.value, depositCount);
    }

    receive() external payable {
        depositCount++;
        emit Deposit(msg.sender, msg.value, depositCount);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getDepositCount() public view returns (uint256) {
        return depositCount;
    }

    function withdraw(address payable _to, uint256 _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Insufficient funds");
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Withdrawal failed");
        emit Withdrawal(_to, _amount);
    }

    function sendViaTransfer(address payable _to, uint256 _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Not enough balance");
        _to.transfer(_amount);
        emit Withdrawal(_to, _amount);
    }

    function sendViaSend(address payable _to, uint256 _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Not enough balance");
        bool success = _to.send(_amount);
        require(success, "Send failed");
        emit Withdrawal(_to, _amount);
    }

    function sendViaCall(address payable _to, uint256 _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Not enough balance");
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Call failed");
        emit Withdrawal(_to, _amount);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
