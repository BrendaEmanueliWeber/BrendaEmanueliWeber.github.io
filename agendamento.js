const SUPABASE_URL = "https://lddyxmomzwbmfughelbd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZHl4bW9tendibWZ1Z2hlbGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzU2MjcsImV4cCI6MjA3NTkxMTYyN30.yNOFvtsQ-aUvLboOAfVg7lq4Hh9rIcBbhDf7Vu-0qq8";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const agendamentoForm = document.getElementById("agendamento-form");

const loginBox = document.getElementById("login-box");
const registerBox = document.getElementById("register-box");
const userArea = document.getElementById("user-area");

const showRegisterBtn = document.getElementById("show-register-btn");
const showLoginBtn = document.getElementById("show-login-btn");
const logoutBtn = document.getElementById("logout-btn");


showRegisterBtn.onclick = () => {
    loginBox.classList.add("hidden");
    registerBox.classList.remove("hidden");
};

showLoginBtn.onclick = () => {
    registerBox.classList.add("hidden");
    loginBox.classList.remove("hidden");
};

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = registerForm.querySelector("input[type=email]").value;
    const senha = registerForm.querySelector("input[type=password]").value;

    const { error } = await client.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: null }
    });

    if (error) return alert("Erro ao criar conta: " + error.message);

    alert("Conta criada com sucesso!");
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginForm.querySelector("input[type=email]").value;
    const senha = loginForm.querySelector("input[type=password]").value;

    const { error } = await client.auth.signInWithPassword({ email, password: senha });

    if (error) return alert("Erro ao entrar: " + error.message);

    mostrarAreaUsuario();
});


logoutBtn.onclick = async () => {
    await client.auth.signOut();
    userArea.classList.add("hidden");
    loginBox.classList.remove("hidden");
};


async function mostrarAreaUsuario() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    loginBox.classList.add("hidden");
    registerBox.classList.add("hidden");
    userArea.classList.remove("hidden");

    carregarAgendamentos();
}

agendamentoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const { data: { user } } = await client.auth.getUser();
    if (!user) return alert("Você precisa estar logado.");

    const formData = new FormData(agendamentoForm);

    const dados = {
        usuario_id: user.id,
        nome_completo: formData.get("nome_completo"),
        data_nascimento: formData.get("data_nascimento"),
        documento: formData.get("cpf_rg"),
        telefone: formData.get("telefone"),
        email_contato: formData.get("email"),
        data_agendamento: formData.get("data_agendamento"),
        horario: formData.get("hora_agendamento")
    };

    const { error } = await client
        .from("agendamentos")
        .insert(dados);

    if (error) return alert("Erro ao agendar: " + error.message);

    alert("Agendamento criado com sucesso!");
    agendamentoForm.reset();
    carregarAgendamentos();
});

async function carregarAgendamentos() {
    const lista = document.getElementById("lista-agendamentos");
    lista.innerHTML = "";

    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const { data, error } = await client
        .from("agendamentos")
        .select("*")
        .eq("usuario_id", user.id)
        .order("data_agendamento", { ascending: true });

    if (error) {
        console.error("Erro ao buscar agendamentos:", error);
        return;
    }

    data.forEach(a => {
        const li = document.createElement("li");
        li.classList.add("agendamento-item");

        li.innerHTML = `
    <div class="info">
        <span class="data">${a.data_agendamento} — ${a.horario}</span>
        <span class="nome">${a.nome_completo}</span>
    </div>
    <button class="details-btn" data-id="${a.id}">Ver detalhes</button>
`;


        lista.appendChild(li);
    });

    document.querySelectorAll(".details-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            abrirModalDetalhes(id);
        });
    });
}



async function abrirModalDetalhes(id) {
    const modal = document.getElementById("modal-container");
    const detalhes = document.getElementById("modal-details");

    const { data, error } = await client
        .from("agendamentos")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        alert("Erro ao carregar detalhes.");
        return;
    }

    detalhes.innerHTML = `
        <p><strong>Nome:</strong> ${data.nome_completo}</p>
        <p><strong>Data de Nascimento:</strong> ${data.data_nascimento}</p>
        <p><strong>Documento (CPF/RG):</strong> ${data.documento}</p>
        <p><strong>Telefone:</strong> ${data.telefone}</p>
        <p><strong>Email:</strong> ${data.email_contato}</p>
        <p><strong>Data do Agendamento:</strong> ${data.data_agendamento}</p>
        <p><strong>Horário:</strong> ${data.horario}</p>
    `;

    modal.classList.remove("hidden");
}

(async () => {
    const { data: { user } } = await client.auth.getUser();
    if (user) mostrarAreaUsuario();
})();

document.getElementById("modal-close-btn").onclick = () => {
    document.getElementById("modal-container").classList.add("hidden");
};
