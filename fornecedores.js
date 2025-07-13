// IndexedDB helpers para fornecedores
const DB_NAME_FORNECEDOR = 'SGM_DB';
const DB_VERSION_FORNECEDOR = 3; // Força upgrade e criação do store fornecedorMidias
const STORE_FORNECEDOR = 'fornecedorMidias';

function openDBFornecedor() {
  return new Promise(function(resolve, reject) {
    const request = indexedDB.open(DB_NAME_FORNECEDOR, DB_VERSION_FORNECEDOR);
    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_FORNECEDOR)) {
        db.createObjectStore(STORE_FORNECEDOR);
      }
      // Garante que outros stores não sejam perdidos
      if (!db.objectStoreNames.contains('equipamentoMidias')) {
        db.createObjectStore('equipamentoMidias');
      }
      if (!db.objectStoreNames.contains('manutencaoMidias')) {
        db.createObjectStore('manutencaoMidias');
      }
    };
    request.onsuccess = function(event) {
      resolve(event.target.result);
    };
    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}
  // Função de exportação CSV local para fornecedores
  function exportarCSV() {
    if (!Array.isArray(fornecedores) || fornecedores.length === 0) {
      alert('Nenhum fornecedor para exportar.');
      return;
    }
    var cabecalho = [
      "Nome",
      "Empresa",
      "Tipo",
      "Ramo",
      "Telefone",
      "Email",
      "Data de Compra",
      "Vencimento",
      "Status",
      "Nota"
    ];
    var linhas = fornecedores.map(function(f) {
      return [
        f.nome,
        f.empresa,
        f.tipo,
        f.ramo,
        f.telefone,
        f.email,
        f.compra,
        f.vencimento,
        f.status,
        f.nota ? "Arquivo anexado" : ""
      ];
    });
    var csv = [cabecalho].concat(linhas)
      .map(function(linha) {
        return linha.map(function(valor) {
          return '"' + (valor || '') + '"';
        }).join(",");
      })
      .join("\n");
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "fornecedores.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

function salvarArquivoNoIndexedDBFornecedor(id, file) {
  return openDBFornecedor().then(function(db) {
    return new Promise(function(resolve, reject) {
      const tx = db.transaction(STORE_FORNECEDOR, 'readwrite');
      const store = tx.objectStore(STORE_FORNECEDOR);
      const req = store.put(file, id);
      req.onsuccess = function() { resolve(); };
      req.onerror = function(e) { reject(e); };
    });
  });
}

function lerArquivoDoIndexedDBFornecedor(id) {
  return openDBFornecedor().then(function(db) {
    return new Promise(function(resolve, reject) {
      const tx = db.transaction(STORE_FORNECEDOR, 'readonly');
      const store = tx.objectStore(STORE_FORNECEDOR);
      const req = store.get(id);
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function(e) { reject(e); };
    });
  });
}

window.inicializarFornecedores = function inicializarFornecedores() {
  // Elementos principais
  const form = document.getElementById("formFornecedor");
  const tabela = document.getElementById("tabelaFornecedores");
  const tipoFiltro = document.getElementById("tipoFiltro");
  const valorFiltro = document.getElementById("valorFiltro");
  const filtroForm = document.getElementById("filtroFornecedor");
  const btnLimpar = document.getElementById("limparFiltroFornecedor");
  if (!form || !tabela || !tipoFiltro || !valorFiltro || !filtroForm || !btnLimpar) {
    console.error('[SGM] Elementos do DOM não encontrados. Abortando inicialização.');
    return;
  }
  let fornecedores = JSON.parse(localStorage.getItem("fornecedores")) || [];
  let indiceEdicao = null;

  // Autocomplete dinâmico
  let datalistFiltro = document.createElement('datalist');
  datalistFiltro.id = 'opcoesFiltro';
  valorFiltro.setAttribute('list', 'opcoesFiltro');
  valorFiltro.parentNode.insertBefore(datalistFiltro, valorFiltro.nextSibling);

  function atualizarDatalistFiltro() {
    const tipo = tipoFiltro.value;
    const listaOrdenada = fornecedores.slice().sort((a, b) => {
      const va = (a[tipo] || '').toLowerCase();
      const vb = (b[tipo] || '').toLowerCase();
      return va.localeCompare(vb, 'pt-BR');
    });
    datalistFiltro.innerHTML = listaOrdenada.map(f => {
      const valor = f[tipo] || '';
      if (!valor) return '';
      const resumo = [];
      if (tipo !== 'empresa') resumo.push(f.empresa);
      if (tipo !== 'tipo') resumo.push(f.tipo);
      if (tipo !== 'ramo') resumo.push(f.ramo);
      if (tipo !== 'nome') resumo.push(f.nome);
      const label = valor + (resumo.filter(Boolean).length ? ' — ' + resumo.filter(Boolean).join(' | ') : '');
      return `<option value="${valor.replace(/"/g, '&quot;')}">${label}</option>`;
    }).join('');
  }
  tipoFiltro.addEventListener('change', atualizarDatalistFiltro);
  atualizarDatalistFiltro();

  btnLimpar.addEventListener("click", function() {
    valorFiltro.value = "";
    atualizarTabela(fornecedores);
    atualizarDatalistFiltro();
  });

  filtroForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const tipo = tipoFiltro.value;
    const valor = valorFiltro.value.trim().toLowerCase();
    if (!valor) {
      alert('Digite um valor para filtrar.');
      return;
    }
    const filtrados = fornecedores.filter(f => {
      if (tipo === 'empresa') return f.empresa && f.empresa.toLowerCase().includes(valor);
      if (tipo === 'tipo') return f.tipo && f.tipo.toLowerCase().includes(valor);
      if (tipo === 'ramo') return f.ramo && f.ramo.toLowerCase().includes(valor);
      if (tipo === 'nome') return f.nome && f.nome.toLowerCase().includes(valor);
      return false;
    });
    atualizarTabela(filtrados);
  });

  function salvarFornecedor(e) {
    e.preventDefault();
    // ...validação dos campos...
    const nome = document.getElementById("nomeFornecedor").value.trim();
    const empresa = document.getElementById("empresaFornecedor").value.trim();
    const tipo = document.getElementById("tipoServico").value.trim();
    const ramo = document.getElementById("ramo").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const email = document.getElementById("email").value.trim();
    const inputNota = document.getElementById("notaFiscal");
    const arquivo = inputNota.files[0];
    const compra = document.getElementById("dataCompra").value;
    const vencimento = document.getElementById("vencimento").value;
    const status = document.getElementById("status").value;

    // Validação campo a campo (igual já estava)
    if (!nome) { alert('Preencha o nome do fornecedor.'); return; }
    if (!empresa) { alert('Preencha a empresa.'); return; }
    if (!tipo) { alert('Preencha o tipo de serviço.'); return; }
    if (!ramo) { alert('Preencha o ramo.'); return; }
    if (!telefone) { alert('Preencha o telefone.'); return; }
    if (!email) { alert('Preencha o e-mail.'); return; }
    // Só exige arquivo se for novo cadastro
    if (indiceEdicao === null && !arquivo) { alert('Anexe uma imagem, PDF, TXT, DOC, XLS, etc.'); return; }
    if (arquivo) {
      var tiposAceitos = [
        'image/', 'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      var tipoArquivo = arquivo.type;
      var valido = tiposAceitos.some(function(tipo) { return tipoArquivo.indexOf(tipo) === 0; });
      if (!valido) { alert('Tipo de arquivo não suportado. Anexe imagem, PDF, TXT, DOC, XLS, etc.'); return; }
    }
    if (!compra) { alert('Preencha a data de compra ou serviço.'); return; }
    if (!vencimento) { alert('Preencha a data de vencimento.'); return; }
    if (!status) { alert('Selecione o status.'); return; }

    let idArquivo = null;
    if (arquivo) {
      idArquivo = 'nota_' + nome + '_' + Date.now();
    } else if (indiceEdicao !== null) {
      idArquivo = fornecedores[indiceEdicao].nota;
    }
    const novo = {
      nome, empresa, tipo, ramo, telefone, email, nota: idArquivo, compra, vencimento, status
    };
    function finalizarCadastro() {
      if (indiceEdicao !== null) {
        fornecedores[indiceEdicao] = novo;
        indiceEdicao = null;
        document.getElementById("btnSalvarFornecedor").textContent = "Cadastrar Fornecedor";
      } else {
        fornecedores.push(novo);
      }
      localStorage.setItem("fornecedores", JSON.stringify(fornecedores));
      form.reset();
      atualizarTabela(fornecedores);
      atualizarDatalistFiltro();
    }
    if (arquivo) {
      salvarArquivoNoIndexedDBFornecedor(idArquivo, arquivo)
        .then(finalizarCadastro)
        .catch(function(err) {
          console.error('Erro ao salvar arquivo no IndexedDB:', err);
          alert('Erro ao salvar arquivo. Veja o console para detalhes.');
        });
    } else {
      finalizarCadastro();
    }
  }

  function atualizarTabela(lista) {
    tabela.innerHTML = "";
    lista.forEach(function(f, idx) {
      var tr = document.createElement("tr");
      var statusCor = f.status === "pendente" ? "#dc3545" : (f.status === "lançado" ? "#ffc107" : "#28a745");
      tr.innerHTML =
        '<td>' + (f.nome || "") + '</td>' +
        '<td>' + (f.empresa || "") + '</td>' +
        '<td>' + (f.tipo || "") + '</td>' +
        '<td>' + (f.ramo || "") + '</td>' +
        '<td>' + (f.telefone || "") + ' ' + (f.email || "") + '</td>' +
        '<td>' + (f.compra || "-") + '</td>' +
        '<td>' + (f.vencimento || "-") + '</td>' +
        '<td><span style="color: ' + statusCor + '; font-weight: bold;">' + (f.status || "") + '</span></td>' +
        '<td id="nota-arquivo-' + idx + '">' + (f.nota ? 'Carregando...' : '-') + '</td>' +
        '<td><button type="button" class="btn-editar-fornecedor" data-idx="' + idx + '">Editar</button></td>';
      tabela.appendChild(tr);
      // Evento de edição
      tr.querySelector('.btn-editar-fornecedor').addEventListener('click', function() {
        indiceEdicao = idx;
        document.getElementById("nomeFornecedor").value = f.nome || "";
        document.getElementById("empresaFornecedor").value = f.empresa || "";
        document.getElementById("tipoServico").value = f.tipo || "";
        document.getElementById("ramo").value = f.ramo || "";
        document.getElementById("telefone").value = f.telefone || "";
        document.getElementById("email").value = f.email || "";
        document.getElementById("dataCompra").value = f.compra || "";
        document.getElementById("vencimento").value = f.vencimento || "";
        document.getElementById("status").value = f.status || "";
        document.getElementById("btnSalvarFornecedor").textContent = "Salvar Edição";
        // Scroll para o campo nomeFornecedor
        document.getElementById("nomeFornecedor").scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById("nomeFornecedor").focus();
      });
      if (f.nota) {
        lerArquivoDoIndexedDBFornecedor(f.nota).then(function(file) {
          var cell = tr.querySelector('#nota-arquivo-' + idx);
          if (!file) {
            cell.textContent = '-';
            return;
          }
          var url = URL.createObjectURL(file);
          var el;
          if (file.type && file.type.indexOf('image/') === 0) {
            el = document.createElement('img');
            el.src = url;
            el.alt = 'Nota';
            el.className = 'thumb';
          } else if (file.type === 'application/pdf') {
            el = document.createElement('a');
            el.href = url;
            el.target = '_blank';
            el.textContent = 'Ver PDF';
          } else if (file.type === 'text/plain') {
            el = document.createElement('a');
            el.href = url;
            el.target = '_blank';
            el.textContent = 'Ver TXT';
          } else {
            el = document.createElement('a');
            el.href = url;
            el.target = '_blank';
            el.textContent = 'Arquivo';
          }
          cell.textContent = '';
          cell.appendChild(el);
        }).catch(function() {
          var cell = tr.querySelector('#nota-arquivo-' + idx);
          if (cell) cell.textContent = '-';
        });
      }
    });
  }

  form.addEventListener("submit", salvarFornecedor);
  atualizarTabela(fornecedores);
}
// Removido listener global para SPA


