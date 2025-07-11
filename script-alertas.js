// script-alertas.js

document.addEventListener("DOMContentLoaded", () => {
  exibirManutencoesProximas();
  exibirBoletosProximos();
});

function exibirManutencoesProximas() {
  const lista = document.getElementById("listaAlertasManutencoes");
  if (!lista) return;

  const manutencoes = JSON.parse(localStorage.getItem("manutencoes")) || [];
  const hoje = new Date();
  const seteDias = new Date();
  seteDias.setDate(hoje.getDate() + 7);

  const proximas = manutencoes.filter((m) => {
    const data = new Date(m.data);
    return data >= hoje && data <= seteDias;
  });

  if (proximas.length === 0) {
    lista.innerHTML = "<li>Nenhuma manutenção agendada nos próximos 7 dias.</li>";
    return;
  }

  lista.innerHTML = "";
  proximas.forEach((m) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${m.equipamento}</strong> - ${m.tipo} em <strong>${m.data}</strong> - Resp: ${m.responsavel}`;
    lista.appendChild(li);
  });
}

function exibirBoletosProximos() {
  const lista = document.getElementById("listaAlertasBoletos");
  if (!lista) return;

  const fornecedores = JSON.parse(localStorage.getItem("fornecedores")) || [];
  const hoje = new Date();
  const seteDias = new Date();
  seteDias.setDate(hoje.getDate() + 7);

  const boletos = fornecedores.filter((f) => {
    if (f.status === "pago" || !f.vencimento) return false;
    const venc = new Date(f.vencimento);
    return venc >= hoje && venc <= seteDias;
  });

  if (boletos.length === 0) {
    lista.innerHTML = "<li>Nenhum boleto a vencer nos próximos 7 dias.</li>";
    return;
  }

  lista.innerHTML = "";
  boletos.forEach((b) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${b.empresa}</strong> - ${b.tipo} | Vencimento: <strong>${b.vencimento}</strong>`;
    lista.appendChild(li);
  });
}
