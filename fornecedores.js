document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formFornecedor");
  const tabela = document.getElementById("tabelaFornecedores");
  const filtroForm = document.getElementById("filtroFornecedor");
  const filtroEmpresa = document.getElementById("filtroEmpresa");
  const filtroTipo = document.getElementById("filtroTipo");
  const filtroRamo = document.getElementById("filtroRamo");
  const filtroNome = document.getElementById("filtroNome");

  const exportBtn = document.createElement("button");
  exportBtn.className = "exportar";
  exportBtn.textContent = "Exportar CSV";
  exportBtn.addEventListener("click", exportarCSV);

  const wrapper = document.createElement("div");
  wrapper.className = "exportar-wrapper";
  wrapper.appendChild(exportBtn);

  const section = document.querySelector(".fornecedores");
  section.insertBefore(wrapper, section.querySelector("table"));

  let fornecedores = JSON.parse(localStorage.getItem("fornecedores")) || [];

  function salvarFornecedor(e) {
    e.preventDefault();

    const inputNota = document.getElementById("notaFiscal");
    const arquivo = inputNota.files[0];

    if (arquivo) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const imagemBase64 = event.target.result;

        const novo = {
          nome: document.getElementById("nomeFornecedor").value,
          empresa: document.getElementById("empresaFornecedor").value,
          tipo: document.getElementById("tipoServico").value,
          ramo: document.getElementById("ramo").value,
          telefone: document.getElementById("telefone").value,
          email: document.getElementById("email").value,
          nota: imagemBase64, // base64 da imagem
          compra: document.getElementById("dataCompra").value,
          vencimento: document.getElementById("vencimento").value,
          status: document.getElementById("status").value,
        };

        fornecedores.push(novo);
        localStorage.setItem("fornecedores", JSON.stringify(fornecedores));
        form.reset();
        atualizarTabela(fornecedores);
      };
      reader.readAsDataURL(arquivo);
    } else {
      const novo = {
        nome: document.getElementById("nomeFornecedor").value,
        empresa: document.getElementById("empresaFornecedor").value,
        tipo: document.getElementById("tipoServico").value,
        ramo: document.getElementById("ramo").value,
        telefone: document.getElementById("telefone").value,
        email: document.getElementById("email").value,
        nota: null,
        compra: document.getElementById("dataCompra").value,
        vencimento: document.getElementById("vencimento").value,
        status: document.getElementById("status").value,
      };

      fornecedores.push(novo);
      localStorage.setItem("fornecedores", JSON.stringify(fornecedores));
      form.reset();
      atualizarTabela(fornecedores);
    }
  }

  function atualizarTabela(lista) {
    tabela.innerHTML = "";
    lista.forEach((f) => {
      const tr = document.createElement("tr");

      const statusCor =
        f.status === "pendente"
          ? "#dc3545"
          : f.status === "lançado"
          ? "#ffc107"
          : "#28a745";

      const notaContent = f.nota
        ? `<a href="${f.nota}" target="_blank"><img src="${f.nota}" alt="Nota fiscal" class="thumb" /></a>`
        : "-";

      tr.innerHTML = `
        <td>${f.nome}</td>
        <td>${f.empresa}</td>
        <td>${f.tipo}</td>
        <td>${f.ramo}</td>
        <td>${f.telefone || ""} ${f.email || ""}</td>
        <td>${f.compra || "-"}</td>
        <td>${f.vencimento || "-"}</td>
        <td><span style="color: ${statusCor}; font-weight: bold;">${f.status}</span></td>
        <td>${notaContent}</td>
      `;

      tabela.appendChild(tr);
    });
  }

  filtroForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const empresa = filtroEmpresa.value.toLowerCase();
    const tipo = filtroTipo.value.toLowerCase();
    const ramo = filtroRamo.value.toLowerCase();
    const nome = filtroNome.value.toLowerCase();

    const filtrados = fornecedores.filter((f) => {
      return (
        f.empresa.toLowerCase().includes(empresa) &&
        f.tipo.toLowerCase().includes(tipo) &&
        f.ramo.toLowerCase().includes(ramo) &&
        f.nome.toLowerCase().includes(nome)
      );
    });
    atualizarTabela(filtrados);
  });

  document.getElementById("limparFiltroFornecedor").addEventListener("click", () => {
    filtroEmpresa.value = "";
    filtroTipo.value = "";
    filtroRamo.value = "";
    filtroNome.value = "";
    atualizarTabela(fornecedores);
  });

  function exportarCSV() {
    const cabecalho = [
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

    const linhas = fornecedores.map(f => [
      f.nome,
      f.empresa,
      f.tipo,
      f.ramo,
      f.telefone,
      f.email,
      f.compra,
      f.vencimento,
      f.status,
      f.nota ? "Imagem anexada" : ""
    ]);

    const csv = [cabecalho, ...linhas]
      .map(linha => linha.map(valor => `"${valor || ''}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "fornecedores.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  form.addEventListener("submit", salvarFornecedor);
  atualizarTabela(fornecedores);
});
