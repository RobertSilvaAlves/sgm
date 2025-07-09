const modal = document.getElementById('modal');
const modalInfo = document.getElementById('modalInfo');
const fecharModal = document.getElementById('fecharModal');

const filtroEquipamento = document.getElementById('filtroEquipamento');
const filtroDataInicio = document.getElementById('filtroDataInicio');
const filtroDataFim = document.getElementById('filtroDataFim');
const formFiltro = document.getElementById('formFiltro');
const limparFiltro = document.getElementById('limparFiltro');


fecharModal.addEventListener('click', () => {
    modal.classList.add('hidden');
});


// Dados
let equipamentos = JSON.parse(localStorage.getItem('equipamentos')) || [];
let manutencoes = JSON.parse(localStorage.getItem('manutencoes')) || [];

// Elementos
const formEquipamento = document.getElementById('formEquipamento');
const formManutencao = document.getElementById('formManutencao');
const tabelaEquipamentos = document.getElementById('tabelaEquipamentos');
const tabelaManutencoes = document.getElementById('tabelaManutencoes');
const equipamentoSelecionado = document.getElementById('equipamentoSelecionado');

// Inicialização
atualizarTabelaEquipamentos();
atualizarOpcoesEquipamentos();
atualizarTabelaManutencoes();

// Cadastro de Equipamento
formEquipamento.addEventListener('submit', async function (e) {
    e.preventDefault();

    const fotoInput = document.getElementById('fotoEquipamento');
    const fotoBase64 = await converterParaBase64(fotoInput.files[0]);

    const equipamento = {
        nome: document.getElementById('nomeEquipamento').value,
        local: document.getElementById('localizacao').value,
        tipo: document.getElementById('tipoEquipamento').value,
        data: document.getElementById('dataInstalacao').value,
        foto: fotoBase64 || null
    };

    equipamentos.push(equipamento);
    localStorage.setItem('equipamentos', JSON.stringify(equipamentos));

    formEquipamento.reset();
    atualizarTabelaEquipamentos();
    atualizarOpcoesEquipamentos();
});

// Registro de Manutenção
formManutencao.addEventListener('submit', async function (e) {
    e.preventDefault();

    const antesInput = document.getElementById('fotoAntes');
    const depoisInput = document.getElementById('fotoDepois');
    const fotoAntesBase64 = await converterParaBase64(antesInput.files[0]);
    const fotoDepoisBase64 = await converterParaBase64(depoisInput.files[0]);

    const manutencao = {
        equipamento: equipamentoSelecionado.value,
        tipo: document.getElementById('tipoManutencao').value,
        descricao: document.getElementById('descricao').value,
        data: document.getElementById('dataManutencao').value,
        responsavel: document.getElementById('responsavel').value,
        fotoAntes: fotoAntesBase64 || null,
        fotoDepois: fotoDepoisBase64 || null
    };

    manutencoes.push(manutencao);
    localStorage.setItem('manutencoes', JSON.stringify(manutencoes));

    formManutencao.reset();
    atualizarTabelaManutencoes();
    alert('Manutenção registrada com sucesso!');
});


// Atualiza Tabela de Equipamentos
function atualizarTabelaEquipamentos() {
    tabelaEquipamentos.innerHTML = "";

    equipamentos.forEach((eq) => {
        const row = document.createElement('tr');
        row.innerHTML = `
  <td>${eq.nome}</td>
  <td>${eq.local}</td>
  <td>${eq.tipo}</td>
  <td>${eq.data}</td>
  <td>${eq.foto ? `<img class="thumb" src="${eq.foto}" alt="Foto">` : '-'}</td>
  <td><button class="ver-btn" onclick="verDetalhesEquipamento(${equipamentos.indexOf(eq)})">🔍 Ver</button></td>
`;

        tabelaEquipamentos.appendChild(row);
    });
}


// Atualiza Opções do Formulário de Manutenção
function atualizarOpcoesEquipamentos() {
  equipamentoSelecionado.innerHTML = '<option disabled selected value="">Selecione o equipamento</option>';
  filtroEquipamento.innerHTML = '<option value="">Todos os equipamentos</option>';

  equipamentos.forEach((eq) => {
    const option1 = document.createElement('option');
    option1.value = eq.nome;
    option1.textContent = `${eq.nome} (${eq.local})`;
    equipamentoSelecionado.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = eq.nome;
    option2.textContent = eq.nome;
    filtroEquipamento.appendChild(option2);
  });
}


// Atualiza Tabela de Manutenções
function atualizarTabelaManutencoes() {
  const filtroNome = filtroEquipamento.value;
  const dataInicio = filtroDataInicio.value;
  const dataFim = filtroDataFim.value;

  tabelaManutencoes.innerHTML = "";

  const resultados = manutencoes.filter((m) => {
    const dentroEquipamento = !filtroNome || m.equipamento === filtroNome;

    const data = new Date(m.data);
    const dentroInicio = !dataInicio || data >= new Date(dataInicio);
    const dentroFim = !dataFim || data <= new Date(dataFim);

    return dentroEquipamento && dentroInicio && dentroFim;
  });

  resultados.forEach((m, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${m.equipamento}</td>
      <td>${m.tipo}</td>
      <td>${m.data}</td>
      <td>${m.responsavel}</td>
      <td>${m.descricao}</td>
      <td>${m.fotoAntes ? `<img class="thumb" src="${m.fotoAntes}" alt="Antes">` : '-'}</td>
      <td>${m.fotoDepois ? `<img class="thumb" src="${m.fotoDepois}" alt="Depois">` : '-'}</td>
      <td><button class="ver-btn" onclick="verDetalhesManutencao(${manutencoes.indexOf(m)})">🔍 Ver</button></td>
    `;
    tabelaManutencoes.appendChild(row);
  });
}


function converterParaBase64(file) {
    return new Promise((resolve) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

function verDetalhesEquipamento(index) {
  const eq = equipamentos[index];
  modalInfo.innerHTML = `
    <h2>${eq.nome}</h2>
    <p><strong>Local:</strong> ${eq.local}</p>
    <p><strong>Tipo:</strong> ${eq.tipo}</p>
    <p><strong>Data de Instalação:</strong> ${eq.data}</p>
    ${eq.foto ? `<img src="${eq.foto}" alt="Foto do Equipamento">` : ''}
  `;
  modal.classList.remove('hidden');
}

function verDetalhesManutencao(index) {
  const m = manutencoes[index];
  modalInfo.innerHTML = `
    <h2>Manutenção - ${m.equipamento}</h2>
    <p><strong>Tipo:</strong> ${m.tipo}</p>
    <p><strong>Data:</strong> ${m.data}</p>
    <p><strong>Responsável:</strong> ${m.responsavel}</p>
    <p><strong>Descrição:</strong><br>${m.descricao}</p>
    ${m.fotoAntes ? `<p><strong>Antes:</strong><br><img src="${m.fotoAntes}" alt="Antes da manutenção"></p>` : ''}
    ${m.fotoDepois ? `<p><strong>Depois:</strong><br><img src="${m.fotoDepois}" alt="Depois da manutenção"></p>` : ''}
  `;
  modal.classList.remove('hidden');
}

formFiltro.addEventListener('submit', function (e) {
  e.preventDefault();
  atualizarTabelaManutencoes();
});

limparFiltro.addEventListener('click', () => {
  filtroEquipamento.value = "";
  filtroDataInicio.value = "";
  filtroDataFim.value = "";
  atualizarTabelaManutencoes();
});
