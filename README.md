# Facebook Permission Request

The contained source code is a sample of what we use within our production environment.

## funnelback-server

This contains our back-end code that directly communicates with the Facebook Graph API and indexes post & oEmbed data. Feel free to browse the code.

We emphasize the comments at the top of each Groovy script; they provide a brief overview of the function of each script.

The following 2 files primarily drive the crawling process:

- **[FacebookGather.groovy](https://github.com/marknemm/facebook-permission-request/blob/main/funnelback-server/src/main/groovy/edu/buffalo/funnelback/socialfacebook/gather/FacebookGather.groovy)**: Gathers posts via the Facebook Graph API endpoint https://graph.facebook.com/v9.0/8447447859/posts

- **[GetOembedTemplates.groovy](https://github.com/marknemm/facebook-permission-request/blob/main/funnelback-server/src/main/groovy/edu/buffalo/funnelback/socialfacebook/filter/GetOembedTemplates.groovy)**: Gets an oEmbed template for each gathered post via the Facebook Graph API endpoint: https://graph.facebook.com/v9.0/oembed_post

## ubcms-client

This contains our front-end code that queries our Funnelback search server. Feel free to browse the code, which mainly consists of jQuery plugins.

The jQuery plugins are used to place an aggregated social media feed (potentially including a mixture of Facebook, Instagram, & Twitter posts) on various parts of a page.

The main entry point for the plugin is in the **[social.js](https://github.com/marknemm/facebook-permission-request/blob/main/ubcms-client/src/main/content/jcr_root/content/demo/shared/social/social.js)** file. Our Funnelback search server can be queried via the following URL, which is built in **[social-config.js](https://github.com/marknemm/facebook-permission-request/blob/main/ubcms-client/src/main/content/jcr_root/content/demo/shared/social/social-config.js)**: https://search.buffalo.edu/s/search.json?collection=social-facebook&num_ranks=10&profile=_default&query=!showall
