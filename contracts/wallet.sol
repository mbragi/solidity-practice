// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.7.0 <0.9.0;

contract Wallet {
    uint256 public depositCount;

    event Deposit(address indexed sender, uint256 amount, uint256 count);

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

    function sendViaTransfer(address payable _to, uint256 _amount) public {
        _to.transfer(_amount);
    }

    function sendViaSend(address payable _to, uint256 _amount) public {
        require(address(this).balance >= _amount, "Not enough balance");
        bool success = _to.send(_amount);
        require(success, "Send failed");
    }

    function sendViaCall(address payable _to, uint256 _amount) public {
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Call failed");
    }
}
