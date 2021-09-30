# GenezioBot

Bot para tocar musicas (ou sons de videos em geral) em canais de voz do discord.

Você pode adicioná-lo ao seu servidor [clicando aqui](https://discord.com/api/oauth2/authorize?client_id=888232789906964550&permissions=0&scope=bot), ou instalar sua própria versão, seguindo as intruções desse documento.

## Comandos

- Reproduzir video / adicionar à fila de reprodução 

!tocar ou !t

```
!tocar toxicity

!t https://www.youtube.com/watch?v=iywaBOMvYLI
```

- Pular para o próximo video (ou sair da sala, caso não mais nada na fila)

!pular ou !p

```
!pular

!p
```

## Instalação

### Configuração: 

É necessário criar um arquivo .env na raiz do projeto, com os seguintes parâmetros:

- BOT_TOKEN: seu token de bot no discord
- GOOGLE_KEY: seu token de acesso à api de dados do youtube

### Instalação dos módulos necessários:

```bash
npm install
```

### Execução

```bash
npm run start
```


