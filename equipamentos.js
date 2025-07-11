// equipamentos.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formEquipamento");
  const tabela = document.getElementById("tabelaEquipamentos");

  let equipamentos = JSON.parse(localStorage.getItem("equipamentos")) || [];

  function salvarEquipamento(e) {
    e.preventDefault();

    const novoEquipamento = {
      nome: document.getElementById("nomeEquipamento").value,
      local: document.getElementById("localEquipamento").value,
      tipo: document.getElementById("tipoEquipamento").value,
      data: document.getElementById("dataInstalacao").value,
      foto: document.getElementById("fotoEquipamento").value,
    };

    equipamentos.push(novoEquipamento);
    localStorage.setItem("equipamentos", JSON.stringify(equipamentos));
    form.reset();
    atualizarTabela();
  }

  function atualizarTabela() {
    tabela.innerHTML = "";
    equipamentos.forEach((eq, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${eq.nome}</td>
        <td>${eq.local}</td>
        <td>${eq.tipo}</td>
        <td>${eq.data}</td>
        <td>${eq.foto ? `<img src="${eq.foto}" alt="Foto" class="thumb">` : '-'}</td>
        <td><button onclick="verDetalhesEquipamento(${index})">🔍 Ver</button></td>
      `;
      tabela.appendChild(row);
    });
  }

  window.verDetalhesEquipamento = function (index) {
    const eq = equipamentos[index];
    alert(`Nome: ${eq.nome}\nLocal: ${eq.local}\nTipo: ${eq.tipo}\nData: ${eq.data}`);
  };

  form.addEventListener("submit", salvarEquipamento);
  atualizarTabela();
});