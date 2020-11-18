package edu.buffalo.funnelback.socialfacebook.config

import com.funnelback.config.types.ConfigPasswordUnencrypted
import com.funnelback.common.config.NoOptionsConfig
import edu.buffalo.funnelback.util.ConfigUtil
import groovy.util.logging.Log4j2

/**
 * Facilitates reading social-facebook collection configuration, which configures our crawler.
 * Directly used by FacebookGather.groovy & GetOembedTemplates.groovy.
 */
@Log4j2
class FacebookConfig extends NoOptionsConfig {

  /** Name of the collection config parameter holding the Facebook API URL */
  static final FACEBOOK_API_URL_CONFIG = "facebook.api-url"

  /** Name of the collection config parameter holding the Facebook App ID */
  static final FACEBOOK_APP_ID_CONFIG = "facebook.app-id"

  /** Name of the collection config parameter holding the Facebook App Secret */
  static final FACEBOOK_APP_SECRET_CONFIG = "facebook.app-secret"

  /** Name of the collection config parameter holding the event (start) date field */
  static final FACEBOOK_EVENT_DATE_FIELD_CONFIG = "facebook.event-date-field"

  /** Name of the collection config parameter holding the list of event fields to query */
  static final FACEBOOK_EVENT_FIELDS_CONFIG = "facebook.event-fields"

  /** Name of the collection config parameter holding the list of tokens */
  static final FACEBOOK_PAGE_ACCESS_TOKENS_CONFIG= "facebook.page-access-tokens"

  /** Name of the collection config parameter holding the URL that links to a feed item (also used as primary ID) */
  static final FACEBOOK_FEED_ITEM_URL_FIELD_CONFIG = "facebook.feed-item-url-field"

  /** Name of the collection config parameter holding the Facebook oembed API URL */
  static final FACEBOOK_OEMBED_API_CONFIG = "facebook.oembed-api"

  /** Name of the collection config parameter holding the maximum number of files to be stored per area during a crawl */
  static final MAX_FILES_PER_AREA_CONFIG= "crawler.max_files_per_area"

  /** Name of the collection config parameter holding the list of Facebook page IDs */
  static final FACEBOOK_PAGE_IDS_CONFIG= "facebook.page-ids"

  /** Name of the collection config parameter holding the post (create) date field */
  static final FACEBOOK_POST_DATE_FIELD_CONFIG = "facebook.post-date-field"

  /** Name of the collection config parameter holding the list of post fields to query */
  static final FACEBOOK_POST_FIELDS_CONFIG = "facebook.post-fields"

  /** Defaults for when collection.cfg does not have set values */
  static final DEFAULT_API_URL = "https://graph.facebook.com/v9.0"
  static final DEFAULT_EVENT_DATE_FIELD = "start_time"
  static final DEFAULT_FEED_ITEM_URL_FIELD = "permalink_url"
  static final DEFAULT_MAX_FILES_PER_AREA = 20
  static final DEFAULT_OEMBED_API_URL = "https://graph.facebook.com/v9.0/oembed_page"
  static final DEFAULT_POST_DATE_FIELD = "created_time"

  private String _apiUrl = null
  private String _appAccessToken = null
  private String _appId = null
  private String _appSecret = null
  private String _eventDateField = null
  private String _eventFields = null
  private String _feedItemUrlField = null
  private Integer _maxFilesPerArea = null
  private String _oembedApiUrl = null
  private List<String> _pageAccessTokens = null
  private List<String> _pageIds = null
  private String _postDateField = null
  private String _postFields = null

  FacebookConfig() {
    super(new File(ConfigUtil.getSearchHome()), "social-facebook")
  }

  FacebookConfig(File searchHomeDir, String collectionName) {
    super(searchHomeDir, collectionName)
  }

  /**
   * Gets the Facebook API URL used to crawl facebook page feeds.
   * @return A string containing the Facebook API URL.
   * @throws IllegalStateException when no API URL has been configured.
   */
  String getApiUrl() {
    if (!_apiUrl) {
      _apiUrl = value(FACEBOOK_API_URL_CONFIG, DEFAULT_API_URL)
    }
    return _apiUrl
  }

  /**
   * Gets the Facebook app access token (used for accessing oEmbed API).
   * @return The Facebook app access token.
   * @throws IllegalStateException when no app access token can be retrieved.
   */
  String getAppAccessToken() {
    if (!_appAccessToken) {
      _appAccessToken = "${appId}|${appSecret}"
    }
    return _appAccessToken
  }

  /**
   * Gets the Facebook app ID that is configured for the colleciton.
   * @return The Facebook app ID.
   * @throws IllegalStateException when no app ID can be found.
   */
  String getAppId() {
    if (!_appId) {
      _appId = value(FACEBOOK_APP_ID_CONFIG)
      if (!_appId) {
        throw new IllegalStateException("Missing required collection parameter ${FACEBOOK_APP_ID_CONFIG}")
      }
    }
    return _appId
  }

