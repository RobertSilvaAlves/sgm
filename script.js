// script.js

async function navegar(pagina) {
  const conteudo = document.getElementById("conteudo");

  try {
    const response = await fetch(`${pagina}.html`);
    const html = await response.text();
    conteudo.innerHTML = html;

    // Carregar JS correspondente à página
    const scriptTag = document.createElement("script");
    scriptTag.src = `${pagina}.js`;
    scriptTag.defer = true;
    document.body.appendChild(scriptTag);

  } catch (error) {
    conteudo.innerHTML = `<p>Erro ao carregar a página: ${pagina}</p>`;
    console.error(error);
  }
}

function exportarDados() {
  alert("Função de exportar dados em desenvolvimento...");
} 

// Carrega home por padrão
window.addEventListener("DOMContentLoaded", () => navegar("home"));