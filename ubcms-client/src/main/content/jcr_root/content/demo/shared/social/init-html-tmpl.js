'use strict';

(function($) {

    /**
     * Initializes a given host HTML template.
     * @param {HtmlTmplAction} initAction The action to take with the newly initalized template. Default is InitAction.None for no action.
     * See the definition of InitAction es5 enum below for details.
     * @param {string} target The optional target of the initAction.
     * @return The jQuery element resulting from HTML template initialization.
     */
    $.fn.initHtmlTmpl = function(initAction, target) {
        var $initResult = this.first().children().clone();
        switch (initAction) {
            case HtmlTmplAction.Append:
                var $target = target ? $(target) : this.parent();
                $target.append($initResult);
                break;
            case HtmlTmplAction.Replace:
                var $target = target ? $(target) : this;
                $target.replaceWith($initResult);
                break;
            default: // HtmlTmplAction.None
        }
        return $initResult;
    }

    /**
     * Set of possible actions that can be taken with a newly initialized HTML template.
     */
    window.HtmlTmplAction = {
        /** The default, no action occurs. */
        None: 'None',
        /** By default, appends the newly initialized HTML template instance after its siblings. */
        Append: 'Append',
        /** By default, replaces the HTML template with its newly initialized instance */
        Replace: 'Replace'
    };

})(jQuery);
