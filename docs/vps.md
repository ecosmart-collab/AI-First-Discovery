# Implantar em VPS com Docker e HTTPS

Este roteiro usa uma VPS Linux com Docker Engine e Docker Compose v2 instalados. Recomenda-se iniciar com pelo menos 2 vCPU, 2 GB de RAM e 4 GB livres para o build. O banco é local à VPS; use somente uma instância do serviço `app`.

Endereço escolhido para esta implantação: **`discovery.eltonrosa.site`**. Informe esse domínio no assistente de configuração. O DNS e a disponibilidade das portas ainda precisam ser verificados na VPS antes de publicar.

## Preparar o servidor

Antes da implantação, identifique o sistema operacional, os serviços existentes e o domínio. Em uma VPS compartilhada com outros aplicativos, verifique conflitos nas portas 80 e 443; utilize o proxy já instalado em vez de substituir serviços em uso.

Crie um registro DNS A para o domínio/subdomínio apontando para o IPv4 da VPS. Configure AAAA somente se houver IPv6 funcional. Libere TCP 80 e 443, preservando a porta SSH existente. A porta 3000 fica somente na rede interna do Docker.

Para obter o código enquanto o PR #1 estiver aberto:

```bash
git clone --branch feat/ai-first-discovery https://github.com/ecosmart-collab/AI-First-Discovery.git
cd AI-First-Discovery
```

Após a integração do PR, novos clones podem usar o branch `main`.

## Configurar o proprietário

Se Node.js 24 já estiver instalado no servidor:

```bash
node scripts/setup-vps.mjs
```

Caso contrário, use um contêiner temporário, sem instalar Node no host:

```bash
docker run --rm -it --user "$(id -u):$(id -g)" \
  --mount "type=bind,src=$PWD,dst=/setup" \
  --workdir /setup node:24-bookworm-slim node scripts/setup-vps.mjs
```

O assistente solicita domínio, e-mail e senha, com confirmação e entrada oculta. Ele cria `.env.production` com permissão 600. Esse arquivo é ignorado pelo Git e pelo build Docker; guarde uma cópia segura. Não compartilhe senhas, chaves SSH privadas ou o conteúdo desse arquivo pelo chat.

## Subir a aplicação

```bash
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

O build executa os testes. O serviço `app` roda como usuário sem privilégios e mantém SQLite no volume `discovery_data`. O Caddy aguarda a saúde da aplicação e solicita o certificado automaticamente quando DNS e portas estiverem corretos.

Acesse `https://SEU_DOMINIO`. Confira o redirecionamento de HTTP para HTTPS, entre com seu acesso e verifique que dados permanecem após reiniciar apenas o serviço `app`.

```bash
docker compose --env-file .env.production logs --tail=50 app caddy
```

Não publique a saída de `docker compose config` sem `--quiet`: ela expõe variáveis de configuração. O arquivo de configuração padrão não inclui limitação de tráfego no proxy; em uma implantação exposta à internet, aplique esse controle no provedor ou no proxy conforme o tráfego observado.

## Atualizar

Faça backup antes de atualizar. No checkout, mantenha o mesmo branch da instalação:

```bash
git pull --ff-only
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

As atualizações preservam volumes e credenciais. Não execute novamente o setup. Não use `docker compose down -v`, pois remove os dados persistentes e os certificados.

## Backup consistente

Para copiar o banco com o serviço parado, em uma janela de manutenção:

```bash
umask 077
mkdir -p backups
docker compose --env-file .env.production stop app
docker compose --env-file .env.production cp app:/app/data ./backups
docker compose --env-file .env.production start app
```

O diretório `backups/data` contém o banco e possíveis arquivos WAL/SHM. Não reutilize um destino já preenchido; mova a cópia anterior para um arquivo datado antes da próxima execução. Preserve também `.env.production` separadamente e mantenha cópias protegidas fora da VPS. Se a cópia falhar, reinicie `app` e investigue o erro antes de atualizar.

Para restaurar em um ambiente já configurado, pare `app`, preserve os dados atuais e copie o conteúdo de um backup verificado para `/app/data/` do contêiner parado; remova sessões antigas com uma ferramenta administrativa SQLite antes de iniciar. Confirme o proprietário dos arquivos: UID/GID 1000 dentro do contêiner. Faça o procedimento de restauração primeiro em ambiente de teste.

## Antes da primeira entrevista

Confirme HTTPS, login, persistência, exportação e restauração de backup. Use dados sintéticos na primeira verificação. A URL está acessível pela internet, mas os registros e ações da plataforma exigem autenticação do proprietário.
