'use strict';

(function($) {

    /**
     * Initializes a given host Facebook post jQuery element. If the Facebook oEmbed script has not completely loaded, then inits after load.
     * @param {any} resultJson The result JSON object.
     * @param {jQuery} $socialResult The generic social result container jQuery element.
     * @param {SocialLoadTracker} socialLoadTracker Tracks the load status of the containing social feed.
     * @return {jQuery} The initialized jQuery Facebook post element.
     */
    $.fn.initFacebookPost = function(resultJson, $socialResult, socialLoadTracker) {
        var $post = this;
        if (!resultJson.metaData.html) {
            throw new Error(resultJson.collection + ' result is missing (oEmbed template) "html" metadata.');
        }

        $socialResult.html(resultJson.metaData.html);
        socialLoadTracker.listenForLoad($socialResult); // Listen for Facebook oEmbed script to change raw blockquote into iframe.

        // Force each Facebook post to load after oEmbed script is loaded.
        // A race condition can occur without this where the facebook oEmbed script loads and runs before the social feed loads from the Funnelback server.
        // When this happens, the Facebook oEmbed script will attempt to parse all results (and expects them to already be on the page).
        // If we are adding a raw Facebook oEmbed snippet to the page, and we determine that the FB parser has already run, then we must re-invoke it.
        if (window.FB && window.FB.XFBML && window.FB.XFBML.parse) {
            FB.XFBML.parse($socialResult.get(0));
        }

        return $post;
    }

})(jQuery);
