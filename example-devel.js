/*
* Invokes maxui when page is ready
* calling trough jQuery ready is only for development purses
* use snippet in example.js for production environments
*/

$().ready(function() {

    var settings = {
           'newActivityText' : 'Escriu alguna cosa ...',
           'username' : 'carles.bruguera',
           'oAuthToken' : '4a99904b2b79ec903cca905d3dfa582a',
           'oAuthGrantType' : 'password',
           'maxServerURL' : 'http://localhost:8081',
           'avatarURLpattern' : 'http://localhost:8080/clubs/avatar/{0}',
           'contextFilter': ['http://localhost:8080/clubs'],
           'activitySource': 'activities'
           }

    $('#container').maxUI(settings)
})