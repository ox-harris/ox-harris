// JavaScript Document
(function($) {
$(document).ready(function()
{
		// -----------------------------------------------
		$('main').on('change', 'input[type="checkbox"], input[type="radio"]', function(e)
		{
			var input = $(this).attr('data-state-followed', 'true');
			var icon_checked = input.is('[type="checkbox"]') ? 'check-square' : 'dot-circle';
			var icon_unchecked = input.is('[type="checkbox"]') ? 'square-o' : 'circle-o';
			if (input.is(':checked'))
			{
				input.closest('label, ._label').addClass('active').find('.fa').removeClass('fa-' + icon_unchecked).addClass('fa-' + icon_checked);
			}
			else
			{
				input.closest('label, ._label').removeClass('active').find('.fa').removeClass('fa-' + icon_checked).addClass('fa-' + icon_unchecked);
			}
		});
		
		/*----------------------------------------------------------------------------------------*/

		$('.dot-options-handle').Overview({
			axis: 'Y',
			trigger: 'focus',
			placement: 'C',
			alignment: 'B',
			auto_focus: false,
			main_content: '',
			additional_classes: 'content-no-padding-hz'
		});
		
		/*----------------------------------------------------------------------------------------*/
		
		$('body').on('click', '[data-confirm]', function(e)
		{
			var element = $(this);
			var message = element.attr('data-confirm');
			if (message)
			{
				Confirm(message, function(response)
				{
					if (response)
					{
						if (element.attr('href') && element.attr('data-on-confirm') == 'follow')
						{
							location.href = element.attr('href');
						}
						else
						{
							element.removeAttr('data-confirm');
							element.trigger('click');
							element.attr('data-confirm', message);
						}
					}
				});
				
				return false;
				//e.preventDefault();
			}
		})
		
		$('body').on('click', '[data-alert]', function()
		{
			Alert($(this).attr('data-alert'));
		})
		
		$('body').on('click', '.page-notices ._success, .page-notices ._error', function()
		{
			var notice = $(this);
			notice.addClass('fly-bottom50');
			notice.one('animationend webkitAnimationEnd oAnimationEnd oanimationend MSAnimationEnd', function()
			{
				notice.removeClass('fly-bottom50 active');
			});
		})
		
		/*----------------------------------------------------------------------------------------*/
		
		
		$('body').on('click', '[data-overviewreq]:not(:input)', function()
		{
			var element = $(this);
			if (element.attr('data-confirm'))
			{
				return;
			}
			
			var url = element.attr('href') ? element.attr('href') : (element.attr('data-href') ? element.attr('data-href') : null);
			
			if (url)
			{
				var overview_params = {
					trigger: 1,
					type: 'modalview',
					axis:'Z',
					placement:'C',
					alignment:'C',
					auto_focus:true,
				};
				
				var req_params = {
					url: url,
					OnContentLoaded: window.uiInit
				}
				
				element.OverviewReq(overview_params, req_params);
			}
			
			return false;
		});
		
		/*----------------------------------------------------------------------------------------*/
		
		$('form').on('keyup', ':input[data-overviewreq]', function()
		{
			var input = $(this);
			var form = input.closest('form');
			var val = input.val().trim();
			
			if (val.length > 2 && val !== input.attr('data-last-val')/*emulate 'onchange' but enjoy on keyup*/)
			{
				var url = form.attr('action');
				var data = form.serialize();
				var overview_params = {
					axis:'X,Y',
					trigger: 1,
					placement:'A,B',
					alignment:'C',
					auto_focus:false,
					additional_classes:'form-field-suggestion'
				};
				
				var req_params = {
					url: url,
					trigger: 1,
					data: data,
					show_status: false,
					OnContentLoaded: window.uiInit
				}
				
				input.OverviewReq(overview_params, req_params);
				
				// Save val
				input.attr('data-last-val', val);
			}
		});
		
		/*----------------------------------------------------------------------------------------*/
		
		$('body').on('click', 'a[href][data-interactivereq]', function(e)
		{
			var a = $(this);
			if (a.attr('data-confirm'))
			{
				return;
			}

			var url = a.attr('href');
			var req_params = {
				url: url,
				show_status: true,
				waiting_msg: null,
				ajax_process_control_element: null,
				result_extract: null,
				result_extract2: null,
				result_update: '#section-page-content',
				parse_response_scripts: true,
				browser_pushstate: 'auto',
			}
			
			a.InteractiveReq(req_params);
			
			e.preventDefault();
		});
	
		/*----------------------------------------------------------------------------------------*/
	
		$('form').on('click', 'button[name], input[type="submit"][name]', function(e)
		{
			$($(this).parents('form')[0]).attr('data-submitter', $(this).attr('name'));
		});
		
		// -----------------------------------------------
		
		$('body').on('submit', 'form[data-interactivereq]', function(e)
		{
			var form = $(this);
			// Bouycot the automatic initializer down down below.
			form.attr('data-interactivereq', 'active');
			
			var button = form.attr('data-submitter') ? $(form.find('[name="' + form.attr('data-submitter') + '"]')[0]) : $(form.find('button[type="submit"][name]:focus')[0]);
			var url = form.attr('action');
			var use_ajax = true;
			var data = null;
			
			var file_inputs = form.find('input[type="file"]');
			var type = form.attr('method') ? form.attr('method') : 'GET';
			if ((type.toLowerCase() == 'post' || file_inputs.length) && typeof FormData !== "undefined")
			{
				data = new FormData(form[0]);
				data.append(button.attr('name'), button.attr('value'));
			}
			else
			{
				data = form.serialize();
				var btn_data = button.attr('name') + '=' + button.attr('value');
				data = data ? data + '&' + btn_data : btn_data;
				
				if (file_inputs.length)
				{
					use_ajax = false;
				}
			}
			
			if (use_ajax)
			{
				var req_params = {
					type: type,
					url: url,
					trigger: 1,
					data: data,
					show_status: true,
					error_timeout: null,
					waiting_msg: 'Sending',
					result_extract: '#' + form.attr('id'),
					insert_fn: 'self_replace',
					animate_insert: true,
					parse_response_scripts: true,
					browser_pushstate: 'auto',
					cacheable: false,
					OnContentLoaded: window.uiInit
				};
	
				form.InteractiveReq(req_params);
				
				e.preventDefault();
			}
		})
		

	/*----------------------------------------------------------------------------------------*/
	$('#header-presentation').Presentation({
		animation_cast: 'exit',// 
		animation_fn: 'fade,zoomin',// slide | fade
		easing: 'easin',
		auto_play: true,
		OnInitialize: function()
		{
			var presentation_obj = this;
			var presentation_element = presentation_obj.presentation;
			var slide_elements = presentation_element.find('._slide_element');
			
			slide_elements.off('click', '._cta').on('click', '._cta', function(e)
			{
				var slide_element = $($(this).parents('._slide_element')[0]);
				
				// Clear the tv screen
				slide_element.find('._foreground ._header').css('top', '-500px');
				slide_element.find('._foreground ._content, ._foreground ._footer').css('top', '500px');
	
				slide_element.find('._foreground').animate(
				{
					opacity: 0
				}, 1200, function()
				{
					// Restore
					slide_element.removeClass('_backdrop').find('._foreground').css('opacity', 1);
					
					// Play
					if (slide_element.find('._background .multimedia .src').length && typeof slide_element.find('._background .multimedia .src')[0].play != 'undefined')
					{
						slide_element.find('._background .multimedia .src')[0].play();
						presentation_obj.autoPlayStop();
						presentation_obj.params.auto_play = false;
					}
				});
			});
			
			slide_elements.on('presentation.statechange', function(e, d)
			{
				var slide_element = $(this);
				if (e.currentTarget === e.target)
				{
					if (d.state === 'activating')
					{
						// ------------------------------------------
						// Set active state on this slide's thumbnail buttons
						$(presentation_element.find('[data-role="nav"][href="#' + slide_element.attr('id') + '"], [data-role="nav"][data-target="#' + slide_element.attr('id') + '"]')).addClass('active');
						
						// ------------------------------------------			
						slide_element.addClass('_backdrop');
						slide_element.find('._foreground ._header, ._foreground ._content, ._foreground ._footer').css('top', '0px');
						if (!Ox.browserCssSupport('filter'))
						{
							slide_element.addClass('_no-filter');
						}
						
						// ------------------------------------------
						slide_element
					}
					else if (d.state === 'deactivating')
					{
						// ------------------------------------------
						// Set inactive state on this slide's thumbnail buttons
						$(presentation_element.find('[data-role="nav"][href="#' + slide_element.attr('id') + '"], [data-role="nav"][data-target="#' + slide_element.attr('id') + '"]')).removeClass('active');
						
						// ------------------------------------------
						if (slide_element.find('._background .src').length > 0)
						{
							if (typeof slide_element.find('._background .src')[0].stop != 'undefined')
							{
								slide_element.find('._background .src')[0].stop();
							}
						}
					}
				}
			});
			
			presentation_element.on('presentation.playstatechange', function(e, d)
			{
				var play_pause_icon = presentation_element.find('[data-role="playpause"] .fa');
				if (d.autoplay == 'started')
				{
					play_pause_icon.removeClass('fa-play').addClass('fa-pause');
				}
				else if (d.autoplay == 'stopped')
				{
					play_pause_icon.removeClass('fa-pause').addClass('fa-play');
				}
			})
		}
	});
	
	/*----------------------------------------------------------------------------------------*/
	// window.uiInit(); should only be called after specific elements have been bound to widgets.
	
	window.uiInit = function()
	{
		$('input[type="checkbox"]:not([data-state-followed]), input[type="radio"]:not([data-state-followed])').trigger('change');

		// Bouycot the automatic initializer down down below.
		$('body [data-overviewreq]:not(:input)').attr('data-overviewreq', 'active');
		$('body :input[data-overviewreq]').attr('data-overviewreq', 'active');
		$('body a[href][data-interactivereq]').attr('data-interactivereq', 'active');
		$('body form[data-interactivereq]').attr('data-interactivereq', 'active');

		/*----------------------------------------------------------------------------------------*/
	
		$('[data-tablefuncs="true"]').TableFuncs().attr('data-tablefuncs', 'active');
		$('[data-collapsible="true"]').Collapsible().attr('data-collapsible', 'active');
		$('[data-collapsibleheirachy="true"]').CollapsibleHeirachy().attr('data-collapsibleheirachy', 'active');
		$('[data-presentation="true"]').Presentation().attr('data-presentation', 'active');
		$('[data-overview="true"]').Overview().attr('data-overview', 'active');
		$('[data-guidedtour="true"]').GuidedTour().attr('data-guidedtour', 'active');
		$('[data-scrollin="true"]').ScrollIn().attr('data-scrollin', 'active');
		$('[data-infinitefeeds="true"]').InfiniteFeeds().attr('data-infinitefeeds', 'active');
		$('[data-overviewreq="true"]').OverviewReq().attr('data-overviewreq', 'active'); // Already active for inputs and links.
		$('[data-interactivereq="true"]').InteractiveReq().attr('data-interactivereq', 'active'); // Already active for forms and links.
		// data-confirm and data-alert already active.
	}
	window.uiInit();

	/*----------------------------------------------------------------------------------------*/

	// On resize
	$(document).on('responsive-mode-change', function(e, responsive_mode)
	{
		setTimeout(function()
		{
			var col_control = $('nav.layout-column ._content > ul > li[data-collapsible] > a > ._control');
			var col_state = $('nav.layout-column ._content > ul > li[data-collapsible] > ul > li[data-collapsible]').attr('data-state');
			
			if (responsive_mode === 'lg')
			{
				if (col_state === 'collapsed')
				{
					// Click to expand
					col_control.trigger('click');
				}
			}
			else
			{
				if (col_state === 'expanded')
				{
					// Click to collapse
					col_control.trigger('click');
					if (col_state === 'expanded')
					{
						// Click to collapse
						col_control.trigger('click');
					}
				}
			}
		}, 400);
	})
			
	/*----------------------------------------------------------------------------------------*/

	$('body').on('focus', 'input[type="password"], input[data-type="password"]', function()
	{
		symbols = ['<', '>', '@', '!', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '[', ']',
		'{', '}', '?', ':', ';', '|', '\'', '"', '\\', ',', '.', '/', '~', '`', '-', '='];
		
		$(this).on('keyup',function()
		{
			//var indicator = $('#' + $(this).attr('aria-describedby') + ' .password-indicator');
			var indicator = $('.password-indicator');
	
			var has_number = false;
			var has_symbol = false;
			var has_uppercase = false;
			var has_lowercase = false;
			var length_ok = false;
			
			var password = $(this).val();
			
			for (var i=0; i < password.length; i++)
			{
				char = password.charAt(i);
				//if its a number
				if (!isNaN(char * 1))
				{
					has_number = true;
				}
				else if (~symbols.indexOf(char))
				{
					has_symbol = true;
				}
				else if (char == char.toUpperCase())
				{
					has_uppercase = true;
				}
				else if (char == char.toLowerCase())
				{
					has_lowercase = true;
				}
			}
			
			length_ok = password.length >= 8;
			
			indicator.attr('data-number', (has_number ? 'true' : 'false'));
			indicator.attr('data-symbol', (has_symbol ? 'true' : 'false'));
			indicator.attr('data-uppercase', (has_uppercase ? 'true' : 'false'));
			indicator.attr('data-lowercase', (has_lowercase ? 'true' : 'false'));
			indicator.attr('data-length', (length_ok ? 'true' : 'false'));
			
			var strength_index = (has_number ? 3 : 0) + (has_symbol ? 4 : 0) + (has_uppercase ? 2 : 0) + (has_lowercase ? 1 : 0);
			var strength_desc = strength_index == 10 ? 'Very Strong' : (strength_index > 8 ? 'Strong' : (strength_index > 5 ? 'Very Good' : (strength_index > 2 ? 'Good' : 'Weak')));
			
			indicator.attr('data-strength', strength_index).attr('data-strength-desc', strength_desc);
		});
	});
	
	/*----------------------------------------------------------------------------------------*/
	
	$('body').on('change', '#password-show-hide', function()
	{
		var inputs = $($(this).parents('form')[0]).find('input[type=password], input[data-type=password]');
		if ($(this).prop('checked') == true)
		{
			inputs.attr('type', 'text').attr('data-type', 'password');
		}
		else
		{
			inputs.attr('type', 'password');
		}
	});

	/*----------------------------------------------------------------------------------------*/

	$('body').on('click', '.page-share a:not(.subject-icon)', function(event)
	{
		share_url = $(this).attr('href');
		//share_url = window.location.href;
		window.open(share_url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');
		event.preventDefault();
	});
	
	/*----------------------------------------------------------------------------------------*/
	
	$('body').on('click', '[href*=#]:not(.doc-no-scroll)', function(e)
	{
		var href = $(this).attr('href');
		var target_id = href.substr(href.indexOf('#'));
		if (target_id != '#')
		{
			var target_element = $(target_id)
			$("html, body").animate(
			{
				scrollTop: ((target_id == '#' ? 0 : target_element.offset().top) - 75) + 'px'
			}, 600);
		}
		else
		{
			$('html, body').animate({scrollTop : 0},1500);
			e.preventDefault();
		}
	});
	
	$('#footer-shift').css('height', $('footer #footer-foot').addClass('pos-fxd').outerHeight() + 'px');
	
	/*----------------------------------------------------------------------------------------*/
	// Last bit stuff. So by first-run here, all functions and scripts should alread be initialized. 
	/*----------------------------------------------------------------------------------------*/
	
	
	setInterval(function tick_time()
	{
		$('time[datetime]').each(function(i, ele)
		{
			ele = $(ele);
			var datetime = ele.attr('datetime');
			var datetime_ago = Ox.Datetime().ago(Ox.Datetime().strToTime(datetime));
			if (ele.children('span').length > 0)
			{
				ele.children('span').html(datetime_ago);
			}
			else
			{
				ele.html(datetime_ago);
			}
		});
	},
	1000 * 60/*every minute*/);
	
	/*----------------------------------------------------------------------------------------*/
	
	window.responsiveModeAlert = function()
	{
		var responsive_mode = null;
		if ($(document).width() <= 983)
		{
			if ($(document).width() <= 450)
			{
				responsive_mode = 'sm';
			}
			else
			{
				responsive_mode = 'md';
			}
		}
		else
		{
			responsive_mode = 'lg';
		}
		
		if ($('body').attr('data-responsive-mode') !== responsive_mode)
		{
			$('body').attr('data-responsive-mode', responsive_mode);
			$(document).trigger('responsive-mode-change', [responsive_mode]);
		}
	}
	// Onload
	window.responsiveModeAlert();
	// Onresize
	$(window).on('resize', function()
	{
		window.responsiveModeAlert();
	});
	








	// 2CO CCPayment
	(function()
	{
		// Pull in the public encryption key for our environment
		if (typeof TCO !== 'undefined')
		{
			TCO.loadPubKey('production');
		}
		
		$('#commit-form').submit(function(e)
		{
			if (!$('#transactionToken').val() && typeof TCO !== 'undefined')
			{
				e.preventDefault();
				var myForm = $(this);
				var submit_button = myForm.find('button[type="submit"]');
				
				var errors = false;
				myForm.find('._entry').each(function(i, el)
				{
					el = $(el);
					if (el.children('._input').length && !el.children('._input').val())
					{
						errors = true;
						el.children('._notice').html('This field cannot be empty.');
					}
					else
					{ 
						el.children('._notice').html('');
					}
				});
				
				if (errors)
				{
					return;
				}
				
				// ------------------------------------------------------------
				
				myForm.find('.notices ._notice._error').removeClass('active');
				myForm.find('.notices ._notice._success').addClass('active').html('Validating...');
				submit_button.prop('disabled', true).addClass('active');
				
				// Setup token request arguments
				var args = {
					sellerId: '103251523',// '103251523' production | 901264092 sandbox
					publishableKey: '9A320A87-0925-44D0-BBA6-A23B07E25133',// 9A320A87-0925-44D0-BBA6-A23B07E25133 production | AC4AA70D-59BF-4D98-B318-E63B93F4DF1B sandbox
					ccNo: $('#ccNo').val(),
					cvv: $('#cvv').val(),
					expMonth: $('#ccExp_date_month').val(),
					expYear: $('#ccExp_date_year').val()
				};
				// Make the token request
				TCO.requestToken(
					//successCallback
					function(data)
					{
						submit_button.prop('disabled', false).removeClass('active');
						myForm.find('.notices ._notice._success').html('Validated! Processing payment...');
						myForm.attr('data-interactivereq', 'true').attr('data-interactivereq-params', 'waiting_msg:Processing Payment; result_update:#page-content-main');
						
						$('#transactionToken').val(data.response.token.token);
						myForm.submit();
					},
					//errorCallback
					function(data) {
						//if (data.errorCode === 200)
						// This error code indicates that the ajax call failed. We recommend that you retry the token request.
						if (data.errorCode !== 200)
						{
							myForm.find('.notices ._notice._error').addClass('active').html(data.errorMsg);
						}
						
						submit_button.prop('disabled', false).removeClass('active');
						myForm.find('.notices ._notice._success').removeClass('active');
						myForm.removeAttr('data-interactivereq').removeAttr('data-interactivereq-params');
					  },
					args
				);
			}
		})
	})();
	
});
})(jQuery)
