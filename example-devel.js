/*
* Invokes maxui when page is ready
* calling trough jQuery ready is only for development purses
* use snippet in example.js for production environments
*/

$().ready(function() {

    settings = {
           'newActivityText' : 'Escriu alguna cosa ...',
           'username' : 'carles.bruguera',
           'oAuthToken' : '36cc5b5f390b5d256f73a692eed3fb79',
           'oAuthGrantType' : 'password',
           'maxServerURL' : 'http://localhost:8081'
           }

    $('#container').maxUI(settings)
})