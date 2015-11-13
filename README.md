Módulo API para autenticação
======================
Este módulo é responsável por fazer a autenticação com usuário e senha, registro de usuário com envio de senha por email e resgate de senha por e-mail.

 * ```/registration``` - Formulário para registro de usuário
 * ```/oauth/authorization``` - Formulário de login de usuário
 * ```/oauth/decision``` - Diálogo de aprovação do uso dos seus dados pelo Site
 * ```/client/registration``` - Cadastro de novos clientes que poderão requisitar de dados
 * ```/token``` - Retorna token válido se dados da requisição estiverem corretos

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
