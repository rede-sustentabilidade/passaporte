[![Build Status](http://ci.redesustentabilidade.org.br/api/badges/rede-sustentabilidade/passaporte/status.svg)](http://ci.redesustentabilidade.org.br/rede-sustentabilidade/passaporte)

Módulo API para autenticação
======================
Este módulo é responsável por fazer a autenticação com usuário e senha, registro de usuário com envio de senha por email e resgate de senha por e-mail. Além das funções para o usuário final, existe um endpoint disponível para gerar token jwt utilizado para 

Essas urls são utilizando no frontend para interação com usuário final:

 * ```/registration``` - Formulário para registro de usuário
 * ```/client/registration``` - Cadastro de novos clientes que poderão requisitar de dados
 * ```/lost_password``` - Formulário para resgatar senha por e-mail
 * ```/change_password``` - Formulário para trocar senha se sabe senha atual
 * ```GET /dialog/authorize``` - Formulário de login de usuário ( url que deve ser enviado o usuário ) os paramentros que devem ser enviados aqui são: state=VHa0gxGFi8dZ2xK364p3hLMVoA8f7fz0 - response_type=code - approval_prompt=auto - client_id=xxxx - redirect_uri=https%3A%2F%2Fredesustentabilidade.org.br%2F
 * ```/dialog/authorize/decision``` - Diálogo de aprovação do uso dos seus dados pelo Site
 * ```/oauth/token``` - Retorna token válido se dados da requisição estiverem corretos
 
As urls abaixo são acessadas a partir do client e devem enviar no cabeçalho a chave "Authorization" com o valor "Baurer valor_da_chave_access_token"

 * ```GET /api/userinfo``` - Based on JWT Token return user info
 * ```GET /api/clientinfo``` - Based on JWT Token retrun client info
 * ```GET /api/tokeninfo``` - Based on Access Token return from passaporte return if token is valid

Baseado em : https://github.com/reneweb/oauth2orize_implicit_example

Dependências
----------------

 - Gulp
 - Lab
 - Babel

Configurações
-----
Clone o repositório e instale as dependências.

    $ git clone https://github.com/rede-sustentabilidade/authorization-hub.git
    $ cd authorization-hub
    $ npm install
    $ npm start

Empacotamento para produção
------
Se você quer empacotar o projeto execute o comando.

    $ gulp build

Uma pasta chamada dist irá aparecer e todo o código fonte estará "transpiled" para javascript.

Testando
---------
Existem duas opções para rodar os testes, a primeira é voltada para o processo de desenvolvimento e para praticar TDD.

    $ gulp tdd

A outra opção serve apenas para rodar os testes de uma vez.

    $ gulp test
