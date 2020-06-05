// JavaScript Document
(function($)
{
	$.fn.GuidedTour = function(trigger, list, opts, use_attr_opts)
	{
		/** 
		  * Loop thru each matched and call repective functions 
		  */
		return this.each(function(i, el)
		{
			new GuidedTourObject(el, trigger, list, opts, use_attr_opts);
			//----------------------
		})
	}
	
	var GuidedTourObject = function(start_el, trigger, list, opts, use_attr_opts)
	{
		var main = this;
		
		main.params = {
			guidedtour_name: null,
			start_date: '2016-06-02', 
			num_days: 365/*1 yr*/,
		}
		
		$.extend(main.params, opts);
		
		main.start_el = $(start_el);
		
		main.trigger = trigger;
		main.list = list;
		main.use_attr_opts = use_attr_opts;
		
		main.initParams = function()
		{
			// Get params from element's attribute
			if (main.use_attr_opts !== false)
			{
				if (main.start_el.attr('data-guidedtour-trigger'))
				{
					main.trigger = Math.abs(main.start_el.attr('data-guidedtour-trigger'));
				}
				
				if (main.start_el.attr('data-guidedtour-params') && typeof Ox.parseProps !== 'undefined')
				{
					var el_params = Ox.parseProps(main.start_el.attr('data-guidedtour-params'));
					$.extend(main.params, el_params);
				}

				var tour_slides = $(
				  (main.start_el.attr('data-guidedtour-list') ? main.start_el.attr('data-guidedtour-list') + ', ' : '' ) 
				  + '.guidedtour-list[data-guidedtour-group="' + main.params.guidedtour_name + '"] > *,' 
				  + '.guidedtour-listitem[data-guidedtour-group="' + main.params.guidedtour_name + '"]'
				);
				
				if (tour_slides.length)
				{
					main.list = main.list ? main.list : [];
					tour_slides.each(function(i, el)
					{
						el = $(el);
						var slide_object = {};
						slide_object.header_content = el.attr('data-overview-header');
						slide_object.main_content = el.html();
						slide_object.target_id = el.attr('data-target-id');
						slide_object.button_next = el.attr('data-button-next');
						slide_object.button_prev = el.attr('data-button-prev');
						
						if (el.attr('data-guidedtour-params') && typeof Ox.parseProps !== 'undefined')
						{
							slide_object.params = Ox.parseProps(el.attr('data-guidedtour-params'));
						}
						
						main.list.push(slide_object);
					})
					
					return true;
				}
			}
			
			return false;
		}
		
		main.getKeyAction = function(key)
		{
			/*
			if ((e.ctrlKey && e.keyCode == 'E'.charCodeAt(0)) && !area.offsetHeight) {
			  edit()
			  return false
			}
		   
			if ((e.ctrlKey && e.keyCode == 'S'.charCodeAt(0)) && area.offsetHeight) {
			  save()
			  return false
			}
			*/
		}
		
		
		main.saveResponse = function()
		{
			main.GuidedTour_persistent = main.GuidedTour_persistent ? main.GuidedTour_persistent : {};
			main.GuidedTour_persistent.responses = main.current_responses;
			main.GuidedTour_persistent.last_shown = main.show_time;
			main.Storage.setVal(main.GuidedTour_persistent/*Object. It's auto JSON.stringify()ed in custom Storage*/).setToLocal();
		}
		
		
		main.fire = function(i, el, trigger)
		{
			if (!main.list[i])
			{
				return;
			}
			
			var current_itm = main.list[i];
			var el = el ? el : $('#' + current_itm.target_id);
			var trigger = trigger ? trigger : 150;
			
			// Flow control buttons
			var flow_control = $('<br /><br /><div class="display-block algn-cntr"></div>');
			
			// Treat last slide differently
			if (i === main.list.length - 1)
			{
				flow_control.append('<a class="button" data-action="close" data-response="loop" href="#" tabindex="-1">Restart this Guide</a>');
				flow_control.append('<a class="button active" data-action="close" data-response="finish" href="#" tabindex="-1">Close</a>');
			}
			else
			{
				if (main.list[i - 1])
				{
					var prev_itm = main.list[i - 1];
					var button_prev = current_itm.button_prev ? current_itm.button_prev : 'Prev';
					flow_control.append('<a class="button" data-action="close" data-response="prev" href="#' + prev_itm.target_id + '" tabindex="-1">' + button_prev + '</a>');
				}
				
				if (main.list[i + 1])
				{
					var button_next = current_itm.button_next ? current_itm.button_next : 'Next';
					var next_itm = main.list[i + 1];
					flow_control.append('<a class="button active" data-action="close" data-response="next" href="#' + next_itm.target_id + '" tabindex="-1">' + button_next + '</a>');
				}
			}
			
			// Flow control merges with original content
			var main_content = $('<div></div>').html(current_itm.main_content).append(flow_control);
			
			// Footer
			var footer_content = null;
			if (i)
			{
				footer_content = $('<span class="display-in-block float-lft">' + (i + ' of ' + (main.list.length - 1)) + '</span>');
			}
			
			// Callback
			var OnBeforeClose = function(el, closing_response)
			{
				main.current_responses[closing_response + 'ed'] = '@' + i;
				main.saveResponse();
				
				if (typeof callback === 'function')
				{
					callback();
				}
				
				// Call the next or prev one
				var button_prev = $(el.find('[data-action=close][data-response=prev]')[0]);
				var button_next = $(el.find('[data-action=close][data-response=next]')[0]);
				
				//switch(e.keyCode)
				switch(closing_response)
				{
					case 'prev':
					  main.fire(i - 1);
					break;
					
					case 'next':
					  main.fire(i + 1);
					break;
					
					case 'loop':
					  // We must currently be on the first silde... the intro...
					  // Opening overview on this wont work immediately as its about to close.
					  // So we give enough for close to complete before opening. If we open too early, close will terminate it
					  main.looping = true;
					  main.fire(0/*first item*/, main.start_el, 400);
					break;
					
					// ----------------------------
					
					case 37: // left
					  button_prev.trigger('click');
					break;
					
					case -9: // tab + event.shiftKey. This is a custom keyCode
					  button_prev.trigger('click');
					break;
					
					/*
					case 38: // up
					  button_prev.trigger('click');
					break;
					*/
					
					// ----------------------------
					  
					case 39: // right
					  button_next.trigger('click');
					break;
					
					case 9: // tab
					  button_next.trigger('click');
					break;
					
					/*
					case 40: // down
					  button_next.trigger('click');
					break;
					*/
				}
			}
			
			// All together now...
			
			var params = {
				header_content: current_itm.header_content,
				main_content: main_content,
				footer_content: footer_content,
				
				OnStateChange: function(d, overview_element)
				{
					// CONTEXT: 'this' refers to the instantiated overview object
					var subject_element = this;
					if (d.state === 'closing')
					{
						OnBeforeClose(overview_element, d.closing_response);
					}
				},
				
				type: 'guidedtour',
				alignment: 'C',
				placement: 'B,A',
				axis: 'Y,X,Z',
				position_search_priority: ['axis', 'alignment', 'placement'],
				backdrop_subject: true,
				header_controls: false,
				footer_controls: true,
				auto_focus: true,
				kbd_keys: {left:'left arrow = prev', right:'right arrow = next', tab:'tab = next; tab + shift = prev', esc:'esc = exit'},
			};
			
			if (i === 0)
			{
				params.kbd_keys.left = false;
				params.kbd_keys.tab = false;
				params.use_recurrence_preference = 'never-again';
				params.overview_name = main.params.guidedtour_name;
			}
			
			params.trigger = trigger;
			
			$.extend(params, (current_itm.params ? current_itm.params : {}));
			
			// Execute...
			el.Overview(params, main.use_attr_opts, main.looping/*force_exec*/);
		}
		
		
		// Start the first one
		//----------------------
		
		main.execGuidedTour = function()
		{
			main.Datetime = Ox.Datetime();
			// Where to save responses and other params
			main.Storage = Ox.Storage('Guided Tours', main.params.guidedtour_name);
			
			main.current_responses = {
				nexted: false,
				preved: false,
				finished: false,
				looped: false,
			}
			
			// Lets talk about time
			var starting_time_stamp = main.Datetime.strToTime(main.params.start_date);
			var ending_timestamp = main.Datetime.strToTime('+' + main.params.num_days + 'days');
			var current_time_stamp = Date.now();
			
			if (!(starting_time_stamp <= current_time_stamp && ending_timestamp >= current_time_stamp))
			{
				return false;
			}
			
			// Lets get the list of items
			if (typeof main.list !== 'object')
			{
				if (!main.initParams())
				{
					return false;
				}
			}
			
			// Fire
			main.show_time = Date.now();
			main.fire(0/*first item*/, main.start_el, main.trigger);
		}
		
		main.execGuidedTour();
	}
})(jQuery);
