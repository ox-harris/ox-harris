// JavaScript Document
(function($) 
{
	$.fn.Collapsible = function(opts, use_attr_opts)
	{
		/** 
		  * Loop thru each matched and call repective functions 
		  */
		return this.each(function(i, el)
		{
			new CollapsibleObject(el, opts, use_attr_opts);
			//----------------------
		});
	}
	
	var CollapsibleObject = function(element, opts, use_attr_opts)
	{
		var main = this;
		
		main.params = {
			trigger: 'click',
			control_toggle: true,
			
			event_namespace: 'collapsible.',
			collapsible_name: null,
			ask_preferred_state: false,
			
			override_expand: null,
			override_collapse: null,
			
			element_expanded: null,
			element_collapsed: null,
			
			control: null,
			control_expanded: null,
			control_collapsed: null,
			
			control_icon: '.fa',
			control_icon_expanded: null,
			control_icon_collapsed: null,
			
			axis: 'Y',
			fade_to: 0,
			animation_duration: 400,
			expansion_timeout: 0,
			
			OnInitialize: null,
			OnStateChange: null
		};
		
		main.element = $(element);
		$.extend(main.params, opts);
		
		main.use_attr_opts = use_attr_opts;
		main.initParams = function()
		{
			// Get params from element's attribute
			if (main.use_attr_opts !== false)
			{
				if (main.element.attr('data-collapsible-params') && typeof Ox.parseProps !== 'undefined')
				{
					var el_params = Ox.parseProps(main.element.attr('data-collapsible-params'));
					$.extend(main.params, el_params);
				}
			}
		};
		main.initParams();
		
		if (main.params.override_expand || main.params.override_collapse)
		{
			main.override_collapsible = true;
		}
		
		main.element_id = main.element.attr('id');
		if (main.element.attr('data-collapsible-group'))
		{
			// Disable control toggle since this is an accordion
			//main.params.control_toggle = false;
			var collapsible_group = main.element.attr('data-collapsible-group');
			main.other_collapsibles_in_group = $($('[data-collapsible-group="' + collapsible_group + '"]').filter(function()
			{
				return this !== main.element[0];
			}));
		}
				
		main.control = $((main.params.control ? main.params.control  : '') + (main.params.control && main.element_id ? ', ' : '') + (main.element_id ? '[data-collapsible-handle][data-target="#' + main.element_id + '"], [data-collapsible-handle][href="#' + main.element_id + '"]' : ''));
		main.control_icon = $(main.control.children(main.params.control_icon));
		
		
		
		main.preset_max_width_or_height = main.params.axis == 'Y' ? main.element.css('max-height') : main.element.css('max-width');
		main.preset_overflow = main.element.css('overflow');
		
		
		
		/* -----------------------------------
		<triggers>: statechange {state: expanding, expanded, collapsing, collapsed}. 
		<listens-to>: collapse, expand
		------------------------------------ */
		main.events = {
			otherCollapsiblesCollapse: function()
			{
				if (main.other_collapsibles_in_group && main.other_collapsibles_in_group.length)
				{
					main.other_collapsibles_in_group.trigger(main.params.event_namespace + 'collapse');
				}
			},
			stateChange: function(state)
			{
				var data = {state: state};
				
				// Callback
				if (typeof main.params.OnStateChange === 'string')
				{
					window[main.params.OnStateChange].call(main.element, data);
				}
				else if (typeof main.params.OnStateChange === 'function')
				{
					main.params.OnStateChange.call(main.element, data);
				}
				
				// Event
				main.element.trigger(main.params.event_namespace + 'statechange', data);
			}
		};
		// -----------------------------------
		
	
		// BUNDLED_EXTRAS
		// ---------------------------------------------------------------
		main.element.on(main.params.event_namespace + 'statechange', function(e, d)
		{
			// Don't respond to this event bubbling from child.
			if (e.currentTarget === e.target)
			{
				main.element.attr('data-state', d.state);
				main.control.attr('data-collapsible-state', d.state);
				
				if (d.state == 'expanded')
				{
					//if (main.params.element_expanded)
					{
						main.element.removeClass(main.params.element_collapsed).addClass(main.params.element_expanded);
					}
					
					//if (main.params.control_expanded)
					{
						main.control.removeClass(main.params.control_collapsed).addClass(main.params.control_expanded);
					}
					
					//if (main.params.control_icon_expanded)
					{
						main.control_icon.removeClass(main.params.control_icon_collapsed).addClass(main.params.control_icon_expanded);
					}
				}
				else if (d.state == 'collapsed')
				{
					//if (main.params.element_collapsed)
					{
						main.element.removeClass(main.params.element_expanded).addClass(main.params.element_collapsed);
					}
					
					//if (main.params.control_collapsed)
					{
						main.control.removeClass(main.params.control_expanded).addClass(main.params.control_collapsed);
					}
					
					//if (main.params.control_icon_collapsed)
					{
						main.control_icon.removeClass(main.params.control_icon_expanded).addClass(main.params.control_icon_collapsed);
					}
				}
				
				if (d.state == 'expanded' || d.state == 'collapsed')
				{
					// Save response	
					if (main.user_initiated && main.Storage)
					{
						main.current_responses.last_state = d.state;
						main.Storage.setVal('state-followed').setToSession();
						// Even if there was last response, as long as it is negative, we keep asking.
						if (main.params.ask_preferred_state && !main.current_responses.preferred_default_state)
						{
							// No response since this session. Prompt user for response.
							main.element.Confirm('Should this always be ' + d.state + '?', function(user_response)
							{
								main.current_responses.preferred_default_state = user_response ? d.state : null;
								
								// Save state and response. Wait until this function is called by user's response.
								main.Storage.setVal(main.current_responses).setToLocal();
							}, {btn1:'Yes', btn2:'No'}, {overview_name:main.params.collapsible_name, use_recurrence_preference:true/*'next-session'*/});
						}
						else
						{
							// Save state and response. Save immediately.
							main.Storage.setVal(main.current_responses).setToLocal();
						}
						
					}
				}
			}
		})
		// ----------------------------------------------------------
		
		
		
		
		main.expand = function(force_open)
		{
			if (main.state === 'collapsed' || force_open)
			{
				// Everytime I expand, other_collapsibles_in_group need to collapse
				main.events.otherCollapsiblesCollapse();
				
				var props = {};
				if (typeof main.params.fade_to === 'number')
				{
					props.opacity = 1;
				}
				
				if (main.override_collapsible)
				{
					main.element.removeClass(main.params.override_collapse).addClass(main.params.override_expand);
				}
				else
				{
					//var natural_width_or_height = main.params.axis == 'Y' ? main.element.prop('scrollHeight') : main.element.prop('scrollWidth');
					var natural_width_or_height = main.params.axis == 'Y' ? main.element.get(0).scrollHeight : main.element.get(0).scrollWidth;
					if (main.params.axis == 'Y')
					{
						props.maxHeight = natural_width_or_height + 'px';
					}
					else
					{
						props.maxWidth = natural_width_or_height + 'px';
					}
				}
				
				// Update state	
				main.state = 'expanding';
				main.events.stateChange('expanding');
				
				main.element.clearQueue().animate(props,
				Math.abs(main.params.animation_duration),
				function()
				{
					// Reset
					//main.element.css('overflow', main.preset_overflow);
					
					if (!main.override_collapsible)
					{
						main.element.css(main.params.axis == 'Y' ? 'max-height' : 'max-width', main.preset_max_width_or_height);
					}
					
					// Update state				
					main.state = 'expanded';
					main.events.stateChange('expanded');
					// Reset after each round
					main.user_initiated = null;
					
					// Auto close
					if (main.params.expansion_timeout)
					{
						setTimeout(function()
						{
							main.collapse();
						}, main.params.expansion_timeout);
					}
				});
			}
		}
		
		main.collapse = function(force_close)
		{
			// This delay is needed 
			// in case user is moving mouse to hover on overview
			setTimeout(function()
			{
				// Respond to the hover case above
				if (!(main.params.trigger == 'hover' && main.element.is(':hover')) || force_close)
				{
					// Let's close
					if (main.state === 'expanded' || force_close)
					{
						var props = {};
						if (typeof main.params.fade_to === 'number')
						{
							props.opacity = main.params.fade_to;
						}
						
						if (main.override_collapsible)
						{
							main.element.removeClass(main.params.override_expand).addClass(main.params.override_collapse);
						}
						else
						{
							if (main.params.axis == 'Y')
							{
								props.maxHeight = '0px';
							}
							else
							{
								props.maxWidth = '0px';
							}
							
							// Init
							var current_width_or_height = main.params.axis == 'Y' ? main.element.outerHeight() : main.element.outerWidth();
							main.element.css(main.params.axis == 'Y' ? 'max-height' : 'max-width', current_width_or_height + 'px');
						}
						
						// Update state	
						main.state = 'collapsing';
						main.events.stateChange('collapsing');
				
						// Init
						//main.element.css('overflow', 'hidden');
						
						main.element.clearQueue().animate(props,
						Math.abs(main.params.animation_duration),
						function()
						{
							// Update state	
							main.state = 'collapsed';
							main.events.stateChange('collapsed');
							// Reset after each round
							main.user_initiated = null;
						});
					}
				}
				else
				{
					main
					//.element.off('mouseleave')
					.on('mouseleave', function()
					{
						main.collapse(true);
					})
				}
			}, main.close_delay);
		}
		
		
		
		
		
		
		
		
		
		
		main.execCollapsible = function()
		{
			var saved_state = main.element.attr('data-state');
			main.current_responses = {};
			if (main.params.collapsible_name)
			{
				main.Storage = Ox.Storage('Collapsibles', main.params.collapsible_name);
				// Lets talk about cookie
				var collapsible_persistent = main.Storage.getFromLocal();
				if (collapsible_persistent)
				{
					main.Collapsible_session = main.Storage.getFromSession();
					main.Collapsible_persistent = JSON.parse(collapsible_persistent);
					// We're returning current values by default
					main.current_responses = main.Collapsible_persistent;
					
					// This Overview has come up before
					if (main.Collapsible_persistent.preferred_default_state)
					{
						saved_state = main.Collapsible_persistent.preferred_default_state;
					}
					else if (main.Collapsible_persistent.last_state)
					{
						// Always use the saved permanent state.
						saved_state = main.Collapsible_persistent.last_state;
					}
				}
			}
			
			// Listen to custom, self events
			main.element
			.on(main.params.event_namespace + 'expand', function(e, d)
			{
				if (e.currentTarget === e.target)
				{
					main.expand();
				}
			})
			
			main.element
			.on(main.params.event_namespace + 'collapse', function(e, d)
			{
				if (e.currentTarget === e.target)
				{
					main.collapse();
				}
			})
			
			
			if (main.params.axis == 'X')
			{
				main.element.attr('data-axis', 'X');
			}
			else
			{
				main.element.attr('data-axis', 'Y');
			}
			
			if (main.override_collapsible)
			{
				main.element.attr('data-collapsible-override', 'true');
			}
			
			
			
			
			main.close_delay = 0;
			// ---------------------------------------------------------
			var trigger = function(e, true_state)
			{
				if (e.type == 'mouseleave')
				{
					main.close_delay = 150;
				}
				
				if (e && e.type)
				{
					main.user_initiated = true;
				}
				
				if (true_state !== false)
				{
					if (main.state == 'collapsed')
					{
						main.expand()
					}
					else if (main.params.control_toggle)
					{
						main.collapse();
					}
				}
				else
				{
					if (main.state == 'expanded')
					{
						main.collapse();
					}
				}
			}
			
			main.control.attachTrigger(main.params.trigger, trigger);
			// ---------------------------------------------------------
			
			/*Default*/
			if (saved_state === 'collapsed')
			{
				main.collapse(true/*force_close*/);
			}
			else// if (main.element.attr('data-state') == 'expanded') / always, the default
			{
				main.expand(true/*force_open*/);
			}
		}
		
		// The initialized event
		if (typeof main.params.OnInitialize === 'string')
		{
			window[main.params.OnInitialize].call(main);
		}
		else if (typeof main.params.OnInitialize === 'function')
		{
			main.params.OnInitialize.call(main);
		}
		
		main.execCollapsible();			
	}
})(jQuery);
