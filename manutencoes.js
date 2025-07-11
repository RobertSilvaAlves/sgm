// manutencoes.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formManutencao");
  const tabela = document.getElementById("tabelaManutencoes");
  const filtroForm = document.getElementById("filtroManutencao");
  const filtroEquipamento = document.getElementById("filtroEquipamento");
  const filtroDataInicio = document.getElementById("filtroDataInicio");
  const filtroDataFim = document.getElementById("filtroDataFim");

  let manutencoes = JSON.parse(localStorage.getItem("manutencoes")) || [];
  let equipamentos = JSON.parse(localStorage.getItem("equipamentos")) || [];

  // Preenche os selects com os equipamentos cadastrados
  const equipamentoSelect = document.getElementById("equipamento");
  equipamentos.forEach((e) => {
    const option = document.createElement("option");
    option.value = e.nome;
    option.textContent = e.nome;
    equipamentoSelect.appendChild(option);

    const filtroOption = document.createElement("option");
    filtroOption.value = e.nome;
    filtroOption.textContent = e.nome;
    filtroEquipamento.appendChild(filtroOption);
  });

  function salvarManutencao(e) {
    e.preventDefault();

    const nova = {
      equipamento: equipamentoSelect.value,
      tipo: document.getElementById("tipo").value,
      data: document.getElementById("data").value,
      responsavel: document.getElementById("responsavel").value,
      descricao: document.getElementById("descricao").value,
      antes: document.getElementById("fotoAntes").value,
      depois: document.getElementById("fotoDepois").value,
    };

    manutencoes.push(nova);
    localStorage.setItem("manutencoes", JSON.stringify(manutencoes));
    form.reset();
    atualizarTabela(manutencoes);
  }

  function atualizarTabela(lista) {
    tabela.innerHTML = "";
    lista.forEach((m, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${m.equipamento}</td>
        <td>${m.tipo}</td>
        <td>${m.data}</td>
        <td>${m.responsavel}</td>
        <td>${m.descricao}</td>
        <td>${m.antes ? `<img src="${m.antes}" class="thumb">` : '-'}</td>
        <td>${m.depois ? `<img src="${m.depois}" class="thumb">` : '-'}</td>
        <td><button onclick="verDetalhesManutencao(${index})">🔍</button></td>
      `;
      tabela.appendChild(row);
    });
  }

  window.verDetalhesManutencao = function (index) {
    const m = manutencoes[index];
    alert(`Equipamento: ${m.equipamento}\nTipo: ${m.tipo}\nData: ${m.data}\nResp: ${m.responsavel}\n\n${m.descricao}`);
  };

  filtroForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const filtro = filtroEquipamento.value;
    const ini = filtroDataInicio.value;
    const fim = filtroDataFim.value;

    const filtradas = manutencoes.filter((m) => {
      const dentroEquip = !filtro || m.equipamento === filtro;
      const dentroData = (!ini || m.data >= ini) && (!fim || m.data <= fim);
      return dentroEquip && dentroData;
    });
    atualizarTabela(filtradas);
  });

  document.getElementById("limparFiltro").addEventListener("click", () => {
    filtroEquipamento.value = "";
    filtroDataInicio.value = "";
    filtroDataFim.value = "";
    atualizarTabela(manutencoes);
  });

  form.addEventListener("submit", salvarManutencao);
  atualizarTabela(manutencoes);
});