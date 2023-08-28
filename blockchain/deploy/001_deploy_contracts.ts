import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const contractDeploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  // Actors contract deployment.
  await deploy('Actors', {
    contract: 'Actors',
    from: deployer,
    args: ["DevFest Actors","DFA"],
    log: true
  });

  // Actors contract deployment.
  await deploy('Directors', {
    contract: 'Directors',
    from: deployer,
    args: ["DevFest Directors","DFD"],
    log: true
  });

  //Movies contract deployment
  await deploy('Movies', {
    contract: 'Movies',
    from: deployer,
    args: ["DevFest Movies","DFM"],
    log: true
  });

  // Jurys contract deplopy
  await deploy('Jurys', {
    contract: 'Jurys',
    from: deployer,
    args: ["DevFest sbt jury","SBT"],
    log: true
  });

  // Competition contract deployment
  await deploy('Competitions', {
    contract: 'Competitions',
    from: deployer,
    args: ["DevFest Competition","DFC"],
    log: true
  });
};
export default contractDeploy;
contractDeploy.tags = ['Actors', 'Directors', 'Movies', 'Jurys', 'Competitions']
