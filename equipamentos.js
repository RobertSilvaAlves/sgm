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
// equipamentos.js


// IndexedDB helpers
const DB_NAME = 'SGM_DB';
const DB_VERSION = 3;
const STORE_NAME = 'equipamentoMidias';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains('manutencaoMidias')) {
        db.createObjectStore('manutencaoMidias');
      }
    };
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
    request.onerror = function (event) {
      reject(event.target.error);
    };
    if (file) {
      uploadParaCloudinary(file).then(data => {
        if (data.secure_url) {
          const novoEquipamento = {
            nome,
            local,
            tipo,
            data,
            foto: data.secure_url,
          };
          equipamentos.push(novoEquipamento);
          localStorage.setItem("equipamentos", JSON.stringify(equipamentos));
          form.reset();
          atualizarTabela();
        } else {
          alert('Erro ao enviar arquivo: ' + (data.error?.message || 'Erro desconhecido'));
        }
      }).catch((err) => {
        alert('Erro ao enviar arquivo. Veja o console para detalhes.');
        console.error('Erro ao enviar para Cloudinary:', err);
      });
    } else {
      const novoEquipamento = {
        nome,
        local,
        tipo,
        data,
        foto: null,
      };
      equipamentos.push(novoEquipamento);
      localStorage.setItem("equipamentos", JSON.stringify(equipamentos));
      form.reset();
      atualizarTabela();
    }
  if (!form || !tabela) return;

  let equipamentos = JSON.parse(localStorage.getItem("equipamentos")) || [];

  function salvarEquipamento(e) {
    e.preventDefault();

    const nome = document.getElementById("nomeEquipamento").value;
    const local = document.getElementById("localEquipamento").value;
    const tipo = document.getElementById("tipoEquipamento").value;
    const data = document.getElementById("dataInstalacao").value;
    const fotoInput = document.getElementById("fotoEquipamento");
    const file = fotoInput.files[0];

    const idMidia = `${nome}_${local}_${tipo}_${data}_${Date.now()}`;

    if (file) {
      salvarArquivoNoIndexedDB(idMidia, file).then(() => {
        const novoEquipamento = {
          nome,
          local,
          tipo,
          data,
          foto: idMidia,
        };
        equipamentos.push(novoEquipamento);
        localStorage.setItem("equipamentos", JSON.stringify(equipamentos));
        form.reset();
        atualizarTabela();
      }).catch((err) => {
        let msg = err && err.target && err.target.error ? err.target.error : err;
        console.error('Erro ao salvar arquivo no IndexedDB:', msg);
        alert('Erro ao salvar arquivo. Veja o console para detalhes.');
      });
    } else {
      const novoEquipamento = {
        nome,
        local,
        tipo,
        data,
        foto: "",
      };
      equipamentos.push(novoEquipamento);
      localStorage.setItem("equipamentos", JSON.stringify(equipamentos));
      form.reset();
      atualizarTabela();
    }
  }

  function renderMedia(idMidia, alt) {
    if (!idMidia) return '-';
    // IndexedDB é assíncrono, então precisamos usar um placeholder e depois atualizar
    const span = document.createElement('span');
    span.textContent = 'Carregando...';
    lerArquivoDoIndexedDB(idMidia).then(file => {
      if (!file) {
        span.textContent = '-';
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
      span.textContent = '';
      span.appendChild(el);
    }).catch(() => {
      span.textContent = '-';
    });
    return span.outerHTML;
  }

  function atualizarTabela() {
    tabela.innerHTML = "";
    equipamentos = JSON.parse(localStorage.getItem("equipamentos")) || [];

    // Atualiza selects de equipamentos em outras telas (ex: manutenções)
    const selects = document.querySelectorAll('select#equipamento, select#filtroEquipamento');
    selects.forEach(sel => {
      if (sel.id === 'equipamento') {
        sel.innerHTML = '';
        if (equipamentos.length === 0) {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = 'Nenhum equipamento cadastrado';
          option.disabled = true;
          option.selected = true;
          sel.appendChild(option);
        } else {
          equipamentos.forEach(e => {
            const option = document.createElement('option');
            option.value = e.nome;
            option.textContent = e.nome;
            sel.appendChild(option);
          });
        }
      } else if (sel.id === 'filtroEquipamento') {
        sel.innerHTML = '<option value="">Todos os equipamentos</option>';
        equipamentos.forEach(e => {
          const option = document.createElement('option');
          option.value = e.nome;
          option.textContent = e.nome;
          sel.appendChild(option);
        });
      }
    });

    equipamentos.forEach((eq, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${eq.nome}</td>
        <td>${eq.local}</td>
        <td>${eq.tipo}</td>
        <td>${eq.data}</td>
        <td id="midia-${index}">${eq.foto ? 'Carregando...' : '-'}</td>
        <td>
          <button type="button" class="btn-ver-equipamento" data-index="${index}">🔍 Ver</button>
          <button type="button" class="btn-editar-equipamento" data-index="${index}">✏️ Editar</button>
        </td>
      `;
      tabela.appendChild(row);
      if (eq.foto) {
        lerArquivoDoIndexedDB(eq.foto).then(file => {
          const cell = row.querySelector(`#midia-${index}`);
          if (!file) {
            cell.textContent = '-';
            return;
          }
          const url = URL.createObjectURL(file);
          let el;
          if (file.type.startsWith('image/')) {
            el = document.createElement('img');
            el.src = url;
            el.alt = 'Foto';
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
          const cell = row.querySelector(`#midia-${index}`);
          if (cell) cell.textContent = '-';
        });
      }
    });

    // Adiciona listeners para os botões "Ver"
    tabela.querySelectorAll('.btn-ver-equipamento').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.getAttribute('data-index'));
        mostrarModalEquipamento(idx);
      });
    });
    // Adiciona listeners para os botões "Editar"
    tabela.querySelectorAll('.btn-editar-equipamento').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.getAttribute('data-index'));
        iniciarEdicaoEquipamento(idx);
      });
    });
  }

  // Função para iniciar edição
  function iniciarEdicaoEquipamento(index) {
    const eq = equipamentos[index];
    document.getElementById('nomeEquipamento').value = eq.nome;
    document.getElementById('localEquipamento').value = eq.local;
    document.getElementById('tipoEquipamento').value = eq.tipo;
    document.getElementById('dataInstalacao').value = eq.data;
    document.getElementById('indiceEquipamentoEdicao').value = index;
    document.getElementById('btnSalvarEquipamento').textContent = 'Salvar Alterações';
    document.getElementById('btnCancelarEdicao').style.display = '';
  }

  // Função para cancelar edição
  document.getElementById('btnCancelarEdicao').onclick = function() {
    form.reset();
    document.getElementById('indiceEquipamentoEdicao').value = '';
    document.getElementById('btnSalvarEquipamento').textContent = 'Salvar Equipamento';
    this.style.display = 'none';
  };

  // Modal para exibir detalhes do equipamento
  function mostrarModalEquipamento(index) {
    const eq = equipamentos[index];
    let conteudo = `<strong>Nome:</strong> ${eq.nome}<br>
      <strong>Local:</strong> ${eq.local}<br>
      <strong>Tipo:</strong> ${eq.tipo}<br>
      <strong>Data:</strong> ${eq.data}<br>`;
    if (eq.foto) {
      conteudo += '<div id="modal-midia-equipamento">Carregando mídia...</div>';
    }
    // Cria modal maior
    let modal = document.getElementById('modal-equipamento');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-equipamento';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.background = 'rgba(0,0,0,0.7)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '9999';
      modal.innerHTML = '<div id="modal-equipamento-content" style="background:#fff;padding:32px 32px 24px 32px;border-radius:12px;max-width:1200px;max-height:90vh;overflow:auto;position:relative;box-shadow:0 8px 32px #0005;"></div>';
      document.body.appendChild(modal);
    }
    const content = modal.querySelector('#modal-equipamento-content');
    content.innerHTML = conteudo + '<br><button id="fechar-modal-equipamento" style="margin-top:16px;">Fechar</button>';
    modal.style.display = 'flex';
    // Carrega mídia se houver
    if (eq.foto) {
      lerArquivoDoIndexedDB(eq.foto).then(file => {
        const midiaDiv = content.querySelector('#modal-midia-equipamento');
        if (!file) {
          midiaDiv.textContent = '-';
          return;
        }
        const url = URL.createObjectURL(file);
        let el;
        if (file.type.startsWith('image/')) {
          el = document.createElement('img');
          el.src = url;
          el.alt = 'Foto';
          el.className = 'thumb';
          el.style.maxWidth = '400px';
          el.style.maxHeight = '300px';
          el.style.cursor = 'zoom-in';
          el.title = 'Clique para ampliar';
          el.onclick = function() {
            window.open(url, '_blank');
          };
        } else if (file.type.startsWith('video/')) {
          el = document.createElement('video');
          el.src = url;
          el.className = 'thumb';
          el.controls = true;
          el.style.maxWidth = '600px';
          el.style.maxHeight = '400px';
        } else {
          el = document.createElement('span');
          el.textContent = 'Arquivo';
        }
        midiaDiv.textContent = '';
        midiaDiv.appendChild(el);
      }).catch(() => {
        const midiaDiv = content.querySelector('#modal-midia-equipamento');
        if (midiaDiv) midiaDiv.textContent = '-';
      });
    }
    // Fechar modal
    content.querySelector('#fechar-modal-equipamento').onclick = function() {
      modal.style.display = 'none';
    };
  }

  // Remove função antiga de alert

  form.onsubmit = salvarEquipamento;
  atualizarTabela();
}

// Inicializa automaticamente se for carregado por página completa
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarEquipamentos);
} else {
  inicializarEquipamentos();
}
}
