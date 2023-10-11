import * as dotenv from "dotenv";
import {HardhatUserConfig, task} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@primitivefi/hardhat-dodoc';
import "solidity-coverage";
import "hardhat-deploy";

dotenv.config()

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
})

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  defaultNetwork: 'ganache',
  networks: {
    ganache: {
      accounts: {
        count: 10,
        mnemonic: `${process.env.MNEMONIC}`,
      },
      chainId: 1337,
      url: `http://127.0.0.1:7545`,
    },
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 10,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  gasReporter: {
    enabled: true,
    currency: "USD"
  },
  dodoc: {
    runOnCompile: false,
    debugMode: false,
  }
};

export default config;
