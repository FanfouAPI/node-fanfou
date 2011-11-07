// Define the router
var AuthRouter = Backbone.Router.extend({
	routes: {
	    '!/login': 'login',
	    '!/register': 'register',
	    '': "enter",
	},

	enter: function () {
	    window.location.hash = '#!/login';
	},
	
	register: function () {
	    var view = new RegisterView({
		    'el': $('#content'),
		});
	    view.render();
	},

	login: function () {
	    var view = new LoginView({
		    'el': $('#content'),
		});
	    view.render();
	},	
    });

var Auth = function () {
    var auth_router;

    function template(temp_selector, data) {
        return Mustache.to_html($(temp_selector).html(),
                                data);
    }

    function notify(text) {
	$('.notify').html(text).show();
    }

    function headElement(leftel, centerel, rightel) {
	function setel(pos, el) {
	    var e = $('#head-' + pos).empty();
	    if(el) {
		var h = $('<a>');
		var text;
		if(typeof el == 'string') {
		    text = el;
		} else {
		    text = el.text;
		    if(el.href) {
			h.attr('href', el.href);		    
		    }
		}
		h.html(text);
		e.append(h);
	    }
	}

	setel('left', leftel);
	setel('center', centerel);
	setel('right', rightel);
    }


    function initialize() {
        auth_router = new AuthRouter();
        Backbone.history.start();
	$('#loading').bind('ajaxSend', function (){
		$(this).show();
	    }).ajaxComplete(function () {
		    $(this).hide();
		});

	$('.notify').click(function () {
		$(this).hide();
	    });
    }    
    // Exports
    return {
	'notify': notify,
        'initialize': initialize,
        'template': template,
	'headElement': headElement
    };
}();