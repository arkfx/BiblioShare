(function () {
  const SELECTOR = '[data-chat-transacao="true"]';

  const formatarData = (valorIso) => {
    const data = new Date(valorIso);
    if (Number.isNaN(data.getTime())) {
      return valorIso;
    }
    return data.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const extrairResultados = (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && Array.isArray(payload.results)) {
      return payload.results;
    }
    return [];
  };

  const iniciarChat = (container) => {
    const mensagensContainer = container.querySelector('[data-chat-mensagens]');
    const placeholder = container.querySelector('[data-chat-placeholder]');
    const statusElemento = container.querySelector('[data-chat-status]');
    const erroElemento = container.querySelector('[data-chat-error]');
    const formulario = container.querySelector('[data-chat-form]');
    const campoConteudo = container.querySelector('[data-chat-input]');
    const csrfInput = formulario ? formulario.querySelector('input[name="csrfmiddlewaretoken"]') : null;

    if (!mensagensContainer || !formulario || !campoConteudo || !csrfInput) {
      return;
    }

    const usuarioId = Number(mensagensContainer.dataset.usuarioId);
    const endpoint =
      container.dataset.chatEndpoint ||
      `/api/transacoes/${container.dataset.transacaoId}/mensagens/`;
    const mensagens = [];
    let ultimoId = null;
    let intervalo = null;

    const atualizarStatus = (texto) => {
      if (statusElemento) {
        statusElemento.textContent = texto;
      }
    };

    const mostrarErro = (texto) => {
      if (!erroElemento) {
        return;
      }
      if (texto) {
        erroElemento.textContent = texto;
        erroElemento.classList.remove('d-none');
      } else {
        erroElemento.textContent = '';
        erroElemento.classList.add('d-none');
      }
    };

    const rolarParaBase = () => {
      mensagensContainer.scrollTop = mensagensContainer.scrollHeight;
    };

    const renderizarMensagens = () => {
      mensagensContainer.replaceChildren();
      if (!mensagens.length) {
        if (placeholder) {
          placeholder.classList.remove('d-none');
          mensagensContainer.appendChild(placeholder);
        }
        return;
      }
      if (placeholder) {
        placeholder.classList.add('d-none');
      }
      mensagens.forEach((mensagem) => {
        const wrapper = document.createElement('div');
        wrapper.className = `d-flex mb-2 ${
          mensagem.remetente === usuarioId ? 'justify-content-end' : 'justify-content-start'
        }`;
        const balao = document.createElement('div');
        const classesBase = 'px-3 py-2 rounded-3 shadow-sm';
        balao.className =
          mensagem.remetente === usuarioId
            ? `${classesBase} text-bg-primary text-white`
            : `${classesBase} bg-light`;
        const conteudo = document.createElement('p');
        conteudo.className = 'mb-1';
        conteudo.textContent = mensagem.conteudo;
        const metadata = document.createElement('small');
        metadata.className = 'text-muted';
        metadata.textContent = `${mensagem.remetente_nome} · ${formatarData(mensagem.criado_em)}`;
        balao.appendChild(conteudo);
        balao.appendChild(metadata);
        wrapper.appendChild(balao);
        mensagensContainer.appendChild(wrapper);
      });
      rolarParaBase();
    };

    const registrarMensagens = (novas, substituir = false) => {
      if (substituir) {
        mensagens.length = 0;
      }
      if (!Array.isArray(novas) || !novas.length) {
        ultimoId = mensagens.length ? mensagens[mensagens.length - 1].id : null;
        renderizarMensagens();
        return;
      }
      novas.forEach((mensagem) => {
        if (!mensagens.find((item) => item.id === mensagem.id)) {
          mensagens.push(mensagem);
        }
      });
      mensagens.sort((a, b) => a.id - b.id);
      ultimoId = mensagens.length ? mensagens[mensagens.length - 1].id : null;
      renderizarMensagens();
    };

    const carregarMensagens = async (incremental = false) => {
      let url = endpoint;
      if (incremental && ultimoId) {
        const divisor = url.includes('?') ? '&' : '?';
        url = `${url}${divisor}depois_de=${ultimoId}`;
      }
      try {
        atualizarStatus('Sincronizando...');
        const resposta = await fetch(url, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'same-origin',
        });
        if (!resposta.ok) {
          throw new Error('Falha ao carregar mensagens');
        }
        const payload = await resposta.json();
        const dados = extrairResultados(payload);
        registrarMensagens(dados, !incremental);
        atualizarStatus(
          `Atualizado às ${new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        );
        mostrarErro('');
      } catch (erro) {
        atualizarStatus('Erro de sincronização');
        mostrarErro('Não foi possível carregar as mensagens. Tente novamente em instantes.');
      }
    };

    const iniciarPolling = () => {
      if (intervalo) {
        clearInterval(intervalo);
      }
      intervalo = setInterval(() => {
        carregarMensagens(true);
      }, 4000);
    };

    const interromperPolling = () => {
      if (intervalo) {
        clearInterval(intervalo);
        intervalo = null;
      }
    };

    const visibilidadeHandler = () => {
      if (document.hidden) {
        interromperPolling();
      } else {
        carregarMensagens(true);
        iniciarPolling();
      }
    };

    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const mensagem = campoConteudo.value.trim();
      if (!mensagem) {
        return;
      }
      const botao = formulario.querySelector('button[type="submit"]');
      if (botao) {
        botao.disabled = true;
      }
      try {
        const resposta = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfInput.value,
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'same-origin',
          body: JSON.stringify({ conteudo: mensagem }),
        });
        if (!resposta.ok) {
          throw new Error('Erro ao enviar mensagem');
        }
        const novaMensagem = await resposta.json();
        registrarMensagens([novaMensagem]);
        campoConteudo.value = '';
        mostrarErro('');
        atualizarStatus('Mensagem enviada');
      } catch (erro) {
        mostrarErro('Não foi possível enviar a mensagem.');
      } finally {
        if (botao) {
          botao.disabled = false;
        }
        campoConteudo.focus();
      }
    });

    document.addEventListener('visibilitychange', visibilidadeHandler);
    carregarMensagens(false).then(() => {
      iniciarPolling();
    });
  };

  const inicializarChats = () => {
    document.querySelectorAll(SELECTOR).forEach(iniciarChat);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarChats);
  } else {
    inicializarChats();
  }
})();


