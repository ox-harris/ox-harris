// JavaScript Document
(function($)
{
	$.fn.ScrollInOut = function(callback, opts, use_attr_opts)
	{
		return this.each(function(i, el)
		{
			new ScrollInOutObject(el, callback, opts, use_attr_opts);
		})
	}
	
	$.fn.ScrollIn = function(callback, opts, use_attr_opts)
	{
		return this.each(function(i, el)
		{
			$.extend(opts, {location: 'in'}/*Overrides this value in opts if still set*/);
			new ScrollInOutObject(el, callback, opts, use_attr_opts);
		})
	}
	
	$.fn.ScrollOut = function(callback, opts, use_attr_opts)
	{
		return this.each(function(i, el)
		{
			$.extend(opts, {location: 'out'}/*Overrides this value in opts if still set*/);
			new ScrollInOutObject(el, callback, opts, use_attr_opts);
		})
	}
	
	var ScrollInOutObject = function(element, callback, opts, use_attr_opts)
	{
		// Lets save the this globally as main
		var main = this;
		
		main.params = {
			location: 'in',
			direction: 'both',
			whole_entry: false,
			whole_exit: false,
			lead: 0,
			lag: 0,
			max_clocks: null,
			viewport: window,
			active_scroll_up: '',
			active_scroll_down: '',
		};
		
		// Element
		main.use_attr_opts = use_attr_opts;
		main.element = $(element);
		main.callback = callback;
		
		// Combine params
		$.extend(main.params, opts);
		main.initParams = function()
		{
			// Get params from element's attribute
			if (main.use_attr_opts !== false)
			{
				if (main.element.attr('data-scrollinout-callback'))
				{
					main.callback = main.element.attr('data-scrollinout-callback');
				}
				
				if (main.element.attr('data-scrollinout-params') && typeof Ox.parseProps !== 'undefined')
				{
					var el_params = Ox.parseProps(main.element.attr('data-scrollinout-params'));
					$.extend(main.params, el_params);
				}
			}
		}
		main.initParams();
		
		// Offset added to element trigger line					
		main.params.offset = Math.abs(main.params.lead) - Math.abs(main.params.lag);
		// Viewport
		main.viewport = $(main.params.viewport);
		main.up_clocks_count = 0;
		main.down_clocks_count = 0;
		
		// Scroll Event
		main.last_scrollValue = main.viewport.scrollTop();
        main.viewport.on('scroll', function()
        {
            var this_scrollValue = $(this).scrollTop();
            if (this_scrollValue > main.last_scrollValue)
            {
				main.exec({
					scrollY: this_scrollValue,
					direction: 'up',
				});
            }
            else if (this_scrollValue < main.last_scrollValue)
            {
				main.exec({
					scrollY: this_scrollValue,
					direction: 'down',
				});
            }
            
            main.last_scrollValue = this_scrollValue;
        });
		
		
		// Function
		main.exec = function(e)
		{
			// If viewport is not window, the viewpoet's own offset should be takem into account
			main.element_offset_top_relative_to_viewport = main.element.offset().top - (main.params.viewport !== window ? main.viewport.offset().top : 0);
			
			// Relative to viewport top: visible distance from viewport top edge
			var element_top_from_viewport_top_IN = main.element_offset_top_relative_to_viewport - e.scrollY;
			var element_bottom_from_viewport_top_IN = element_top_from_viewport_top_IN + main.element.height();
			
			// Relative to viewport bottom: visible distance from viewport bottom edge
			var element_top_from_viewport_bottom_IN = main.viewport.height() - element_top_from_viewport_top_IN;
			var element_bottom_from_viewport_bottom_IN = element_top_from_viewport_bottom_IN - main.element.height();
			
			if (e.direction == 'up' && (main.params.direction == 'up' || main.params.direction == 'both'))
			{
				// ELEMENT IS GOING UP FROM BOTTOM
				
				// Use element top line as scroll-in trigger line
				var element_distance_IN_from_viewport_bottom = element_top_from_viewport_bottom_IN;
				// Use element top line as scroll-out trigger line
				var element_distance_IN_from_viewport_top = element_top_from_viewport_top_IN;
				
				if (main.params.whole_entry)
				{
					// Use element bottom line as scroll-up trigger line
					element_distance_IN_from_viewport_bottom = element_bottom_from_viewport_bottom_IN;
				}
				
				if (main.params.whole_exit)
				{
					// Use element bottom line as scroll-out trigger line
					element_distance_IN_from_viewport_top = element_bottom_from_viewport_top_IN;
				}
				
				if ((main.params.location == 'in' && element_distance_IN_from_viewport_bottom + main.params.offset > 0) // IN
				|| (main.params.location == 'out' && element_distance_IN_from_viewport_top - main.params.offset < 0) // OUT
				)
				{
					// ELEMENT IS IN. NOW HOW MANY CLOCKS ?
					if (main.params.max_clocks === null/* Respond to all clocks */ || (main.params.max_clocks > 0 && main.up_clocks_count < main.params.max_clocks)/* Respond to this first number of clocks */)
					{
						var current_distance = main.params.location == 'in' ? element_distance_IN_from_viewport_bottom : element_distance_IN_from_viewport_top;
						if (typeof main.callback === 'function')
						{
							main.callback.call(main.element, current_distance, e.direction, main.viewport);
						}
						
						if (main.params.active_scroll_up)
						{
							main.element.removeClass(main.params.active_scroll_down).addClass(main.params.active_scroll_up);
						}
						
						// Increase down_clocks_count
						main.up_clocks_count ++;
					}
				}
				else
				{
					main.up_clocks_count = 0;
				}
			}
			
			if (e.direction == 'down' && (main.params.direction == 'down' || main.params.direction == 'both'))
			{
				// ELEMENT IS COMING DOWN FROM TOP
				
				// Use element bottom line as scroll-in trigger line
				var element_distance_IN_from_viewport_top = element_bottom_from_viewport_top_IN;
				// Use element bottom line as scroll-out trigger line
				var element_distance_IN_from_viewport_bottom = element_bottom_from_viewport_bottom_IN;
				
				if (main.params.whole_entry)
				{
					// Use element top line as scroll-up trigger line
					element_distance_IN_from_viewport_top = element_top_from_viewport_top_IN;
				}
				
				if (main.params.whole_exit)
				{
					// Use element top line as scroll-out trigger line
					element_distance_IN_from_viewport_bottom = element_top_from_viewport_bottom_IN;
				}
				
				if ((main.params.location == 'in' && element_distance_IN_from_viewport_top + main.params.offset > 0) // IN
				|| (main.params.location == 'out' && element_distance_IN_from_viewport_bottom - main.params.offset < 0) // OUT
				)
				{
					if (main.params.max_clocks === null/* Respond to all clocks */ || (main.params.max_clocks > 0 && main.down_clocks_count < main.params.max_clocks)/* Respond to this first number of clocks */)
					{
						var current_distance = main.params.location == 'in' ? element_distance_IN_from_viewport_top : element_distance_IN_from_viewport_bottom;
						if (typeof main.callback === 'function')
						{
							main.callback.call(main.element, current_distance, e.direction, main.viewport);
						}
						
						if (main.params.active_scroll_down)
						{
							main.element.removeClass(main.params.active_scroll_up).addClass(main.params.active_scroll_down);
						}
						
						// Increase down_clocks_count
						main.down_clocks_count ++;
					}
				}
				else
				{
					main.down_clocks_count = 0;
				}
			}
		};
			
			
		// On initialize
		var scrollValue_on_load = main.viewport.scrollTop();
		if (scrollValue_on_load >= 0)
		{
			main.exec({
				scrollY: scrollValue_on_load,
				direction: 'up',
			});
		}
	}
})(jQuery)
