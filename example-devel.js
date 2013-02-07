/*
* Invokes maxui when page is ready
* calling trough jQuery ready is only for development purses
* use snippet in example.js for production environments
*/

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}

jQuery().ready(function() {

    literals_ca = {'new_activity_text': 'Escriu alguna cosa...',
                   'new_activity_post': "Envia l'activitat",
                   'toggle_comments': "Comentaris",
                   'new_comment_post': "Envia el comentari",
                   'load_more': "Carrega'n més"
                 }
    var username = getURLParameter('user')

    var settings = {
           'literals': literals_ca,
           'language': 'ca',
           'username' :  username=="null" ? 'carles.bruguera' : username,
           'oAuthToken' : 'eb0d4b6c2a44ac90db29d2bbb172cba1',
           'oAuthGrantType' : 'password',
           'maxServerURL' : 'http://localhost',
           'maxTalkURL' : 'http://sheldon.estacions.upcnet.es:6545/max',
           //'maxTalkURL' : 'http://sheldon.upc.es:6545/max',
           'maxServerURLAlias' : 'http://sheldon.upc.es/max',
//           'avatarURLpattern' : '',
           'profileURLpattern' : '#',
           'readContext': 'http://sheldon.upc.es',
           //'writeContexts': ['http://sheldon.upc.es'],
           'activitySource': 'timeline',
           'generatorName': 'SheldonApp',
           'UISection':'timeline',
//           'disableTimeline':true,
//           'disableConversations':true
           }

//  var settings = {
//  'newActivityText' : 'Escriu alguna cosa ...',
//                 'username' : 'francesc.bassas-bullich',
//                 'oAuthToken' : '0310fb63c9014aeb4f888eda768c1c86',
//                 'maxServerURL' : 'http://max.beta.upcnet.es',
//                 'maxServerURLAlias' : 'https://devel.upcnet.es/max',
//                 'avatarURLpattern' : 'https://devel.upcnet.es/clubs/avatar/{0}',
//                 'activitiesSource' : 'activities',
//                 'contextFilter' : ['hola'],
//                 'activitySource': 'activities'
// }
    //gadgets.io.setProxyURL(settings.maxServerURL+'/makeRequest')


  settings['username']

    jQuery('#container').maxUI(settings)
})
