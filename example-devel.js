/*
* Invokes maxui when page is ready
* calling trough jQuery ready is only for development purses
* use snippet in example.js for production environments
*/

$().ready(function() {

    settings = {
           'newActivityText' : 'Escriu alguna cosa ...',
           'username' : 'carles',
           'token' : 'oauth_token'
           }

    $('#container').maxUI(settings)
})