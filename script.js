// script.js

async function navegar(pagina) {
  const conteudo = document.getElementById("conteudo");

  try {
    // Corrige para carregar home.html ao invés de index.html
    const paginaHtml = pagina === "index" ? "home" : pagina;
    const response = await fetch(`${paginaHtml}.html`);
    const html = await response.text();
    conteudo.innerHTML = html;

    // Carregar JS correspondente à página, se existir
    const scriptPath = `${paginaHtml}.js`;
    fetch(scriptPath, { method: 'HEAD' })
      .then(resp => {
        if (resp.ok) {
          // Remove script antigo se existir
          document.querySelectorAll('script').forEach(s => {
            if (s.src && s.src.includes(scriptPath)) {
              s.remove();
            }
          });
          const scriptTag = document.createElement("script");
          scriptTag.src = scriptPath;
          scriptTag.defer = true;
          scriptTag.onload = function() {
            if (paginaHtml === 'equipamentos' && typeof inicializarEquipamentos === 'function') {
              inicializarEquipamentos();
            }
            if (paginaHtml === 'manutencoes' && typeof inicializarManutencoes === 'function') {
              inicializarManutencoes();
            }
            if (paginaHtml === 'fornecedores' && typeof inicializarFornecedores === 'function') {
              setTimeout(() => inicializarFornecedores(), 0);
            }
            if (paginaHtml === 'home' && typeof inicializarHome === 'function') {
              setTimeout(() => inicializarHome(), 0);
            }
          };
          document.body.appendChild(scriptTag);
        }
      });
  } catch (error) {
    conteudo.innerHTML = `<p>Erro ao carregar a página: ${pagina}</p>`;
    console.error(error);
  }
}

function exportarDados() {
  alert("Função de exportar dados em desenvolvimento...");
} 

// Carrega home por padrão
window.addEventListener("DOMContentLoaded", () => navegar("index"));