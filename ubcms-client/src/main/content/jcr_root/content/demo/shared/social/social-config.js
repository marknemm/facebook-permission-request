// Contains social config processing functionality, which is placed within the 'tlwSocialConfig' namespace.
'use strict';

(function($, tlwSocialConfig) {

    /**
     * Fills in missing config values for a given config.
     * @param config The config to fill in missing values for.
     * @return A copy of the input config with its missing values filled with defaults.
     */
    tlwSocialConfig.fillMissingConfigs = function(config) {
        config = config ? config : {}; // Make sure we don't fail on a null/undefined config.
        var configCopy = $.extend({}, config); // Shallow copy so we don't internally modify the input config.
        configCopy.apiHost = config.apiHost ? config.apiHost.replace(/\/$/, '') : 'https://search.buffalo.edu';
        configCopy.clive = config.clive ? config.clive : '';
        configCopy.collection = config.collection ? config.collection : 'meta-social';
        configCopy.maxHeight = config.maxHeight;
        configCopy.mobileMaxHeight = config.mobileMaxHeight ? config.mobileMaxHeight : configCopy.maxHeight;
        configCopy.numRanks = config.numRanks ? config.numRanks : 10;
        configCopy.mobileNumRanks = config.mobileNumRanks ? config.mobileNumRanks : configCopy.numRanks;
        configCopy.profile = config.profile ? config.profile : '_default';
        configCopy.query = encodeURIComponent(config.query ? config.query : '!showall');
        configCopy.sort = config.sort ? config.sort : 'date';
        configCopy.slimTweets = config.slimTweets ? config.slimTweets : false;
        configCopy.startRank = config.startRank ? config.startRank : 0;
        return configCopy;
    }

    /**
     * Generates a social search URL using a given config. This URL may be used to query the Funnelback server.
     * @param config The config from which to generate the URL.
     * @return The generated social search URL.
     */
    tlwSocialConfig.genSocialSearchUrl = function(config) {
        var numRanks = ($(window).width() <= 720)
            ? config.mobileNumRanks
            : config.numRanks;
        return config.apiHost + '/s/search.json'
            + '?clive=' + config.clive
            + '&collection=' + config.collection
            + '&num_ranks=' + numRanks
            + '&profile=' + config.profile
            + '&query=' + config.query
            + '&sort=' + config.sort
            + '&start_rank=' + config.startRank;
    }

    window.tlwSocialConfig = tlwSocialConfig;

})(jQuery, window.tlwSocialConfig ? window.tlwSocialConfig : {});
