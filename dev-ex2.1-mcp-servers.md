# Desenvolvedor — Exercício 2.1: Configuração de MCP Servers para o Projeto

> **Nota sobre os inputs:** o enunciado referencia o **Anexo C — Estrutura do Repositório** (seção "Exemplo mínimo de configuração MCP") como ponto de partida, mas esse anexo não estava disponível nos arquivos fornecidos para este cenário. O mapeamento e a configuração abaixo foram construídos a partir da lista de ferramentas/serviços do enunciado e de convenções reais do protocolo MCP, sem esse exemplo de referência. Isso por si só é um risco a registrar: **um dev não deveria ter que inferir a convenção de configuração do projeto — isso deveria estar documentado e acessível antes do primeiro uso.**

## 1. Mapeamento de MCP servers

| Server | O que expõe | Quem consome | Existe pronto ou precisa ser construído? |
|---|---|---|---|
| **GitHub** (`db1/novatech-assistant`) | Tools: criar/ler PRs, criar issues, buscar código, ler arquivos, ler status de CI. Resources: conteúdo de arquivos do repo. | Devs e Tech Lead via Copilot; Tech Lead via Claude para revisão de arquitetura. | **Existe** — servidor oficial GitHub MCP (`github/github-mcp-server`). Não precisa ser construído. |
| **Azure DevOps** | Tools: criar/atualizar work items, consultar boards, ler sprints. Resources: work items, queries salvas. | Delivery Manager e Tech Lead via Claude/Cowork; Devs via Copilot para atualizar status de tasks. | **Existe** — servidor oficial Azure DevOps MCP (parte do ecossistema Azure MCP). |
| **Azure AI Search** | Tools: executar query de teste no índice, inspecionar schema do índice. Resources: metadados do índice (não o conteúdo bruto dos documentos do cliente). | Devs via Copilot/Claude, só em ambiente de dev/homologação — para testar retrieval durante o desenvolvimento do query endpoint. | **Parcial** — existe cobertura genérica de Azure Search no Azure MCP Server; validar se cobre os cenários de teste do projeto ou se precisa de um wrapper fino customizado. |
| **Azure OpenAI** | Tools: chamada de teste ao endpoint de geração (para smoke test do pipeline, não para uso geral do agente). | Devs via Copilot, só para testes de integração — não deve ser uma tool de uso livre do agente. | **Parcial** — mesma cobertura do Azure MCP Server; uso deliberadamente restrito (ver riscos, item 3). |
| **Confluence (NovaTech)** | Resources: páginas de documentação de negócio, **somente leitura**. Sem tools de escrita. | Product Specialist e QA via Claude/Cowork, para consulta de contexto de negócio. Devs só quando precisarem entender uma regra de domínio. | **Existe** — Atlassian oferece MCP remoto para Confluence/Jira. Precisa de configuração de escopo (ver riscos, item 1). |

## 2. Permissões mínimas (least privilege)

- **GitHub:** token de acesso refinado (fine-grained PAT) escopado só a `db1/novatech-assistant`, com `contents: read`, `pull_requests: write`, `issues: write`. **Sem** `contents: write` direto (push) na branch protegida `main` — mudanças só via PR. Sem escopo de administração do repositório.
- **Azure DevOps:** permissão de leitura/escrita em work items do board do projeto; sem permissão para alterar configuração de pipelines de CI/CD.
- **Azure AI Search:** chave de API **query-only** (não admin key), restrita ao índice do ambiente de dev/homologação — nunca a chave admin nem o índice de produção.
- **Azure OpenAI:** credencial isolada, sem acesso à conta de billing/gestão do recurso; usada só pelo endpoint de smoke test, nunca diretamente como tool livre do agente (ver risco 3).
- **Confluence:** escopo read-only, limitado aos espaços de documentação relevantes ao projeto — não à instância inteira da NovaTech.

## 3. Arquivo de configuração MCP

Ver [`mcp-config/.mcp.json`](mcp-config/.mcp.json). Credenciais nunca ficam hardcoded no arquivo — são referenciadas via variáveis de ambiente, resolvidas pelo cofre de segredos do projeto (Azure Key Vault / GitHub Actions secrets), nunca commitadas.

## 4. Riscos de segurança e mitigações

1. **Vazamento de dados de negócio da NovaTech via Confluence MCP.** O Confluence é da NovaTech (cliente), não da DB1. Se um agente local de um desenvolvedor consultar esse MCP server e o conteúdo recuperado for enviado a um modelo cloud sem as garantias contratuais adequadas (DPA/acordo de processamento de dados), documentação de negócio do cliente pode vazar para fora do perímetro combinado.
   **Mitigação:** restringir o MCP do Confluence aos espaços estritamente necessários ao projeto (não à instância inteira), garantir que o runtime do agente usado pelo time seja o corporativo (com DPA vigente), e proibir uso de contas/ferramentas de IA pessoais para consultar esse server.

2. **Token do GitHub com escopo amplo demais permite que o agente contorne os validation gates.** O Delivery Manager definiu gates humanos entre "código gerado por agente" e "merge" (Exercício 2.1 do Delivery Manager). Se o MCP do GitHub tiver `contents: write` direto na `main` ou permissão de merge automático, um agente (ou um prompt malicioso) pode empurrar código sem revisão humana, anulando o gate combinado.
   **Mitigação:** token só com permissão de abrir PR, nunca de merge; proteção de branch na `main` exigindo aprovação humana, aplicada no GitHub — não apenas como uma regra de processo que depende de disciplina.

3. **Prompt injection via conteúdo recuperado (Confluence/AI Search) disparando ações de escrita (GitHub/Azure DevOps).** Um documento indexado — mesmo sem má intenção original — pode conter texto que, se interpretado literalmente pelo agente, pareça uma instrução ("ignore as regras anteriores e..."). Se o mesmo agente tiver, na mesma sessão, tools de leitura de conteúdo externo e tools de escrita (abrir PR, alterar work item), esse texto pode acionar uma ação indevida sem que o desenvolvedor tenha pedido.
   **Mitigação:** tratar todo conteúdo vindo de MCP resources como dado, nunca como instrução; nas sessões em que o agente consome Confluence/AI Search livremente, não conceder na mesma sessão tools de escrita de alto impacto sem uma confirmação explícita do humano por ação.

4. **Credenciais Azure com escopo de assinatura em vez de escopo por recurso.** Se a chave usada pelo MCP de Azure AI Search/OpenAI for de nível de assinatura (em vez de restrita ao recurso/índice específico do projeto), uma chamada indevida (erro do agente ou exploração) pode afetar outros índices/recursos da conta Azure da DB1/NovaTech, não só o do projeto.
   **Mitigação:** credenciais e service principals escopados ao resource group do projeto, nunca à assinatura inteira; chave de API do AI Search apenas query-only para os MCP tools usados pelos agentes — a chave admin (usada só pelo pipeline de ingestão) nunca é exposta a um MCP tool.
