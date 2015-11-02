Módulo API para autenticação
======================
Contém endpoints com informações sobre o perfil do usuário e autenticação utilizando passaporte #rede

Baseado em : https://github.com/reneweb/oauth2orize_implicit_example

Dependências
----------------

 - Hapi.js
 - gulp
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
