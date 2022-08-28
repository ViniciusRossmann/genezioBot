## em manutenção

# GenezioBot

Bot para tocar musicas (ou sons de videos em geral) em canais de voz do discord.

## Comandos

- Reproduzir video / adicionar à fila de reprodução 

!tocar ou !t

```
!tocar toxicity

!t https://www.youtube.com/watch?v=iywaBOMvYLI
```

- Pular para o próximo video (ou sair da sala, caso não tenha mais nada na fila)

!pular ou !p

```
!pular

!p
```

## Instalação

### Configuração: 

É necessário criar um arquivo .env na raiz do projeto, com os seguintes parâmetros:

- BOT_TOKEN: seu token de bot no discord

### Instalação dos módulos necessários:

```bash
npm install
```

### Execução

```bash
npm run dev
```


