import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Wallet Contract", function () {
  async function deployWalletFixture() {
    const [owner, addr1, addr2] = await hre.ethers.getSigners();

    const Wallet = await hre.ethers.getContractFactory("Wallet");
    const wallet = await Wallet.deploy();

    return { wallet, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should deploy and initialize deposit count to zero", async function () {
      const { wallet } = await loadFixture(deployWalletFixture);
      expect(await wallet.getDepositCount()).to.equal(0);
    });
  });

  describe("Deposits", function () {
    it("Should accept deposits via receive()", async function () {
      const { wallet, owner } = await loadFixture(deployWalletFixture);

      await owner.sendTransaction({
        to: wallet,
        value: hre.ethers.parseEther("1"),
      });

      expect(await wallet.getContractBalance()).to.equal(
        hre.ethers.parseEther("1")
      );
      expect(await wallet.getDepositCount()).to.equal(1);
    });

    it("Should accept deposits via fallback()", async function () {
      const { wallet, addr1 } = await loadFixture(deployWalletFixture);

      await addr1.sendTransaction({
        to: wallet,
        value: hre.ethers.parseEther("0.5"),
        data: "0x1234",
      });

      expect(await wallet.getContractBalance()).to.equal(
        hre.ethers.parseEther("0.5")
      );
      expect(await wallet.getDepositCount()).to.equal(1);
    });

    it("Should emit Deposit event on deposit", async function () {
      const { wallet, addr1 } = await loadFixture(deployWalletFixture);
      await expect(
        addr1.sendTransaction({
          to: wallet,
          value: hre.ethers.parseEther("1"),
        })
      )
        .to.emit(wallet, "Deposit")
        .withArgs(addr1.address, hre.ethers.parseEther("1"), 1);
    });
  });

  describe("Transfers", function () {
    it("Should transfer funds using transfer", async function () {
      const { wallet, owner, addr1 } = await loadFixture(deployWalletFixture);
      const initialBalance = await hre.ethers.provider.getBalance(
        addr1.address
      );

      await owner.sendTransaction({
        to: wallet,
        value: hre.ethers.parseEther("2"),
      });

      await wallet.sendViaTransfer(addr1.address, hre.ethers.parseEther("1"));

      const finalBalance = await hre.ethers.provider.getBalance(addr1.address);
      expect(finalBalance - initialBalance).to.equal(
        hre.ethers.parseEther("1")
      );
    });

    it("Should send funds using send", async function () {
      const { wallet, owner, addr1 } = await loadFixture(deployWalletFixture);
      const initialBalance = await hre.ethers.provider.getBalance(addr1);

      await owner.sendTransaction({
        to: wallet,
        value: hre.ethers.parseEther("2"),
      });

      await wallet.sendViaSend(addr1, hre.ethers.parseEther("1"));

      const finalBalance = await hre.ethers.provider.getBalance(addr1);
      expect(finalBalance - initialBalance).to.equal(
        hre.ethers.parseEther("1")
      );
    });

    it("Should call and send funds using call", async function () {
      const { wallet, owner, addr1 } = await loadFixture(deployWalletFixture);
      const initialBalance = await hre.ethers.provider.getBalance(
        addr1.address
      );

      await owner.sendTransaction({
        to: wallet,
        value: hre.ethers.parseEther("2"),
      });

      await wallet.sendViaCall(addr1, hre.ethers.parseEther("1"));

      const finalBalance = await hre.ethers.provider.getBalance(addr1.address);
      expect(finalBalance - initialBalance).to.equal(
        hre.ethers.parseEther("1")
      );
    });

    it("Should revert with not enough balance if balance doesn't equal amount to withdraw", async function () {
      const { wallet, owner, addr1 } = await loadFixture(deployWalletFixture);

      await owner.sendTransaction({
        to: wallet,
        value: hre.ethers.parseEther("0.5"),
      });
      const withdrawalAmount = hre.ethers.parseEther("1");
      await expect(
        wallet.sendViaCall(addr1, withdrawalAmount)
      ).to.revertedWith("Not enough balance");
    });
  });
});
