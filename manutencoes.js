// Função genérica para upload ao Cloudinary
function uploadParaCloudinary(file) {
  const UPLOAD_PRESET = 'sgm_unsigned'; // Altere para o nome do seu preset
  const CLOUD_NAME = 'dmagcicum';
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  return fetch(url, {
    method: 'POST',
    body: formData
  }).then(r => r.json());
}
// manutencoes.js


// IndexedDB helpers
// const DB_NAME = 'SGM_DB';
// const DB_VERSION = 3;
// const STORE_MANUTENCAO = 'manutencaoMidias';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('equipamentoMidias')) {
        db.createObjectStore('equipamentoMidias');
      }
      if (!db.objectStoreNames.contains(STORE_MANUTENCAO)) {
        db.createObjectStore(STORE_MANUTENCAO);
      }
    };
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

function salvarArquivoNoIndexedDBManutencao(id, file) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MANUTENCAO, 'readwrite');
      const store = tx.objectStore(STORE_MANUTENCAO);
      const req = store.put(file, id);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e);
    });
  });
}

function lerArquivoDoIndexedDBManutencao(id) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MANUTENCAO, 'readonly');
      const store = tx.objectStore(STORE_MANUTENCAO);
      const req = store.get(id);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e);
    });
  });
}

// Função para inicializar o módulo de manutenções (SPA)
window.inicializarManutencoes = function inicializarManutencoes() {
  const form = document.getElementById("formManutencao");
  const tabela = document.getElementById("tabelaManutencoes");
  const filtroForm = document.getElementById("filtroManutencao");
  const filtroEquipamento = document.getElementById("filtroEquipamento");
  const filtroDataInicio = document.getElementById("filtroDataInicio");
  const filtroDataFim = document.getElementById("filtroDataFim");
  const equipamentoSelect = document.getElementById("equipamento");
  if (!form || !tabela || !equipamentoSelect) return;

  let manutencoes = JSON.parse(localStorage.getItem("manutencoes")) || [];
  let equipamentos = JSON.parse(localStorage.getItem("equipamentos")) || [];

  // Preenche os selects de equipamentos SEM depender de outra tela
  equipamentoSelect.innerHTML = '';
  filtroEquipamento.innerHTML = '<option value="">Todos os equipamentos</option>';
  if (!equipamentos || equipamentos.length === 0) {
    const option = document.createElement("option");
    option.value = '';
    option.textContent = 'Nenhum equipamento cadastrado';
    option.disabled = true;
    option.selected = true;
    equipamentoSelect.appendChild(option);
  } else {
    equipamentos.forEach((e) => {
      const option = document.createElement("option");
      option.value = e.nome;
      option.textContent = e.nome;
      equipamentoSelect.appendChild(option);
    });
    equipamentos.forEach((e) => {
      const filtroOption = document.createElement("option");
      filtroOption.value = e.nome;
      filtroOption.textContent = e.nome;
      filtroEquipamento.appendChild(filtroOption);
    });
  }

  function salvarManutencao(e) {
    e.preventDefault();

    const tipo = document.getElementById("tipo").value;
    const data = document.getElementById("data").value;
    const responsavel = document.getElementById("responsavel").value;
    const descricao = document.getElementById("descricao").value;
    const fotoAntesInput = document.getElementById("fotoAntes");
    const fotoDepoisInput = document.getElementById("fotoDepois");
    const equipamento = equipamentoSelect.value;

    const fileAntes = fotoAntesInput.files[0];
    const fileDepois = fotoDepoisInput.files[0];
    const idAntes = fileAntes ? `antes_${equipamento}_${tipo}_${data}_${Date.now()}` : '';
    const idDepois = fileDepois ? `depois_${equipamento}_${tipo}_${data}_${Date.now()}` : '';

    Promise.all([
      fileAntes ? uploadParaCloudinary(fileAntes) : Promise.resolve({secure_url: null}),
      fileDepois ? uploadParaCloudinary(fileDepois) : Promise.resolve({secure_url: null})
    ]).then(([antesData, depoisData]) => {
      const nova = {
        equipamento,
        tipo,
        data,
        responsavel,
        descricao,
        antes: antesData.secure_url,
        depois: depoisData.secure_url,
      };
      manutencoes.push(nova);
      localStorage.setItem("manutencoes", JSON.stringify(manutencoes));
      form.reset();
      atualizarTabela(manutencoes);
    }).catch((err) => {
      alert('Erro ao enviar arquivo. Veja o console para detalhes.');
      console.error('Erro ao enviar para Cloudinary:', err);
    });
  }

  function renderMedia(idMidia, alt, cell) {
    if (!idMidia) {
      cell.textContent = '-';
      return;
    }
    cell.textContent = 'Carregando...';
    lerArquivoDoIndexedDBManutencao(idMidia).then(file => {
      if (!file) {
        cell.textContent = '-';
        return;
      }
      const url = URL.createObjectURL(file);
      let el;
      if (file.type.startsWith('image/')) {
        el = document.createElement('img');
        el.src = url;
        el.alt = alt;
        el.className = 'thumb';
      } else if (file.type.startsWith('video/')) {
        el = document.createElement('video');
        el.src = url;
        el.className = 'thumb';
        el.controls = true;
      } else {
        el = document.createElement('span');
        el.textContent = 'Arquivo';
      }
      cell.textContent = '';
      cell.appendChild(el);
    }).catch(() => {
      cell.textContent = '-';
    });
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
        <td id="antes-${index}">${m.antes ? 'Carregando...' : '-'}</td>
        <td id="depois-${index}">${m.depois ? 'Carregando...' : '-'}</td>
        <td><button onclick="verDetalhesManutencao(${index})">🔍 Ver</button></td>
      `;
      tabela.appendChild(row);
      if (m.antes) {
        const cellAntes = row.querySelector(`#antes-${index}`);
        renderMedia(m.antes, 'Antes', cellAntes);
      }
      if (m.depois) {
        const cellDepois = row.querySelector(`#depois-${index}`);
        renderMedia(m.depois, 'Depois', cellDepois);
      }
    });
  }

  window.verDetalhesManutencao = function (index) {
    const m = manutencoes[index];
    alert(`Equipamento: ${m.equipamento}\nTipo: ${m.tipo}\nData: ${m.data}\nResponsável: ${m.responsavel}\nDescrição: ${m.descricao}`);
  };

  // Filtros
  if (filtroForm) {
    filtroForm.onsubmit = (e) => {
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
    };
    const limparBtn = document.getElementById("limparFiltro");
    if (limparBtn) {
      limparBtn.onclick = () => {
        filtroEquipamento.value = "";
        filtroDataInicio.value = "";
        filtroDataFim.value = "";
        atualizarTabela(manutencoes);
      };
    }
  }

  form.onsubmit = salvarManutencao;
  atualizarTabela(manutencoes);
}

