'use strict';

(function($) {

    /**
     * Initializes a given host Instagram post jQuery element.
     * @param {any} resultJson The result JSON object.
     * @param {jQuery} $socialResult The generic social result container jQuery element.
     * @param {SocialLoadTracker} socialLoadTracker Tracks the load status of the containing social feed.
     * @return {jQuery} The initialized jQuery Instagram post element.
     */
    $.fn.initInstagramPost = function(resultJson, $socialResult, socialLoadTracker) {
        var $post = this;
        if (!resultJson.metaData.html) {
            throw new Error(resultJson.collection + ' result is missing (oEmbed template) "html" metadata.');
        }

        $socialResult.html(resultJson.metaData.html);
        socialLoadTracker.listenForLoad($socialResult);
        return $post;
    }

})(jQuery);
