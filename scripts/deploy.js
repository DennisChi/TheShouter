const { ethers } = require("ethers");

const main = async () => {
    const [deployer] = await hre.ethers.getSigners();
    const accountBalance = await deployer.getBalance();
    const forwarder = require('../build/gsn/Forwarder').address
    const paymaster = require('../build/gsn/Paymaster').address

    console.log("Deploying contracts with account: ", deployer.address);
    console.log("Account balance: ", accountBalance.toString());
  
    const theShouterFactory = await hre.ethers.getContractFactory("TheShouter");
    const theShouter = await theShouterFactory.deploy(forwarder);
    await theShouter.deployed();
  
    console.log("Contract address: ", theShouter.address);
    theShouter.setPaymaster(paymaster);
    console.log("Paymaster setted")

    const b = await theShouter.remain();
    console.log('balance', b)

    const tx = await theShouter.rentBoard("QmQ5nHBEPnsZpZbH8LNFHYNkfJtHphH4DHzF8bCXZvfosi", {
        value: ethers.utils.parseEther("1.0")
    });

    console.log("Deploy finished!")
  };
  
  const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();
  