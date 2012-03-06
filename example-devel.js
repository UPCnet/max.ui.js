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
           'username' : '',
           'oAuthToken' : '',
           'oAuthGrantType' : 'password',
           'maxServerURL' : 'http://max.beta.upcnet.es',
           'maxServerURLAlias' : '',
           'avatarURLpattern' : '',
           'contextFilter': [],
           'activitySource': 'activities'
           }
    //gadgets.io.setProxyURL(settings.maxServerURL+'/makeRequest')

    jQuery('#container').maxUI(settings)
})