const hre = require("hardhat");

async function main() {
  console.log("Deploying HealthCertificate contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const HealthCertificate = await hre.ethers.getContractFactory("HealthCertificate");
  const healthCertificate = await HealthCertificate.deploy();

  await healthCertificate.waitForDeployment();

  const contractAddress = await healthCertificate.getAddress();
  console.log("HealthCertificate deployed to:", contractAddress);

  // Save the contract address to a file for the frontend
  const fs = require("fs");
  const path = require("path");
  
  const contractsDir = path.join(__dirname, "..", "..", "lib");
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ HealthCertificate: contractAddress }, null, 2)
  );

  // Also copy the ABI
  const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts", "HealthCertificate.sol");
  const artifact = JSON.parse(fs.readFileSync(path.join(artifactsDir, "HealthCertificate.json")));
  
  fs.writeFileSync(
    path.join(contractsDir, "contract-abi.json"),
    JSON.stringify(artifact.abi, null, 2)
  );

  console.log("Contract address and ABI saved to lib/ directory");
  
  // Verify the owner
  const owner = await healthCertificate.owner();
  console.log("Contract owner:", owner);
  
  // Check if deployer is authorized issuer
  const isAuthorized = await healthCertificate.isAuthorizedIssuer(deployer.address);
  console.log("Deployer is authorized issuer:", isAuthorized);

  console.log("\n=== Deployment Complete ===");
  console.log("Contract Address:", contractAddress);
  console.log("\nNext steps:");
  console.log("1. Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
  console.log("2. Start your Next.js app with 'npm run dev'");
  console.log("3. The app will connect to Hardhat local network at http://127.0.0.1:8545");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
