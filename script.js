// =========================================
// ANO ATUAL NO RODAPÉ
// =========================================
var elAno = document.getElementById('anoAtual');
if (elAno) {
    elAno.textContent = new Date().getFullYear();
}


// =========================================
// MENU MOBILE
// =========================================
var btnMenu = document.getElementById('btnMenu');
var navMobile = document.getElementById('navMobile');

if (btnMenu && navMobile) {
    btnMenu.addEventListener('click', function () {
        var aberto = navMobile.classList.toggle('aberto');
        btnMenu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });

    navMobile.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navMobile.classList.remove('aberto');
            btnMenu.setAttribute('aria-expanded', 'false');
        });
    });
}


// =========================================
// RÁDIO FIXA NO TOPO
// =========================================
(function () {

    var audio = document.getElementById('radioAudio');
    var btnPlay = document.getElementById('radioPlay');
    var iconePlay = document.getElementById('radioPlayIcone');
    var btnHero = document.getElementById('btnOuvirRadioHero');

    if (!audio || !btnPlay) return;

    function atualizarVisual(tocando) {
        btnPlay.classList.toggle('tocando', tocando);
        iconePlay.textContent = tocando ? '❚❚' : '▶';
        btnPlay.setAttribute('aria-label', tocando ? 'Pausar rádio' : 'Tocar rádio ao vivo');
    }

    function tocar() {
        // preload="none": só carrega o stream quando alguém manda tocar
        if (!audio.src) {
            var fonte = audio.querySelector('source');
            if (fonte) audio.src = fonte.src;
        }
        var promessa = audio.play();
        if (promessa !== undefined) {
            promessa.catch(function () {
                // Navegador bloqueou o autoplay — comportamento normal e
                // esperado na primeira visita. O botão fica pronto pra
                // iniciar com um clique.
                atualizarVisual(false);
            });
        }
    }

    function alternar() {
        if (audio.paused) {
            tocar();
        } else {
            audio.pause();
        }
    }

    audio.addEventListener('play', function () { atualizarVisual(true); });
    audio.addEventListener('pause', function () { atualizarVisual(false); });

    btnPlay.addEventListener('click', alternar);

    if (btnHero) {
        btnHero.addEventListener('click', function (e) {
            e.preventDefault();
            alternar();
        });
    }

    // Tenta iniciar sozinho assim que a página carrega.
    window.addEventListener('load', tocar);

})();


// =========================================
// CARROSSEL DE VÍDEOS DO YOUTUBE (via RSS)
// =========================================
(function () {

    var CANAL_ID = 'UCOEeEDiX1mEMBkSNFkYR6yA'; // canal oficial da IPJC
    var MAX_VIDEOS = 12;

    var faixa = document.getElementById('videosFaixa');
    if (!faixa) return;

    var setaEsq = document.getElementById('videosSetaEsq');
    var setaDir = document.getElementById('videosSetaDir');

    var rssUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CANAL_ID;
    var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);

    fetch(apiUrl)
        .then(function (resp) {
            if (!resp.ok) throw new Error('Falha ao buscar o feed');
            return resp.json();
        })
        .then(function (dados) {
            if (!dados.items || !dados.items.length) throw new Error('Feed vazio');

            return prepararCandidatos(dados.items);
        })
        .then(function (candidatosValidos) {
            var validos = candidatosValidos.filter(Boolean).slice(0, MAX_VIDEOS);
            if (!validos.length) throw new Error('Nenhum vídeo horizontal encontrado');
            montarCarrossel(validos);
        })
        .catch(function (erro) {
            console.error('Não foi possível carregar os vídeos do YouTube:', erro);
            faixa.innerHTML = '<p class="videos-erro">Não encontramos vídeos pra mostrar agora. ' +
                '<a href="https://www.youtube.com/channel/' + CANAL_ID + '" target="_blank" rel="noopener">Veja todos no YouTube</a>.</p>';
            if (setaEsq) setaEsq.style.display = 'none';
            if (setaDir) setaDir.style.display = 'none';
        });

    function extrairVideoId(item) {
        // rss2json expõe o guid como "yt:video:VIDEO_ID"
        if (item.guid && item.guid.indexOf('yt:video:') === 0) {
            return item.guid.replace('yt:video:', '');
        }
        // fallback: tenta extrair da URL do link
        var match = item.link && item.link.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
    }

    function formatarData(dataISO) {
        try {
            var d = new Date(dataISO);
            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return '';
        }
    }

    // Carrega a miniatura antes de decidir se entra no carrossel — descarta
    // qualquer thumbnail vertical (Shorts) ou que falhe ao carregar.
    function prepararCandidatos(itens) {
        var promessas = itens.map(function (item) {
            var videoId = extrairVideoId(item);
            if (!videoId) return Promise.resolve(null);

            var thumb = (item.thumbnail && item.thumbnail.trim())
                ? item.thumbnail
                : 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';

            return checarThumbHorizontal(thumb).then(function (horizontal) {
                if (!horizontal) return null;
                return { item: item, videoId: videoId, thumb: thumb };
            });
        });

        return Promise.all(promessas);
    }

    function checarThumbHorizontal(url) {
        return new Promise(function (resolve) {
            var img = new Image();
            img.onload = function () {
                resolve(img.naturalWidth >= img.naturalHeight);
            };
            img.onerror = function () {
                resolve(false);
            };
            img.src = url;
        });
    }

    function montarCarrossel(candidatos) {
        faixa.innerHTML = '';

        candidatos.forEach(function (c) {
            var card = document.createElement('a');
            card.className = 'video-card';
            card.href = 'https://www.youtube.com/watch?v=' + c.videoId;
            card.target = '_blank';
            card.rel = 'noopener';
            card.setAttribute('role', 'listitem');

            card.innerHTML =
                '<div class="video-card-thumb">' +
                    '<img src="' + c.thumb + '" alt="" loading="lazy">' +
                    '<div class="video-card-play"><span>▶</span></div>' +
                '</div>' +
                '<div class="video-card-corpo">' +
                    '<p class="video-card-titulo">' + escaparHtml(c.item.title || '') + '</p>' +
                    '<p class="video-card-data">' + formatarData(c.item.pubDate) + '</p>' +
                '</div>';

            faixa.appendChild(card);
        });

        if (setaEsq && setaDir) {
            setaEsq.addEventListener('click', function () { rolar(-1); });
            setaDir.addEventListener('click', function () { rolar(1); });
        }
    }

    function rolar(direcao) {
        var cardExemplo = faixa.querySelector('.video-card');
        var largura = cardExemplo ? cardExemplo.offsetWidth + 16 : 300;
        faixa.scrollBy({ left: direcao * largura * 2, behavior: 'smooth' });
    }

    function escaparHtml(texto) {
        var div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

})();


// =========================================
// DESTAQUE DO DIA ATUAL NA GRADE DE CULTOS
// =========================================
(function () {

    var cards = document.querySelectorAll('.dia-card[data-dia]');
    if (!cards.length) return;

    var hoje = new Date().getDay(); // 0 = domingo ... 6 = sábado

    cards.forEach(function (card) {
        if (parseInt(card.getAttribute('data-dia'), 10) === hoje) {
            card.classList.add('dia-destaque');
        }
    });

})();
