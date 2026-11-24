# Lucas Cruz — Portfólio

Portfólio pessoal de **Lucas Renato Vieira da Cruz**, estudante de Análise e Desenvolvimento de Sistemas na Fatec Jales.

Feito com **HTML5, CSS3 e JavaScript Vanilla** — sem frameworks, sem build.

## Estrutura

```
portfolio/
├── index.html            # Estrutura e conteúdo de todas as seções
├── css/
│   └── style.css         # Estilos (tokens de cor no topo, responsividade no final)
├── js/
│   └── script.js         # Navbar, animações, API do GitHub, filtros
└── assets/
    ├── images/
    │   ├── foto.jpg              # Foto da seção Sobre
    │   ├── avatar-fallback.svg   # Monograma usado se a foto não carregar
    │   └── noise.svg             # Textura de ruído do fundo
    └── icons/
        └── favicon.svg
```

## Executar localmente

O site é estático — basta abrir o `index.html` no navegador. Para que a API do GitHub e o cache funcionem do jeito mais fiel ao site publicado, prefira um servidor local:

**Opção 1 — VS Code:** instale a extensão *Live Server*, clique com o botão direito no `index.html` → *Open with Live Server*.

**Opção 2 — Node.js:**

```bash
npx serve .
```

**Opção 3 — Python:**

```bash
python -m http.server 5500
```

Depois acesse `http://localhost:5500` (ou a porta indicada).

## Publicar no GitHub Pages

1. Crie um repositório (ex.: `lucasrcruz7.github.io` para usar o domínio principal, ou `portfolio`).
2. Envie o conteúdo desta pasta para a raiz do repositório.
3. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.

## Personalização

### Textos
Todo o conteúdo está no `index.html`, organizado por seções com comentários (`HERO`, `SOBRE`, `TECNOLOGIAS`, `PROJETOS`, `JORNADA`, `CONTATO`).

### Foto
A seção *Sobre* usa o avatar público do GitHub (`https://github.com/lucasrcruz7.png`). Para usar outra foto:
1. Salve a imagem em `assets/images/` (ex.: `foto.jpg`, de preferência quadrada ou 4:5).
2. No `index.html`, troque o `src` da tag `<img class="portrait__img">` por `assets/images/foto.jpg`.

Se a imagem falhar, o monograma `avatar-fallback.svg` aparece automaticamente.

### Cores e fontes
No topo do `css/style.css`, em `:root`, ficam as variáveis (`--red`, `--black`, `--font-display` etc.). Alterar ali muda o site inteiro.

### Tecnologias
Cada tecnologia é um `<article class="tech-card">` no `index.html`. Para adicionar uma nova, duplique um card e troque:
- o ícone (`src` do `<img>`) — veja os nomes em [devicon.dev](https://devicon.dev);
- o nome, a categoria e a descrição.

A classe `tech-card--wide` faz o card ocupar duas colunas no desktop.

### Projetos
Os projetos vêm automaticamente da API pública do GitHub. Tudo é configurado no objeto `CONFIG`, no início do `js/script.js`:

| Opção | O que faz |
|---|---|
| `githubUser` | Usuário do GitHub consultado |
| `pageSize` | Quantos cards aparecem antes do botão "Mostrar mais" |
| `excludeRepos` | Repositórios que não devem aparecer |
| `includeForks` | Exibir ou não forks |
| `featuredRepos` | Repositórios em destaque, exibidos primeiro |
| `manualProjects` | Projetos adicionados à mão (aparecem sempre) |
| `fallbackProjects` | Cards reservados, exibidos só se a API falhar |

**Dicas para os cards ficarem melhores:**
- Preencha a **descrição** de cada repositório no GitHub.
- Adicione **topics** (ex.: `react`, `api`, `nodejs`) — eles viram tags nos cards.
- Preencha o campo **Website** do repositório: o card ganha o botão "Ver projeto".

A API pública permite 60 requisições por hora por IP; por isso a resposta fica em cache por 30 minutos (`cacheMinutes`). Se o limite for atingido, o site mostra um aviso, um botão "Tentar novamente" e os projetos manuais/reservados.

### Jornada
Os passos da timeline ficam no `index.html`. Para adicionar datas, troque o texto de `<span class="timeline__step">` (ex.: `Etapa 02` → `2024`).

### Contato
Os links de GitHub e LinkedIn aparecem na navbar, na hero, no contato e no rodapé. Se quiser adicionar um e-mail, duplique um `<a class="contact-card">` e use `href="mailto:seu@email.com"`.

## Acessibilidade e desempenho
- HTML semântico, link "pular para o conteúdo", `aria-*` no menu e nos filtros.
- Respeita `prefers-reduced-motion` (animações desativadas).
- Efeitos de mouse só são ativados em dispositivos com ponteiro fino.
- Conteúdo da API é escapado antes de ser inserido (proteção contra XSS) e links externos usam `rel="noopener noreferrer"`.

## Recursos externos
- Fontes: [Google Fonts](https://fonts.google.com) — Space Grotesk, Inter e JetBrains Mono.
- Ícones de tecnologias: [Devicon](https://devicon.dev) via jsDelivr.
- Ícones de interface: SVG inline (sprite no início do `index.html`).
