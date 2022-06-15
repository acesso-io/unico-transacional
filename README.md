# POC - Transacional

## Introdução

Essa é uma demostração de uso do nosso SDK em uma transação. Veja abaixo o Passo a passo explicando o funcionamento:

## Configuração

- Altere o logo da empresa no diretório: `images/logo-empresa.svg`
- Insira as URLs corretas no arquivo: `js/config.js` <br />



```js
export const environment = {
  baseUrl: "SUA_API_AQUI",
  successUrl: "URL_TELA_SUCESSO",
  skipUrl: "URL_TELA_PULAR",
};
```

A `baseUrl` é a URL do seu backend que será responsável pelas chamadas para nossa API. A `successUrl` é a URL para onde os usuários serão redirecionados em caso de sucesso no fluxo. Já a `skipUrl` é a URL de redirecionamento para pular o fluxo.


## Utilização

- Antes de iniciar é preciso fazer uma request para o endpoint `/transaction` passando o identificador do usuário, que nesse caso é o CPF:

**API Request**

```
POST /transaction
Accept: application/json
Content-Type: application/json
Authorization: "AUTH_TOKEN_JWT"
APIKEY: "API_KEY"
```

```json
{
  "code": "CPF_DO_USUARIO"
}
```

O retorno será o status e o ID da transação:

**API Response**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "Status": true,
  "Id": "b50ee24c-71eb-4a5d-ade1-41c48b44c240"
}
```

Se o status da transação for `true` o processo pode avançar e a tela para iniciar o SDK deve ser carregada. Ao clicar no botão para capturar a selfie, o SDK será inicializado. Após a captura da selfie o retorno será um token JWT.

Após essa etapa é preciso validar a selfie:

**API Request**

```
POST /transaction/validate
Accept: application/json
Content-Type: application/json
Authorization: "AUTH_TOKEN_JWT"
APIKEY: "API_KEY"
```

```json
{
  "code": "CPF_TITULAR_CARTAO",
  "transactional_id": "ID_DA_TRANSACAO",
  "image": "SDK_JWT_OUTPUT",
  "card": {
    "name": "NOME_TITULAR_CARTAO"
  }
}
```

O retorno será o status e o ID da validação biométrica:

**API Response**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "Status": true,
  "Id": "b50ee24c-71eb-4a5d-ade1-41c48b44c240"
}
```

<hr>

## Resumo

- O usuário acessa a aplicação;
- Através de nosso SDK, a aplicação solicita o frame para captura;
- A aplicação renderiza nosso frame para captura em um placeholder pré estabelecido;
- Sua aplicação captura a imagem (de forma automática, manual ou com o liveness com interação), gerando um token JWT;
- A aplicação repassa o JWT para seu servidor;
- Seu servidor interage com as nossas APIs para validar a imagens;
- Nossos servidores retornam a resposta da validação biométrica, que é repassada para sua aplicação;

<img src="https://user-images.githubusercontent.com/1706703/173040789-8df30c0d-4bcc-4d1a-8ce7-a74cb08f6476.png">

Para mais detalhes da documentação do SDK, [clique aqui.](https://developers.unico.io/guias/web/overview/)

Para mais detalhes da documentação da API, [clique aqui.](https://www4.acesso.io/transacional/services/transactional/docs/)
