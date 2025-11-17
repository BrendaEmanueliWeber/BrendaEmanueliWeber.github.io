const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA-ANON-KEY";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cadastrar(email, senha) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: senha
    });

    if (error) {
        alert("Erro: " + error.message);
        return;
    }

    alert("Conta criada! Verifique seu e-mail.");
}

async function login(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) {
        alert("Erro: " + error.message);
        return;
    }

    alert("Logado com sucesso!");
}


async function pegarUsuario() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}


async function criarAgendamento(form) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        alert("Você precisa estar logado.");
        return;
    }

    const { error } = await supabase
        .from("agendamentos")
        .insert({
            usuario_id: user.id,
            nome_completo: form.nome,
            data_nascimento: form.dataNasc,
            documento: form.doc,
            telefone: form.telefone,
            email_contato: form.emailContato,
            data_agendamento: form.dataAgendamento,
            horario: form.horario
        });

    if (error) {
        alert("Erro: " + error.message);
        return;
    }

    alert("Agendamento registrado com sucesso!");
}
