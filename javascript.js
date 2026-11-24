let chaveIA = "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";

async function cliqueiNoBotao() {
  const cidade = document.querySelector(".input-cidade").value.trim();
  const caixa = document.querySelector(".caixa-media");
  const chave = "783d4db6f7806d51b4af24dd38d2cba9";

  if (!cidade) {
    caixa.innerHTML = `<p class="erro">Digite o nome de uma cidade.</p>`;
    return;
  }

  caixa.innerHTML = `<p class="carregando">Buscando previsão...</p>`;

  try {
    const cidadeCodificada = encodeURIComponent(cidade);
    const [respostaAtual, respostaPrevisao] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidadeCodificada}&appid=${chave}&units=metric&lang=pt_br`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cidadeCodificada}&appid=${chave}&units=metric&lang=pt_br`),
    ]);
    const [dadosJson, dadosPrevisao] = await Promise.all([
      respostaAtual.json(),
      respostaPrevisao.json(),
    ]);

    if (!respostaAtual.ok) {
      throw new Error(dadosJson.message || "Não foi possível buscar o clima dessa cidade.");
    }

    if (!respostaPrevisao.ok) {
      throw new Error(dadosPrevisao.message || "Não foi possível buscar a previsão dos próximos dias.");
    }

    const previsaoDias = selecionarPrevisaoDiaria(dadosPrevisao);
    const previsaoHtml = previsaoDias.length
      ? previsaoDias.map((dia) => `
          <article class="cartao-previsao">
            <h4>${dia.nome}</h4>
            <img src="https://openweathermap.org/img/wn/${dia.icone}.png" alt="${dia.descricao}">
            <p class="descricao-previsao">${dia.descricao}</p>
            <p class="temperaturas-previsao">
              <span>Máx. ${Math.round(dia.maxima)}°</span>
              <span>Mín. ${Math.round(dia.minima)}°</span>
            </p>
          </article>
        `).join("")
      : `<p class="erro">Não há previsão disponível para os próximos dias.</p>`;

    caixa.innerHTML = `
        <h2 class="cidade">${dadosJson.name}</h2>
        <p class="temp">${Math.floor(dadosJson.main.temp)} °C</p>
        <img class="icone" src="https://openweathermap.org/img/wn/${dadosJson.weather[0].icon}.png" alt="${dadosJson.weather[0].description}">
        <p class="umidade"> Umidade: ${dadosJson.main.humidity}%</p>
        <p class="descricao"> ${dadosJson.weather[0].description}</p>
        <button class="botao-ia" onclick="pedirSugestaoRoupa()">Sugestão</button>
        <p class="resposta-ia"></p>
        <section class="previsao">
          <h3>Previsão dos próximos 5 dias</h3>
          <div class="lista-previsao">${previsaoHtml}</div>
        </section>
    `;
  } catch (erro) {
    caixa.innerHTML = `<p class="erro">${erro.message}</p>`;
  }
}

function selecionarPrevisaoDiaria(dados) {
  const diferencaFuso = dados.city.timezone;
  const previsaoPorDia = new Map();
  const hojeLocal = new Date(Date.now() + diferencaFuso * 1000)
    .toISOString()
    .slice(0, 10);

  for (const item of dados.list) {
    const dataLocal = new Date((item.dt + diferencaFuso) * 1000);
    const data = dataLocal.toISOString().slice(0, 10);

    if (data <= hojeLocal) continue;

    const horaLocal = dataLocal.getUTCHours() + dataLocal.getUTCMinutes() / 60;
    const dia = previsaoPorDia.get(data) || {
      data,
      distanciaDoMeioDia: Infinity,
      minima: item.main.temp_min,
      maxima: item.main.temp_max,
      itemRepresentativo: item,
    };

    dia.minima = Math.min(dia.minima, item.main.temp_min);
    dia.maxima = Math.max(dia.maxima, item.main.temp_max);

    if (Math.abs(horaLocal - 12) < dia.distanciaDoMeioDia) {
      dia.distanciaDoMeioDia = Math.abs(horaLocal - 12);
      dia.itemRepresentativo = item;
    }

    previsaoPorDia.set(data, dia);
  }

  return [...previsaoPorDia.values()].slice(0, 5).map((dia) => ({
    nome: new Date(`${dia.data}T12:00:00Z`).toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }),
    minima: dia.minima,
    maxima: dia.maxima,
    icone: dia.itemRepresentativo.weather[0].icon,
    descricao: dia.itemRepresentativo.weather[0].description,
  }));
}

function detectaVoz() {
    let reconhecimento = new webkitSpeechRecognition();
    reconhecimento.lang = "pt-BR";
    reconhecimento.start();

    reconhecimento.onresult = function (event) {
        {
            let resultado = event.results[0][0].transcript;
            document.querySelector(".input-cidade").value = resultado;
            cliqueiNoBotao();
        }
    };

}

async function pedirSugestaoRoupa() {
    let temp = document.querySelector(".temp").textContent
    let umidade = document.querySelector(".umidade").textContent
    let cidade = document.querySelector(".cidade").textContent


    let resposta = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + chaveIA,
        },
        body: JSON.stringify({
          "model": "openai/gpt-oss-120b",
          messages: [
            {
              role: "user",
              content: `Me dê uma sugestão de roupa para usar em ${cidade}, a temperatura atual é de ${temp} e a umidade é de ${umidade}. me avisa se vai chover ou fazer sol, e me diga se é melhor usar um casaco ou uma roupa mais leve. Seja breve e direto ao ponto, sem rodeios. e sem preciso levar o guarda chuva?`,
            },
          ],
        }),
      },
    );
    
    let dados = await resposta.json();
    document.querySelector(".resposta-ia").innerHTML = dados.choices[0].message.content;
    console.log(dados)
}


