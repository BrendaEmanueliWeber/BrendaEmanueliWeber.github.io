const SUPABASE_URL = 'https://lddyxmomzwbmfughelbd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZHl4bW9tendibWZ1Z2hlbGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzU2MjcsImV4cCI6MjA3NTkxMTYyN30.yNOFvtsQ-aUvLboOAfVg7lq4Hh9rIcBbhDf7Vu-0qq8';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authArea = document.getElementById('auth-area');
const userArea = document.getElementById('user-area');
const loginBox = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const agendamentoForm = document.getElementById('agendamento-form');
const showRegisterBtn = document.getElementById('show-register-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const listaAgendamentos = document.getElementById('lista-agendamentos');

const modalContainer = document.getElementById('modal-container');
const modalDetails = document.getElementById('modal-details');
const modalCloseBtn = document.getElementById('modal-close-btn');

let agendamentosAtuais = [];

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
        alert('Erro ao cadastrar: ' + error.message);
    } else {
        alert('Cadastro realizado! Um e-mail de confirmação foi enviado para você.');
        registerBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    }
});

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        alert('Erro ao sair da conta: ' + error.message);
    }
});

async function fetchAgendamentos() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    const { data, error } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .eq('user_id', user.id)
        .order('data_agendamento', { ascending: false });
    if (error) {
        console.error('Erro ao buscar agendamentos:', error);
    } else {
        agendamentosAtuais = data;
        renderAgendamentosNaTela();
    }
}

function renderAgendamentosNaTela() {
    listaAgendamentos.innerHTML = '';
    if (agendamentosAtuais.length === 0) {
        listaAgendamentos.innerHTML = '<li>Você ainda não fez nenhum agendamento.</li>';
        return;
    }
    agendamentosAtuais.forEach((agendamento, index) => {
        const dataFormatada = new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>Doação agendada para ${dataFormatada} às ${agendamento.hora_agendamento.substring(0, 5)}</strong>
                <small>Doador: ${agendamento.nome_completo}</small>
            </div>
            <button class="details-btn" data-index="${index}">Ver Detalhes</button>
        `;
        listaAgendamentos.appendChild(li);
    });
    document.querySelectorAll('.details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const index = event.target.dataset.index;
            abrirModalDetalhes(index);
        });
    });
}

agendamentoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert('Sessão expirada. Faça o login novamente para agendar.');
        return;
    }

    const formData = new FormData(event.target);

    const perfilData = {
        user_id: user.id,
        nome_completo: formData.get('nome_completo'),
        data_nascimento: formData.get('data_nascimento'),
        cpf_rg: formData.get('cpf_rg'),
        telefone: formData.get('telefone'),
        email: formData.get('email'),
    };

    const agendamentoData = {
        user_id: user.id,
        data_agendamento: formData.get('data_agendamento'),
        hora_agendamento: formData.get('hora_agendamento'),
    };

    const { error: perfilError } = await supabaseClient
        .from('perfis')
        .upsert(perfilData);

    if (perfilError) {
        alert('Erro ao salvar seus dados: ' + perfilError.message);
        return;
    }

    const { error: agendamentoError } = await supabaseClient
        .from('agendamentos')
        .insert(agendamentoData);

    if (agendamentoError) {
        alert('Erro ao confirmar agendamento: ' + agendamentoError.message);
    } else {
        alert('Agendamento confirmado com sucesso!');
        agendamentoForm.reset();
        fetchAgendamentos();
    }
});

function abrirModalDetalhes(index) {
    const agendamento = agendamentosAtuais[index];
    if (!agendamento) return;
    const dataAgendamentoFormatada = new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const dataNascimentoFormatada = new Date(agendamento.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    modalDetails.innerHTML = `
        <p><strong>Nome Completo:</strong> ${agendamento.nome_completo}</p>
        <p><strong>Data de Nascimento:</strong> ${dataNascimentoFormatada}</p>
        <p><strong>CPF ou RG:</strong> ${agendamento.cpf_rg}</p>
        <p><strong>Telefone:</strong> ${agendamento.telefone}</p>
        <p><strong>E-mail:</strong> ${agendamento.email}</p>
        <p><strong>Data da Doação:</strong> ${dataAgendamentoFormatada}</p>
        <p><strong>Hora da Doação:</strong> ${agendamento.hora_agendamento.substring(0, 5)}</p>
    `;
    document.body.classList.add('modal-open');
    modalContainer.classList.remove('hidden');
}

function fecharModal() {
    document.body.classList.remove('modal-open');
    modalContainer.classList.add('hidden');
}

modalCloseBtn.addEventListener('click', fecharModal);
modalContainer.addEventListener('click', (event) => {
    if (event.target === modalContainer) {
        fecharModal();
    }
});

showRegisterBtn.addEventListener('click', () => {
    loginBox.classList.add('hidden');
    registerBox.classList.remove('hidden');
});

showLoginBtn.addEventListener('click', () => {
    registerBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
});

function atualizarInterface(user) {
    if (user) {
        authArea.classList.add('hidden');
        userArea.classList.remove('hidden');
        fetchAgendamentos();
    } else {
        authArea.classList.remove('hidden');
        userArea.classList.add('hidden');
    }
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
    const user = session?.user || null;
    atualizarInterface(user);
});