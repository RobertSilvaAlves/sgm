// home.js
// Script de inicialização da tela Home do SGM

window.inicializarHome = function() {
  // Função utilitária para formatar datas no padrão brasileiro
  function formatarDataBR(dataStr) {
    if (!dataStr) return '';
    const d = new Date(dataStr);
    if (isNaN(d)) return dataStr;
    return d.toLocaleDateString('pt-BR');
  }
  // Mensagem de boas-vindas
  const el = document.getElementById('bemVindoHome');
  if (el) {
    el.textContent = 'Bem-vindo ao Sistema de Gestão de Manutenção!';
  }

  // Próximas manutenções (próximos 30 dias)
  const listaManutencoes = document.getElementById('listaAlertasManutencoes');
  let manutencoes = [];
  try {
    manutencoes = JSON.parse(localStorage.getItem('manutencoes')) || [];
  } catch {}
  const hoje = new Date();
  const daqui30 = new Date();
  daqui30.setDate(hoje.getDate() + 30);
  const proximas = manutencoes.filter(m => {
    if (!m.data) return false;
    const data = new Date(m.data);
    return data >= hoje && data <= daqui30;
  }).sort((a, b) => new Date(a.data) - new Date(b.data));
  listaManutencoes.innerHTML = proximas.length ? proximas.map(m =>
    `<li><b>${m.equipamento}</b> (${m.tipo}) - ${formatarDataBR(m.data)} <br><small>${m.descricao || ''}</small></li>`
  ).join('') : '<li>Nenhuma manutenção agendada nos próximos 30 dias.</li>';

  // Boletos próximos do vencimento (fornecedores com vencimento nos próximos 15 dias)
  const listaBoletos = document.getElementById('listaAlertasBoletos');
  let fornecedores = [];
  try {
    fornecedores = JSON.parse(localStorage.getItem('fornecedores')) || [];
  } catch {}
  const daqui15 = new Date();
  daqui15.setDate(hoje.getDate() + 15);
  const boletos = fornecedores.filter(f => {
    if (!f.vencimento) return false;
    const data = new Date(f.vencimento);
    return data >= hoje && data <= daqui15;
  }).sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

  // Função para renderizar imagem do boleto (nota)
  function renderBoletoImg(f, li) {
    if (!f.nota) return;
    if (typeof lerArquivoDoIndexedDBFornecedor !== 'function') return;
    lerArquivoDoIndexedDBFornecedor(f.nota).then(file => {
      if (!file) return;
      if (file.type && file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = 'Boleto';
        img.className = 'thumb';
        li.appendChild(document.createElement('br'));
        li.appendChild(img);
      } else if (file.type === 'application/pdf') {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.target = '_blank';
        a.textContent = 'Ver PDF';
        li.appendChild(document.createElement('br'));
        li.appendChild(a);
      }
    });
  }

  listaBoletos.innerHTML = '';
  if (boletos.length) {
    boletos.forEach(f => {
      const li = document.createElement('li');
      li.innerHTML = `<b>${f.nome || f.empresa}</b> - Vencimento: ${formatarDataBR(f.vencimento)}`;
      renderBoletoImg(f, li);
      listaBoletos.appendChild(li);
    });
  } else {
    listaBoletos.innerHTML = '<li>Nenhum boleto a vencer nos próximos 15 dias.</li>';
  }
};
