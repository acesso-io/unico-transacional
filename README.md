# POC - Transacional

## Introdução

Essa é uma demostração de uso do nosso SDK em uma transação. Para dar um contexto um pouco maior, é importante explicar como o fluxo irá funcionar de uma maneira resumida:
  1. Nossos clientes fazem o processo de checkout e coletam os dados necessários (a tela index.html simula isso)
  2. Com o CPF do titular do cartão em mãos, nossos clientes podem verificar se o CPF consta na base de autenticados
  3. Recebendo uma resposta positiva nossos clientes devem direcionar para a tela de captura de biometria (capture.html)
  4. Na tela de captura de biometria (capture.html) caso o usuário não seja o dono do cartão poderá compartilhar um link para o real titular 

Dito isso, temos duas páginas principais nesse repositório:
  - **index.html**: É uma tela de exemplo e que simula o checkout dos nossos clientes. Nossos clientes não precisam usá-la pois é apenas para testes. Porém, nela  poderão encontrar exemplos de códigos de como usar o primeiro método (que é o de verificar se o CPF consta na base de autenticados)
  - **capture.html**: É a tela principal que deve ser embarcada dentro do fluxo de nossos clientes. Para a PoC, orientamos que os clientes coloquem ela em seus próprios servidores e sigam as instruções dessa documentação para o melhor uso. É importante ressaltar que toda a comunicação da tela de capture deve ser feita com o Backend do cliente e o backend do cliente é que deve falar com a nossa API.
  - **confirm-link.html**: É a tela de confirmação se o link foi compartilhado ou não.

Veja abaixo o Passo a passo explicando o funcionamento:

## Configuração

- Altere o logo da empresa no diretório: `images/logo-empresa.svg`
- Insira as URLs corretas no arquivo: `js/config.js` <br />
- Altere o texto de compartilhamento: `js/main.js/getLink`



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

Se o status da transação for `true` o processo pode avançar e é aqui que indicamos que redirecionem para a tela de capture. Já na tela de capture, ao clicar no botão para capturar a selfie, o SDK será inicializado. Após a captura da selfie o retorno será um token JWT que deve ser enviado ao backend dos nossos clientes e posteriormente ao nosso backend.
**IMPORTANTE:** O id retornado deve ser armazenado do lado dos nossos clientes pois ele é a chave para falarmos sobre uma determinada transação (não usaremos mais dados pessoais para falar sobre uma transação a partir deste momento).

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
    "first": "6_PRIMEIROS_DIGITOS_CARTAO",
    "last": "4_ULTIMOS_DIGITOS_CARTAO",
    "exp": "DATA_VALIDADE_CARTAO", 
    "value": VALOR_COMPRA, //este é opcional durante a PoC, e podem passar 0
    "name": "NOME_TITULAR_CARTAO"
  }
}
```

O retorno será o status e o ID da validação biométrica. Isso quer dizer que os dados foram recebidos e a foto é boa para seguirmos o fluxo. Se receber false, o próprio capture.html já irá tratar o retorno, sendo necessário só repassar este response para o front:

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

Nesse momento todos os dados serão processados e nós iremos retornar para nossos clientes a resposta sobre a transação (se devem aprovar ou recusar). Existe duas opções para isso, sendo uma delas o nosso cliente desenvolver um Get onde ficará perguntando sobre a transação (usando o id retornado lá no começo) e quando ela estiver pronta receberá um status final, ou então o cliente pode configurar um webhook para receber a resposta de forma automática.

Também é possível compartilhar um link, caso o real dono do cartão não esteja presente:

**API Request**

```
POST /transaction/link
Accept: application/json
Content-Type: application/json
Authorization: "AUTH_TOKEN_JWT"
APIKEY: "API_KEY"
```

```json
{
  "transactional_id": "ID_DA_TRANSACAO",
  "card": {
    "first": "6_PRIMEIROS_DIGITOS_CARTAO",
    "last": "4_ULTIMOS_DIGITOS_CARTAO",
    "exp": "DATA_VALIDADE_CARTAO", 
    "value": VALOR_COMPRA, //este é opcional durante a PoC, e podem passar 0
    "name": "NOME_TITULAR_CARTAO"
  }
}
```

O retorno será o status, ID da validação biométrica e o link que será compartilhado. Isso quer dizer que os dados foram recebidos e o link está disponível para ser compartilhado:

**API Response**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "Status": true,
  "Id": "b50ee24c-71eb-4a5d-ade1-41c48b44c240",
  "Link:": "https://aces.so/example"
}
```


Para mais detalhes da documentação da API, [clique aqui.](https://www4.acesso.io/transacional/services/transactional/docs/)

<hr>

## Resumo

- O usuário acessa a aplicação;
- Através de nosso SDK, a aplicação solicita o frame para captura;
- A aplicação renderiza nosso frame para captura em um placeholder pré estabelecido;
- Aplicação dos nossos clientes captura a imagem (de forma automática, manual ou com o liveness com interação), gerando um token JWT;
- A aplicação repassa o JWT para o servidor dos nossos clientes;
- O servidor dos nossos clientes interage com as nossas APIs para validar a imagens;
- Nossos servidores retornam a resposta da validação biométrica, que é repassada para a aplicação de nossos clientes;
- Por fim, nossos clientes podem fazer um get para saber o resultado final da transação, ou podem configurar um webhook para receber essa resposta;

<img src="https://user-images.githubusercontent.com/1706703/173040789-8df30c0d-4bcc-4d1a-8ce7-a74cb08f6476.png">
