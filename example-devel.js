/*
* Invokes maxui when page is ready
* calling trough jQuery ready is only for development purses
* use snippet in example.js for production environments
*/
jQuery().ready(function() {

    literals_ca = {'new_activity_text': 'Escriu alguna cosa ...',
                   'new_activity_post': "Envia l'activitat",
                   'toggle_comments': "Comentaris",
                   'new_comment_post': "Envia el comentari",
                   'load_more': "Carrega'n més"
                 }


    var settings = {
           'literals': literals_ca,
           'username' : 'janet.dura@upcnet.es',
           'oAuthToken' : '4d53575d0d9582839c510b3302ac1f2c',
           'oAuthGrantType' : 'alumni',
           'maxServerURL' : 'http://localhost:8081',
           'maxServerURLAlias' : 'http://sheldon.upc.es/max',
           'avatarURLpattern' : 'https://devel.upcnet.es/clubs/avatar/{0}',
           'contextFilter': ['http://sheldon:8080/club'],
           'activitySource': 'activities'
           }
    //gadgets.io.setProxyURL(settings.maxServerURL+'/makeRequest')

    jQuery('#container').maxUI(settings)
})