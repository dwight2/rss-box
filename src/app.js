(function() {

  'use strict';

  require('../node_modules/jquery-minicolors/jquery.minicolors.css');
  require('./app.css');

  var $ = window.jQuery = require('jquery');
  require('jquery-minicolors');

  var Modernizr = require('../.modernizrrc');
  var settings = require('./settings');

  var BASE_URI = settings.baseUri;
  var FERRIS_URI = settings.ferrisUri;

  $(function() {

    var url, parts = location.href.split('?');
    if (parts.length > 1) {
      parts = parts[1].split('=');
      if (parts[0] === 'url') {
        url = decodeURIComponent(parts[1]);
      }
    }

    load({ // Load a first RSS Box with default settings.
      url: url || 'http://blog.p3k.org/stories.xml',
      maxItems: 7,
      width: 200,
      height: -1,
      radius: 5,
      align: null,
      frameColor: '#B3A28E',
      titleBarColor: '#90A8B3',
      titleBarTextColor: '#FFEAD2',
      boxFillColor: '#FFEAD2',
      textColor: '#95412B',
      linkColor: '#2C7395',
      showXmlButton: true,
      compact: false,
      headless: false,
      fontFace: '10pt sans-serif'
    });

    // Set up handlers of interface elements.

    $('input').change(updater);

    $('form').submit(function(event) {
      event.preventDefault();
      updater();
    });

    $('.autoselect').click(function() {
      $(this).select();
    });

    $('.toggler a').click(function(event) {
      event.preventDefault();
      $(this).parents('.toggler').next('.togglee').toggle();
    }).click();

    $('#descriptionToggler').click(function(event) {
      event.preventDefault();
      $(this).hide();
      $('#description').show();
    });

    $('input.color').minicolors({
      change: function(hex, rgb) {
        updater();
      }
    });

    // Set up referrers.
    $('#referrers').hide();
    $('#referrersToggle').click(function(event) {
      event.preventDefault();
      $.getJSON(FERRIS_URI, function(data) {
        if (data.error) {
          var error = $('<div>')
            .attr('title', 'Error ' + data.status + ': ' + data.error)
            .html('currently unavailable.');
          $('#referrers').html(error).show();
          $('#referrersToggle').hide();
          return;
        }
        var cache = {};
        var result = '';
        $.each(data, function(index, item) {
          if (this.url.indexOf('http') !== 0 || this.url.indexOf(BASE_URI) === 0) {
            return;
          }
          var href = this.url.replace(/^([^.]*)www\./, '$1');
          var host = href.split('/')[2];
          if (cache[host]) {
            return;
          }
          cache[host] = true;
          result += '<a href="' + href + '">' + host + '<' + '/a><br />';
        });
        $('#referrers').html(result).show();
        $('#referrersToggle').hide();
      });
    });

    // Capture clicks on links to XML files and display these as RSS box.
    $('a[href$="\\\.xml"]').click(function(event) {
      event.preventDefault();
      $('#url').val($(this).attr('href'));
      updater();
    });

    function updater(event) {
      var inputs = $('input');
      for (var input, i = 0; i < inputs.length; i += 1) {
        input = inputs.get(i);
        if (input.validity && !input.validity.valid) {
          return;
        }
      }
      var config = getConfig();
      if (!window.rss || config.url !== window.rss.config.url) {
        load(config);
        return;
      }
      window.rss.renderBox(window.rss.data, config, function(box) {
        $('#preview').html(box);
        update(window.rss.data, config);
      });
    }

    function load(config) {
      var query = getQuery(config);
      $('#reload').attr('disabled', true).css('color', 'gray');
      $('#source').text('Loading...').css('color', 'green');

      window.rss = null;
      window._rss_box_framework_has_loaded = null; // FIXME: This is only a hack.

      var script = document.createElement('script');
      script.src = BASE_URI + '/main.js?setup=true&' + query;
      script.type = 'text/javascript';
      $('#preview').empty().get(0).appendChild(script);

      var scheduler = setInterval(function() {
        if (typeof jQuery !== 'undefined') {
          if (window.rss) {
            clearTimeout(scheduler);
            update(window.rss.data, window.rss.config);
            if (window.rss.data.error) {
              $('#source a').css('color', 'red');
              $('#code textarea').attr('disabled', true);
            } else {
              $('#code textarea').attr('disabled', false);
            }
            $('#reload').css('color', 'green').attr('disabled', false);
          }
        }
      }, 10);
    }

    function update(rss, config) {
      $('#preview').css('width', config.width);

      $('#url').val(config.url);
      $('#source').html('<a href="' + config.url + '">' +
        rss.format + ' ' + rss.version + '</a>');
      $('#title').text(rss.title);
      $('#description').text(rss.description).hide();
      $('#descriptionToggler').show();
      $('#date').text($('.rssbox-date').text());
      $('#format').text(rss.format + ' ' + rss.version);

      $('#maxItems').val(config.maxItems);
      $('#width').val(config.width);
      $('#height').val(config.height);
      $('#radius').val(config.radius);
      $('#align').val(config.align || 'default');
      $('#compact').prop('checked', !!config.compact);
      $('#showXmlButton').prop('checked', !!config.showXmlButton);
      $('#headless').prop('checked', !!config.headless);
      $('#fontFace').val(config.fontFace);

      $('#frameColor').minicolors('value', config.frameColor);
      $('#titleBarColor').minicolors('value', config.titleBarColor);
      $('#titleBarTextColor').minicolors('value', config.titleBarTextColor);
      $('#boxFillColor').minicolors('value', config.boxFillColor);
      $('#textColor').minicolors('value', config.textColor);
      $('#linkColor').minicolors('value', config.linkColor);

      $('#code textarea').val('<script type="text/javascript" src="' +
        BASE_URI + '/main.js?' + getQuery(config).replace(/&/g, '&amp;') + '"></script>');

      // Dis-/enable controls depending on other settings
      $('#showXmlButton').attr({disabled: config.headless});
      $('#frameColor').attr({disabled: config.headless});
      $('#titleBarColor').attr({disabled: config.headless});
      $('#titleBarTextColor').attr({disabled: config.headless});
      $('#textColor').attr({disabled: config.compact});
      $('#radius').attr({disabled: !Modernizr.borderradius});
      return;
    }

    function getConfig() {
      var config = {};
      var keys = ['url', 'maxItems', 'width', 'height', 'radius', 'align', 'frameColor',
        'titleBarColor', 'titleBarTextColor', 'boxFillColor', 'textColor', 'linkColor', 'fontFace'];
      for (var i=0; i<keys.length; i+=1) {
        var key = keys[i];
        config[key] = $('#' + key).val();
      }
      config.id = $('#preview .rssbox').attr('id');
      config.compact = $('#compact').prop('checked') && true;
      config.showXmlButton = $('#showXmlButton').prop('checked') && true;
      config.headless = $('#headless').prop('checked') && true;
      return config;
    }

    function getQuery(config) {
      if (!config) {
        return '';
      }
      var query = new Array;
      for (var key in config) {
        var value = config[key];
        if (key === 'setup' || !value) {
          continue;
        }
        query.push(key + '=' + encodeURIComponent(value));
      }
      return query.join('&');
    }

  });
})();
