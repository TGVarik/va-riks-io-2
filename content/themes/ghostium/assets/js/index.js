





(function ($, window, document, undefined) {

  'use strict';

  var Drawer = (function ($, Mzr) {

    var transEndEventNames = {
      'WebkitTransition' : 'webkitTransitionEnd',
      'MozTransition'    : 'transitionend',
      'OTransition'      : 'oTransitionEnd otransitionend',
      'transition'       : 'transitionend'
    },
    transEndEventName = transEndEventNames[Mzr.prefixed('transition')];

    var _body = $('body'),
    _container = $('#container'),
    _overlay = $('.drawer-overlay');

    var module = {
      open: function() {
        _body.addClass('drawer-open drawer-transition');
      },
      close: function() {
        _body.removeClass('drawer-open');
      },
      isOpen: function() {
        return _body.hasClass('drawer-open');
      },
      bindOverlay: function() {
        _overlay.on('click', function(e) {
          e.preventDefault();

          if(_body.hasClass('drawer-open')) {
            module.close();
          }
        });
      },
      bindAnchors: function() {
        $('.drawer-list a').on('click', function(e) {
          module.close();
        });
      },
      bindContainerTransEnd: function() {
        _container.on(transEndEventName, function(e) {
          if(!_body.hasClass('drawer-open')) {
            _body.removeClass('drawer-transition');
          }
        });
      },
      init: function() {
        module.bindOverlay();
        module.bindAnchors();
        module.bindContainerTransEnd();
      }
    };

    return {
      init: module.init,
      open: module.open,
      close: module.close,
      isOpen: module.isOpen
    };

  }($, window.Modernizr));

  var ImageLoader = (function ($) {

    var _body = $('body'),
    _container = $('#container'),
    _overlay = $('.drawer-overlay');

    var module = {
      done: function(e) {
        e.addClass('image-loaded');
      },
      success: function(e, image) {
        e.css('background-image', 'url(' + image.src + ')');
        module.done(e);
      },
      init: function($el) {
        var image = new Image(),
        src = $el.data('load-image');

        if(src.length) {
          image.src = src;
          image.onload = module.success($el, image);
          image.onerror = module.done($el);
          image.onabort = module.done($el);
        }

        return image;
      }
    };

    return { load: module.init };

  }($));

  var ReadTime = (function ($) {

    'use strict';

    var module = {
      init: function() {
        $('.post').each(function() {
          var $readingTimeTarget = $('<span/>', {
            'class': 'post-meta-bar-item post-meta-bar-item-reading-time'
          });

          $(this)
          .find('.post-meta-bar__side--right')
          .append($readingTimeTarget)
          .end()

          .readingTime({
            readingTimeTarget: $readingTimeTarget
          })
          ;
        });

        $('.post-item').each(function() {
          var $readingTimeTarget = $('<span/>');

          $(this)
          .find('.post-item-meta-item-comments')
          .before(
          ' ',
          $('<li/>', {'class': 'post-item-meta-item post-item-meta-item-reading-time'}).append(
          $('<i/>', {'class': 'fa fa-book'}), ' ', $readingTimeTarget, ' ', 'read'
          ),
          ' '
          )
          .end()

          .readingTime({
            readingTimeTarget: $readingTimeTarget,
            remotePath: $(this).find('.post-item-title a').attr('href'),
            remoteTarget: '.post'
          })
          ;
        });
      }
    };

    return { init: module.init };

  }($));

  $(function() {
    var $window = $(window);
    var $document = $(document);
    var $body = $(document.body);
    var $head = $('head');
    var $surface = $body;
    var $content = $('.content', $surface);

    Drawer.init();
    ReadTime.init();

    var _articleImageHandler = function() {
      $('.post').each(function() {
        var $post = $(this);
        var $postHeader = $post.find('.post-header');
        $('.post-meta-bar').each(function() {
          $(this).find('time[datetime ^= ' + (new Date()).getFullYear() + '] span').addClass('js-hidden');
        });
        if (!Modernizr.touch) {
          $window.on('resize scroll', function() {
            var top = $window.scrollTop();
            if (top < 0 || top > 1500) {
              return;
            }
            $postHeader
            .css('transform', 'translateY(' + top / 10 + 'px)')
            .css('opacity', 1 - Math.max(top / 700, 0))
            .parent().css('background', 'rgba(0, 0, 0, ' + Math.max(top / 1400, 0) + ')')
            .end();
          });
        }
        $window.trigger('resize');
      });
    };
    _articleImageHandler();

    Prism.languages.html = Prism.languages.markup;
    var _prismHandler = function() {
      $('code').not('[class*="language-"]').addClass(function() {
        var _lang = ($(this).attr('class') || 'markup').replace(/(language|lang)+\-/gi, '');
        return 'language-' + (Prism.languages.hasOwnProperty(_lang) ? _lang : 'markup');
      });
      $('code.line-numbers').each(function(idx, el) {
        var $el = $(el);
        $el.text($el.text().replace(/&\s+|\s+$/g, ''));
        $el.removeClass('line-numbers');
        $el.parent('pre').addClass('line-numbers');
      });
      Prism.highlightAll();
    };
    _prismHandler();

    var _pentagonalHandler = function() {
      let coverImage = $('.cover-image');
      if (coverImage.length) {
        coverImage = coverImage[0];
        while (coverImage.firstChild) {
          coverImage.removeChild(coverImage.firstChild);
        }
        pentagonal(coverImage);
      }
    };
    _pentagonalHandler();

    // pjax goes here

    $document.on('pjax:start', function() {
      $surface.scrollTop(0);
    });

    $document.on('pjax:end', function() {
      _articleImageHandler();
      _prismHandler();
      _pentagonalHandler();
      $('[data-load-image]', $content).each(function() {
        ImageLoader.load($(this));
      });
      ReadTime.init();
      window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub]);
    });

    var _pjaxOptions = {
      container: '[data-pjax-container]',
      fragment: '[data-pjax-container]'
    };

    $document.pjax('a[data-pjax]', _pjaxOptions);

    $document.on('submit', 'form[data-pjax]', function(e) {
      $.pjax.submit(e, _pjaxOptions);
    });

    $document.on('click', '[data-action]', function(e) {
      var _self = $(this);
      var action = _self.data('action');
      var _openWindow = function(url, h, w) {
        var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
        var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;
        var left = ((screen.width / 2) - (w / 2)) + dualScreenLeft;
        var top = ((screen.height / 2) - (h / 2)) + dualScreenTop;
        var newWindow = window.open(url, '', 'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left)
        if (window.focus) {
          newWindow.focus();
        }
        return newWindow;
      };
      e.preventDefault();
      switch(action) {
        case 'open-drawer':
          Drawer.open();
          break;
        case 'close-drawer':
          Drawer.close();
          break;
        case 'share-gplus':
          _openWindow('https://plus.google.com/share?url=' + encodeURIComponent(location.href), 600, 600);
          break;
        case 'share-facebook':
          _openWindow('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(location.href), 436, 626);
          break;
        case 'share-twitter':
          _openWindow('https://twitter.com/share?url=' + encodeURIComponent(location.href) + '&text=' + encodeURIComponent(document.title), 440, 550);
          break;
      }
      return false;
    });

    $('[data-load-image]', $body).each(function() {
      ImageLoader.load($(this));
    });

    $surface.on('scroll', function() {
      var offset = $surface.scrollTop();
      var btn = $('#drawer-button');
      if (offset === 0) {
        btn.removeClass('drawer-button-hidden');
      } else if (!btn.hasClass('drawer-button-hidden')) {
        btn.addClass('drawer-button-hidden');
      }
    });

    $document.on('click', 'a[href^="#"]:not([href="#"])', function(e) {
      e.preventDefault();
      var target = $(this.hash).length ? $(this.hash) : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $surface.animate({
          scrollTop: target.offset().top
        }, 500);
        location.hash = this.hash;
        return false;
      }
    });

    $surface.on('touchstart', function(e) {});

    if ($body.hasClass('home-template')) {
      $('.wrapper').eq(0).focus();
    }

  });

})(jQuery, window, document);
