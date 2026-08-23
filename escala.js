// =====================================================
// ESCALA DE CULTOS (dados públicos vindos do LT Sistemas)
// =====================================================
// Este site não tem login — usa a chave pública (anon/publishable)
// do Supabase, que só permite LEITURA da tabela escalas_culto.
// A gestão da escala é feita pelo módulo "Escala de Cultos"
// dentro do LT Sistemas.
// =====================================================

const SUPABASE_URL = 'https://homcoqxvnskmhkofwyef.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Ep0zPdN8-GToiegta4fT9w_Gxf-8du_';

const supabaseEscala = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


function formatarDataEscala(dataISO) {

    const [ano, mes, dia] = dataISO.split('-');
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));

    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long'
    });
}


async function carregarEscalaPublica() {

    const lista = document.getElementById('listaEscalaPublica');

    if (!lista) {
        return;
    }

    const hoje = new Date();
    const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    try {

        const { data, error } = await supabaseEscala
            .from('escalas_culto')
            .select('*')
            .gte('data', hojeISO)
            .order('data', { ascending: true })
            .limit(7);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            lista.innerHTML = '<p class="escala-vazia">A escala da semana ainda não foi publicada.</p>';
            return;
        }

        lista.innerHTML = '';

        data.forEach(escala => {

            const card = document.createElement('article');
            card.className = 'escala-card';

            card.innerHTML = `
                <div class="escala-data">
                    <span class="escala-dia-semana"></span>
                    <span class="escala-data-numero"></span>
                </div>
                <div class="escala-detalhes">
                    <p class="escala-tipo"></p>
                    <p class="escala-turno"></p>
                    <div class="escala-pessoas"></div>
                </div>
            `;

            card.querySelector('.escala-dia-semana').textContent = escala.dia_semana || '';
            card.querySelector('.escala-data-numero').textContent = formatarDataEscala(escala.data);
            card.querySelector('.escala-tipo').textContent = escala.tipo_culto || 'Culto';
            card.querySelector('.escala-turno').textContent = escala.turno || '';

            const pessoas = card.querySelector('.escala-pessoas');

            if (escala.abertura) {
                const linha = document.createElement('span');
                linha.textContent = `Abertura: ${escala.abertura}`;
                pessoas.appendChild(linha);
            }

            if (escala.mensagem) {
                const linha = document.createElement('span');
                linha.textContent = `Mensagem: ${escala.mensagem}`;
                pessoas.appendChild(linha);
            }

            lista.appendChild(card);
        });

    } catch (erro) {

        console.error('Erro ao carregar escala:', erro);
        lista.innerHTML = '<p class="escala-vazia">Não foi possível carregar a escala no momento.</p>';
    }
}

carregarEscalaPublica();
