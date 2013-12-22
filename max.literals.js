var max = max || {};

/**
 * @fileoverview Provides literals in several languages
  */


max.literals = function(language) {

    var maxui = {}
    maxui['en'] = {'new_activity_text': 'Write something...',
                       'activity': 'activity',
                       'conversations': 'private conversations',
                       'conversations_list': 'conversations list',
                       'participants': 'Talk to',
                       'search_people': "Write somebody's name...",
                       'conversation_name': 'Conversation name',
                       'message': 'Message',
                       'no_conversations': 'No conversations already',
                       'new_conversation_text': 'Add participants and send a message to start a conversation',
                       'new_activity_post': "Post activity",
                       'toggle_comments': "comments",
                       'new_comment_text': "Comment something...",
                       'new_comment_post': "Post comment",
                       'load_more': "Load more",
                       'context_published_in': "Published in",
                       'generator_via': "via",
                       'search_text': "Search...",
                       'and_more': "and more...",
                       'new_message_post': "Send message",
                       'post_permission_unauthorized': "You''re not authorized to post on this context",
                       'post_permission_not_here': "You're not mentioning @anyone",
                       'post_permission_not_enough_participants': "You have to add participants",
                       'post_permission_missing_displayName': "You have to name the conversation",
                       'delete_activity_confirmation': "Are you sure?",
                       'delete_activity_delete': "Delete",
                       'delete_activity_cancel': "Cancel",
                       'delete_activity_icon': "delete",
                       'favorite': 'Favorite',
                       'like': 'Like'
        }

    maxui['es'] = {'new_activity_text': 'Escribe algo...',
                       'activity': 'actividad',
                       'conversations': 'conversaciones privadas',
                       'conversations_list': 'lista de conversaciones',
                       'participants': 'Conversar con',
                       'search_people': 'Escribe el nombre de alguien...',
                       'conversation_name': 'Nombre de la conversación',
                       'message': 'Mensaje',
                       'no_conversations': 'No hay conversaciones',
                       'new_conversation_text': 'Añade participantes y envia el mensaje para iniciar una conversación',
                       'new_activity_post': "Publica",
                       'toggle_comments': "comentarios",
                       'new_comment_text': "Comenta algo...",
                       'new_comment_post': "Comenta",
                       'load_more': "Cargar más",
                       'context_published_in': "Publicado en",
                       'generator_via': "via",
                       'search_text': "Busca...",
                       'and_more': "i más...",
                       'new_message_post':'Envia el mensaje',
                       'post_permission_unauthorized': 'No estas autorizado a publicar en este contexto',
                       'post_permission_not_here': "No estas citando a @nadie",
                       'post_permission_not_enough_participants': "Tienes que añadir participantes",
                       'post_permission_missing_displayName': "Tienes que dar un nombre a la conversación",
                       'delete_activity_confirmation': "Estás seguro?",
                       'delete_activity_delete': "Borrar",
                       'delete_activity_cancel': "Cancelar",
                       'delete_activity_icon': "borrar",
                       'favorite': 'favorito',
                       'like': 'me gusta'
        }

    maxui['ca'] = {'new_activity_text': 'Escriu alguna cosa...',
                       'activity': 'activitat',
                       'conversations': 'converses privades',
                       'conversations_list': 'llista de converses',
                       'participants': 'Conversa amb',
                       'search_people': "Escriu el nom d''algú...",
                       'conversation_name': 'Nom de la conversa',
                       'message': 'Missatge',
                       'no_conversations': 'No hi ha converses',
                       'new_conversation_text': 'Afegeix participants i envia el missatge per iniciar una conversa',
                       'new_activity_post': "Publica",
                       'toggle_comments': "comentaris",
                       'new_comment_text': "Comenta alguna cosa...",
                       'new_comment_post': "Comenta",
                       'load_more': "Carrega'n més",
                       'context_published_in': "Publicat a",
                       'generator_via': "via",
                       'search_text': "Busca...",
                       'and_more': "i més...",
                       'new_message_post':'Envia el missatge',
                       'post_permission_unauthorized': 'No estàs autoritzat a publicar en aquest contexte',
                       'post_permission_not_here': "No estas citant a @ningú",
                       'post_permission_not_enough_participants': "Has d'afegir participants",
                       'post_permission_missing_displayName': "Tens que posar nom a la conversa",
                       'delete_activity_confirmation': "Estàs segur?",
                       'delete_activity_delete': "Esborra",
                       'delete_activity_cancel': "No ho toquis!",
                       'delete_activity_icon': "esborra",
                       'favorite': 'favorit',
                       'like': "m'agrada"

        }

    return maxui[language]
}
