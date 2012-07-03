var max = max || {};

/**
 * @fileoverview Provides literals in several languages
  */


max.literals = function(language) {

    var maxui = {}
    maxui['en'] = {'new_activity_text': 'Write something...',
                       'new_activity_post': "Post activity",
                       'toggle_comments': "comments",
                       'new_comment_text': "Comment something...",
                       'new_comment_post': "Post comment",
                       'load_more': "Load more",
                       'context_published_in': "Published in",
                       'generator_via': "via",
                       'search_text': "Search..."
        }

    maxui['es'] = {'new_activity_text': 'Escribe algo...',
                       'new_activity_post': "Publica",
                       'toggle_comments': "comentarios",
                       'new_comment_text': "Comenta algo...",
                       'new_comment_post': "Comenta",
                       'load_more': "Cargar más",
                       'context_published_in': "Publicado en",
                       'generator_via': "via",
                       'search_text': "Busca..."
        }

    maxui['ca'] = {'new_activity_text': 'Escriu alguna cosa...',
                       'new_activity_post': "Publica",
                       'toggle_comments': "comentaris",
                       'new_comment_text': "Comenta alguna cosa...",
                       'new_comment_post': "Comenta",
                       'load_more': "Carrega'n més",
                       'context_published_in': "Publicat a",
                       'generator_via': "via",
                       'search_text': "Busca..."
        }

    return maxui[language]
}