if (!window.ciclosTelaInicializado) {
  window.ciclosTelaInicializado = true;
  
  console.log("ciclotela.js inicializando");

  async function carregarCiclos() {
    try {
      console.log("Iniciando carregamento de ciclos...");
      
      // Verificar se o container existe
      const container = document.getElementById("lista-ciclos");
      if (!container) {
        console.error("Container 'lista-ciclos' não encontrado");
        return;
      }

      container.innerHTML = '<div class="carregando-container"><p class="carregando">Carregando seus ciclos...</p></div>';

      const res = await fetch("/api/ciclo/lista");
      
      if (!res.ok) {
        throw new Error(`Erro na requisição: ${res.status}`);
      }
      
      const ciclos = await res.json();
      console.log(`Recebidos ${ciclos ? ciclos.length : 0} ciclos da API`);

      container.innerHTML = "";

      if (!ciclos || !ciclos.length || ciclos.length === 0) {
        container.innerHTML = `
          <div class="sem-ciclos-container">
            <p class="sem-ciclos">
              Você ainda não possui ciclos finalizados suficientes para exibir.
              <br>
              <small>Continue registrando sua menstruação para ver seu histórico aqui.</small>
            </p>
          </div>
        `;
        return;
      }

      const ciclosParaExibir = ciclos.slice(0, 10);

      const fragment = document.createDocumentFragment();

      ciclosParaExibir.forEach((c, index) => {
        if (!c || typeof c.cicloDias !== 'number' || c.cicloDias <= 0) {
          console.warn(`Ciclo ${index} com dados inválidos:`, c);
          return;
        }

        const card = document.createElement("div");
        card.classList.add("ciclo-card");
        card.setAttribute("data-ciclo-id", c.id || index);

        const total = c.cicloDias;
        const menstruacao = c.menstruacaoDias || 0;

        let titulo = c.titulo || `Ciclo ${index + 1}`;
        if (c.dataInicio) {
          const data = new Date(c.dataInicio);
          titulo = `Ciclo de ${data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
        }

        const bolinhasContainer = document.createElement("div");
        bolinhasContainer.classList.add("bolinhas");

        for (let i = 0; i < total; i++) {
          const bolinha = document.createElement("div");
          bolinha.classList.add("bolinha");
          if (i < menstruacao) {
            bolinha.classList.add("menstruacao");
          }
          bolinhasContainer.appendChild(bolinha);
        }

        card.innerHTML = `
          <h3 class="ciclo-titulo">${titulo}</h3>
          <p class="ciclo-info">
            <span class="dias-total">${total} dias</span>
            ${menstruacao > 0 ? `<span class="dias-menstruacao">${menstruacao} dias de menstruação</span>` : ''}
          </p>
        `;
        
        card.appendChild(bolinhasContainer);
        fragment.appendChild(card);
      });

      container.appendChild(fragment);
      
      console.log(`${ciclosParaExibir.length} ciclos renderizados com sucesso`);

    } catch (error) {
      console.error("Erro ao carregar ciclos:", error);
      
      const container = document.getElementById("lista-ciclos");
      if (container) {
        container.innerHTML = `
          <div class="erro-container">
            <p class="erro-carregamento">
              Erro ao carregar ciclos. Por favor, recarregue a página.
            </p>
            <button onclick="recarregarCiclos()" class="botao-recarga">
              Tentar novamente
            </button>
          </div>
        `;
      }
    }
  }

  window.recarregarCiclos = function() {
    console.log("Recarregando ciclos...");
    window.ciclosTelaInicializado = false;
    carregarCiclos();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log("DOM completamente carregado - iniciando carregamento de ciclos");
      // Pequeno delay para garantir que tudo está pronto
      setTimeout(carregarCiclos, 100);
    });
  } else {
    console.log("DOM já carregado - iniciando carregamento de ciclos");
    setTimeout(carregarCiclos, 100);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log("Página ficou visível novamente");
    }
  });

}
