// JavaScript Document
(function($)
{
	window.Modal = function(type, data, opts, opts2)
	{
		if (opts.btn1)
		{
			opts.btn1 = '<button data-action="close" data-response="Y">' + opts.btn1 + '</button>';
		}
		if (opts.btn2)
		{
			opts.btn2 = '<button data-action="close" data-response="N">' + opts.btn2 + '</button>';
		}
		else
		{
			opts.btn2 = '';
		}
		
		var content = '<div class="display-block">' + data + '</div><br /><div class="display-block algn-rt">' + opts.btn1 + opts.btn2 + '</div>';
		var anchor_element = opts.anchor_element ? opts.anchor_element : $('<div></div>').appendTo('body');
		
		var params = {
			type: type,
			trigger:1,
			header_content: type.toUpperCase(),
			main_content: content,
			alignment: 'C',
			placement: 'C',
			axis: 'Z',
			header_controls: false,
			backdrop_subject: false,
			kbd_keys: {enter:'enter = submit', esc:'esc = cancel'},
			OnStateChange: function(d, overview_element)
			{
				var subject_element = this;
				if (d.state === 'closing')
				{
					if (opts.OnBeforeClose)
					{
						opts.OnBeforeClose(overview_element, d.closing_response);
					}
				}
				else if (d.state === 'opened')
				{
					overview_element.find('input').focus();
				}
				else if (d.state === 'closed')
				{
					if (!opts.anchor_element)
					{
						// This was a generic element. So remove.
						anchor_element.remove();
					}
				}
			},
		};
		
		if (opts.anchor_element)
		{
			params.axis = 'X,Y,Z';
			params.placement = 'A,B';
			params.alignment = 'A,B,C';
			//params.backdrop_subject = true;
		}
		
		$.extend(params, opts2)
		anchor_element.Overview(params);
	}

	window.Alert = function(text, callback, opts, opts2)
	{
		var params = {
			btn1: 'Ok',
			btn2: null,
			anchor_element: null,
			OnBeforeClose: function(el, closing_response)
			{
				if (typeof callback === 'function')
				{
					callback(closing_response);
				}
			}
		};
		
		$.extend(params, opts);
		Modal('alert'/*type*/, text, params, opts2);
	}
	
	window.Confirm = function(text, callback, opts, opts2)
	{
		var params = {
			btn1: 'Ok',
			btn2: 'Cancel',
			anchor_element: null,
			OnBeforeClose: function(el, closing_response)
			{
				if (typeof callback === 'function')
				{
					if (closing_response == 'Y' || closing_response === 13/*enter key*/)
					{
						callback(true);
					}
					else
					{
						callback(false);
					}
				}
			}
		};
		
		$.extend(params, opts);
		Modal('confirm'/*type*/, text, params, opts2);
	}
	
	window.Prompt = function(text, value, callback, opts, opts2)
	{
		text += '<br />' + '<input class="display-block margin-btm-0 roundness-050" autofocus="autofocus" type="text"' + (value ? ' value="' + value + '"' : '') + ' />';
		var params = {
			btn1: 'Submit',
			btn2: 'Cancel',
			anchor_element: null,
			OnBeforeClose: function(el, closing_response)
			{
				var input = el.find('input');
				if (typeof callback === 'function')
				{
					if (closing_response == 'Y' || closing_response === 13/*enter key*/)
					{
						callback(input.val());
					}
					else
					{
						callback(null);
					}
				}
			}
		}
		
		$.extend(params, opts);
		Modal('prompt'/*type*/, text, params, opts2);
	}

	$.fn.Alert = function(text, callback, opts, opts2)
	{
		opts = opts ? opts : {};
		return this.each(function(i, el)
		{
			opts.anchor_element = $(el);
			new Alert(text, callback, opts, opts2);
			//----------------------
		})
	}
	
	$.fn.Confirm = function(text, callback, opts, opts2)
	{
		opts = opts ? opts : {};
		return this.each(function(i, el)
		{
			opts.anchor_element = $(el);
			new Confirm(text, callback, opts, opts2);
			//----------------------
		})
	}

	$.fn.Prompt = function(text, value, callback, opts, opts2)
	{
		opts = opts ? opts : {};
		return this.each(function(i, el)
		{
			opts.anchor_element = $(el);
			new Prompt(text, value, callback, opts, opts2);
			//----------------------
		})
	}
})(jQuery);
