const { ethers } = require("ethers");

const main = async () => {
    const [deployer] = await hre.ethers.getSigners();
    const accountBalance = await deployer.getBalance();
  
    console.log("Deploying contracts with account: ", deployer.address);
    console.log("Account balance: ", accountBalance.toString());
  
    const theShouterFactory = await hre.ethers.getContractFactory("TheShouter");
    const theShouter = await theShouterFactory.deploy();
    await theShouter.deployed();
  
    console.log("Contract address: ", theShouter.address);

    // await theShouter.rentBoard("QmQ5nHBEPnsZpZbH8LNFHYNkfJtHphH4DHzF8bCXZvfosi", {
    //     value: ethers.utils.parseEther("1.0")
    // });
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
  