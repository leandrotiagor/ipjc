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
            montarCarrossel(dados.items.slice(0, MAX_VIDEOS));
        })
        .catch(function (erro) {
            console.error('Não foi possível carregar os vídeos do YouTube:', erro);
            faixa.innerHTML = '<p class="videos-erro">Não foi possível carregar os vídeos agora. ' +
                '<a href="https://www.youtube.com/channel/' + CANAL_ID + '" target="_blank" rel="noopener">Veja no YouTube</a>.</p>';
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

    function montarCarrossel(itens) {
        faixa.innerHTML = '';

        itens.forEach(function (item) {
            var videoId = extrairVideoId(item);
            if (!videoId) return;

            var thumb = (item.thumbnail && item.thumbnail.trim())
                ? item.thumbnail
                : 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';

            var card = document.createElement('a');
            card.className = 'video-card';
            card.href = 'https://www.youtube.com/watch?v=' + videoId;
            card.target = '_blank';
            card.rel = 'noopener';
            card.setAttribute('role', 'listitem');

            card.innerHTML =
                '<div class="video-card-thumb">' +
                    '<img src="' + thumb + '" alt="" loading="lazy">' +
                    '<div class="video-card-play"><span>▶</span></div>' +
                '</div>' +
                '<div class="video-card-corpo">' +
                    '<p class="video-card-titulo">' + escaparHtml(item.title || '') + '</p>' +
                    '<p class="video-card-data">' + formatarData(item.pubDate) + '</p>' +
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
