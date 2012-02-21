/*
* Invokes maxui when page is ready
* calling trough jQuery ready is only for development purses
* use snippet in example.js for production environments
*/

$().ready(function() {

    var settings = {
           'newActivityText' : 'Escriu alguna cosa ...',
           'username' : 'carles.bruguera',
           'oAuthToken' : 'acba0f28179cfc405b8bc9faa9796843',
           'oAuthGrantType' : 'password',
           'maxServerURL' : 'http://localhost:8081',
           'avatarURLpattern' : 'http://foo.com/{0}/bar'
           }

    $('#container').maxUI(settings)
})