  /**
   * Gets the Facebook app secret that is configured for the colleciton.
   * @return The Facebook app secret.
   * @throws IllegalStateException when no app secret can be found.
   */
  String getAppSecret() {
    if (!_appSecret) {
      _appSecret = value(FACEBOOK_APP_SECRET_CONFIG)
      if (!_appSecret) {
        throw new IllegalStateException("Missing required collection parameter ${FACEBOOK_APP_SECRET_CONFIG}")
      }
      _appSecret = ConfigPasswordUnencrypted.newInstance(_appSecret).cleartextPassword
    }
    return _appSecret
  }

  /**
   * Gets the event's (start) date field.
   * @return A string containing the event's date field. Defaults to "start_time" if no config is set.
   */
  String getEventDateField() {
    if (!_eventDateField) {
      _eventDateField = value(FACEBOOK_EVENT_DATE_FIELD_CONFIG, DEFAULT_EVENT_DATE_FIELD)
    }
    return _eventDateField
  }

  /**
   * Gets the event fields used for crawling Facebook page events.
   * @return A string containing a comma separated list of event fields. If facebook.event-fields is not configured in colleciton.cfg, then null.
   */
  String getEventFields() {
    if (!_eventFields) {
      _eventFields = value(FACEBOOK_EVENT_FIELDS_CONFIG)
      if (_eventFields) {
        List<String> eventFieldsArr = _eventFields.tokenize(",")
        if (eventFieldsArr.indexOf("id") < 0) {
          _eventFields += ",id"
        }
      }
    }
    return _eventFields
  }

  /**
   * Gets the post/event field that contains the feed item URL. Defaults to "permalink_url" if not configured.
   * @return The name of the feed item URL field.
   */
  String getFeedItemUrlField() {
    if (!_feedItemUrlField) {
      _feedItemUrlField = value(FACEBOOK_FEED_ITEM_URL_FIELD_CONFIG, DEFAULT_FEED_ITEM_URL_FIELD)
    }
    return _feedItemUrlField
  }

  /**
   * Gets the maximum number of files to be stored per post/event feed while crawling Facebook pages.
   * @return The max number of files to be stored per area.
   */
  int getMaxFilesPerArea() {
    if (!_maxFilesPerArea) {
      _maxFilesPerArea = valueAsInt(MAX_FILES_PER_AREA_CONFIG, DEFAULT_MAX_FILES_PER_AREA)
    }
    return _maxFilesPerArea
  }

  /**
   * Gets the Facebook oEmbed Graph API URL.
   * Defaults to "https://graph.facebook.com/v9.0/oembed_page" if not configured.
   * @return The oEmbed API URL.
   */
  String getOembedApiUrl() {
    if (!_oembedApiUrl) {
      _oembedApiUrl = value(FACEBOOK_OEMBED_API_CONFIG, DEFAULT_OEMBED_API_URL)
    }
    return _oembedApiUrl
  }

  /**
   * Gets page access tokens for each page that should be crawled.
   * If no page access token is configured, then defaults to the app access token.
   * @return A list of the page access tokens.
   * @throws IllegalStateException when no page access tokens can be found.
   */
  List<String> getPageAccessTokens() {
    if (!_pageAccessTokens) {
      String pageAccessTokensStr = value(FACEBOOK_PAGE_ACCESS_TOKENS_CONFIG)
      pageAccessTokensStr = (!pageAccessTokensStr)
        ? appAccessToken
        : ConfigPasswordUnencrypted.newInstance(pageAccessTokensStr).cleartextPassword
      _pageAccessTokens = pageAccessTokensStr.tokenize(",")
    }
    return _pageAccessTokens
  }

  /**
   * Gets the IDs of pages that should be crawled from the facebook.page-ids collection.cfg setting.
   * @return A list of the page IDs.
   * @throws IllegalStateException when no page IDs have been configured.
   */
  List<String> getPageIds() {
    if (!_pageIds) {
      String pageIdsStr = value(FACEBOOK_PAGE_IDS_CONFIG)
      if (!pageIdsStr) {
        throw new IllegalStateException("Missing required collection parameter ${FACEBOOK_PAGE_IDS_CONFIG}")
      }
      _pageIds = pageIdsStr.tokenize(",")
    }
    return _pageIds
  }

  /**
   * Gets the post's (create) date field.
   * @return A string containing the post's date field. Defaults to "created_time" if no config is set.
   */
  String getPostDateField() {
    if (!_postDateField) {
      _postDateField = value(FACEBOOK_POST_DATE_FIELD_CONFIG, DEFAULT_POST_DATE_FIELD)
    }
    return _postDateField
  }

  /**
   * Gets the post fields used for crawling Facebook page posts.
   * @return A string containing a comma separated list of post fields. If facebook.post-fields is not configured in colleciton.cfg, then null.
   */
  String getPostFields() {
    if (!_postFields) {
      _postFields = value(FACEBOOK_POST_FIELDS_CONFIG)
      if (_postFields) {
        List<String> postFieldsArr = _postFields.tokenize(",")
        if (postFieldsArr.indexOf("id") < 0) {
          _postFields += ",id"
        }
        if (postFieldsArr.indexOf(feedItemUrlField) < 0) {
          _postFields += ",${feedItemUrlField}"
        }
      }
    }
    return _postFields
  }
}
