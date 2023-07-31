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
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 10,
      },
    },
    ganache: {
      accounts: {
        count: 10,
        mnemonic: `stool goddess amazing auction bargain lamp empty hire similar vote peanut kidney`,
      },
      chainId: 1337,
      url: `http://127.0.0.1:8545`,
    },
    goerli: {
      accounts: {
        count: 10,
        mnemonic: `${process.env.MNEMONIC}`,
      },
      chainId: 5,
      url: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`
    },
    sepolia: {
      accounts: {
        count: 10,
        mnemonic: `${process.env.MNEMONIC}`,
      },
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_ID}`
    },
    mumbai: {
      accounts: {
        count: 10,
        mnemonic: `${process.env.MNEMONIC}`,
      },
      chainId: 80001,
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_ID}`
    }
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
